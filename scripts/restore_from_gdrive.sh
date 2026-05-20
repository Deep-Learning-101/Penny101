#!/bin/bash

#############################################
# Penny101 資料庫還原腳本
# 功能：從 Google Drive 還原 PostgreSQL 備份
# 使用方式：./restore_from_gdrive.sh [備份檔名]
#############################################

set -e  # 發生錯誤時立即退出

# ============================================
# 設定區
# ============================================

# 資料庫設定
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-penny101}"
DB_USER="${DB_USER:-penny101}"
DB_PASSWORD="${POSTGRES_PASSWORD:-penny101_dev_password}"

# 還原設定
RESTORE_DIR="/tmp/penny101_restores"
BACKUP_FILENAME="$1"  # 從命令列參數取得

# Google Drive 設定（使用 rclone）
GDRIVE_REMOTE="gdrive"  # rclone remote 名稱
GDRIVE_FOLDER="Penny101_Backups"  # Google Drive 資料夾名稱

# 日誌設定
LOG_DIR="/var/log/penny101"
LOG_FILE="${LOG_DIR}/restore_$(date +"%Y%m").log"

# Docker 設定（如果使用 Docker）
DOCKER_CONTAINER="${DOCKER_CONTAINER:-penny101-postgres}"
USE_DOCKER="${USE_DOCKER:-false}"

# ============================================
# 函式定義
# ============================================

# 日誌函式
log() {
    local level=$1
    shift
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [$level] $*" | tee -a "$LOG_FILE"
}

# 建立必要目錄
create_directories() {
    mkdir -p "$RESTORE_DIR"
    mkdir -p "$LOG_DIR"
    log "INFO" "已建立還原目錄：$RESTORE_DIR"
}

# 檢查必要工具
check_dependencies() {
    log "INFO" "檢查必要工具..."

    if ! command -v psql &> /dev/null; then
        log "ERROR" "psql 未安裝，請安裝 PostgreSQL 客戶端工具"
        exit 1
    fi

    if ! command -v rclone &> /dev/null; then
        log "ERROR" "rclone 未安裝，請參考：https://rclone.org/install/"
        exit 1
    fi

    if [ "$USE_DOCKER" = "true" ] && ! command -v docker &> /dev/null; then
        log "ERROR" "Docker 未安裝，但設定為使用 Docker 模式"
        exit 1
    fi

    log "INFO" "所有必要工具已安裝"
}

# 檢查 rclone 設定
check_rclone_config() {
    log "INFO" "檢查 rclone 設定..."

    if ! rclone listremotes | grep -q "^${GDRIVE_REMOTE}:$"; then
        log "ERROR" "rclone remote '${GDRIVE_REMOTE}' 未設定"
        log "ERROR" "請執行：rclone config"
        exit 1
    fi

    log "INFO" "rclone 設定正確"
}

# 列出可用的備份檔案
list_available_backups() {
    log "INFO" "列出 Google Drive 上的備份檔案..."

    local remote_path="${GDRIVE_REMOTE}:${GDRIVE_FOLDER}"

    echo ""
    echo "=========================================="
    echo "可用的備份檔案："
    echo "=========================================="

    rclone lsl "$remote_path" --include "penny101_backup_*.sql.gz" | \
        awk '{print $4}' | \
        sort -r | \
        nl -w2 -s'. '

    echo "=========================================="
    echo ""
}

# 選擇備份檔案
select_backup_file() {
    if [ -n "$BACKUP_FILENAME" ]; then
        log "INFO" "使用指定的備份檔案：$BACKUP_FILENAME"
        return
    fi

    list_available_backups

    read -p "請輸入要還原的備份檔案名稱（或輸入編號）: " user_input

    # 如果輸入的是數字，從列表中取得檔名
    if [[ "$user_input" =~ ^[0-9]+$ ]]; then
        local remote_path="${GDRIVE_REMOTE}:${GDRIVE_FOLDER}"
        BACKUP_FILENAME=$(rclone lsl "$remote_path" --include "penny101_backup_*.sql.gz" | \
            awk '{print $4}' | \
            sort -r | \
            sed -n "${user_input}p")

        if [ -z "$BACKUP_FILENAME" ]; then
            log "ERROR" "無效的編號"
            exit 1
        fi
    else
        BACKUP_FILENAME="$user_input"
    fi

    log "INFO" "選擇的備份檔案：$BACKUP_FILENAME"
}

# 從 Google Drive 下載備份
download_from_gdrive() {
    log "INFO" "從 Google Drive 下載備份..."

    local remote_file="${GDRIVE_REMOTE}:${GDRIVE_FOLDER}/${BACKUP_FILENAME}"
    local local_file="${RESTORE_DIR}/${BACKUP_FILENAME}"

    if rclone copy "$remote_file" "$RESTORE_DIR" --progress --transfers 1 --checkers 1; then
        log "INFO" "下載成功：$local_file"
        RESTORE_PATH="$local_file"
    else
        log "ERROR" "從 Google Drive 下載失敗"
        exit 1
    fi
}

# 驗證備份檔案
verify_backup() {
    log "INFO" "驗證備份檔案完整性..."

    # 檢查檔案是否存在
    if [ ! -f "$RESTORE_PATH" ]; then
        log "ERROR" "備份檔案不存在：$RESTORE_PATH"
        exit 1
    fi

    # 檢查檔案大小
    local file_size=$(stat -f%z "$RESTORE_PATH" 2>/dev/null || stat -c%s "$RESTORE_PATH" 2>/dev/null)
    if [ "$file_size" -lt 1024 ]; then
        log "ERROR" "備份檔案過小，可能不完整"
        exit 1
    fi

    # 測試 gzip 檔案完整性
    if gzip -t "$RESTORE_PATH" 2>/dev/null; then
        log "INFO" "備份檔案驗證成功"
    else
        log "ERROR" "備份檔案損壞"
        exit 1
    fi
}

# 確認還原操作
confirm_restore() {
    log "WARNING" "=========================================="
    log "WARNING" "⚠️  警告：還原操作將會覆蓋現有資料庫"
    log "WARNING" "=========================================="
    log "WARNING" "資料庫名稱：$DB_NAME"
    log "WARNING" "備份檔案：$BACKUP_FILENAME"
    log "WARNING" "=========================================="

    echo ""
    read -p "確定要繼續嗎？(輸入 YES 以確認): " confirm

    if [ "$confirm" != "YES" ]; then
        log "INFO" "使用者取消還原操作"
        exit 0
    fi

    log "INFO" "使用者確認還原操作"
}

# 停止 Docker 容器（如果使用 Docker）
stop_docker_container() {
    if [ "$USE_DOCKER" = "true" ]; then
        log "INFO" "停止 Docker 容器：$DOCKER_CONTAINER"

        if docker ps -q -f name="$DOCKER_CONTAINER" | grep -q .; then
            docker stop "$DOCKER_CONTAINER"
            log "INFO" "容器已停止"
        else
            log "INFO" "容器未運行"
        fi
    fi
}

# 啟動 Docker 容器（如果使用 Docker）
start_docker_container() {
    if [ "$USE_DOCKER" = "true" ]; then
        log "INFO" "啟動 Docker 容器：$DOCKER_CONTAINER"
        docker start "$DOCKER_CONTAINER"

        # 等待資料庫啟動
        log "INFO" "等待資料庫啟動..."
        sleep 10

        log "INFO" "容器已啟動"
    fi
}

# 還原資料庫
restore_database() {
    log "INFO" "開始還原資料庫：$DB_NAME"

    # 設定密碼環境變數
    export PGPASSWORD="$DB_PASSWORD"

    # 解壓縮並還原資料庫
    if gunzip -c "$RESTORE_PATH" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"; then
        log "INFO" "資料庫還原成功"
    else
        log "ERROR" "資料庫還原失敗"
        exit 1
    fi

    # 清除密碼環境變數
    unset PGPASSWORD
}

# 驗證還原結果
verify_restore() {
    log "INFO" "驗證還原結果..."

    # 設定密碼環境變數
    export PGPASSWORD="$DB_PASSWORD"

    # 檢查資料表是否存在
    local table_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)

    # 清除密碼環境變數
    unset PGPASSWORD

    if [ "$table_count" -gt 0 ]; then
        log "INFO" "還原驗證成功（找到 $table_count 個資料表）"
    else
        log "ERROR" "還原驗證失敗（未找到資料表）"
        exit 1
    fi
}

# 清理暫存檔案
cleanup() {
    log "INFO" "清理暫存檔案..."
    rm -f "$RESTORE_PATH"
    log "INFO" "暫存檔案已清理"
}

# 發送通知（可選）
send_notification() {
    local status=$1
    local message=$2

    # 範例：使用 mail 指令發送通知
    # echo "$message" | mail -s "Penny101 還原通知 - $status" your-email@example.com

    log "INFO" "通知：$status - $message"
}

# ============================================
# 主程式
# ============================================

main() {
    log "INFO" "=========================================="
    log "INFO" "Penny101 資料庫還原開始"
    log "INFO" "=========================================="

    # 1. 建立目錄
    create_directories

    # 2. 檢查依賴
    check_dependencies
    check_rclone_config

    # 3. 選擇備份檔案
    select_backup_file

    # 4. 下載備份
    download_from_gdrive

    # 5. 驗證備份
    verify_backup

    # 6. 確認還原
    confirm_restore

    # 7. 停止容器（如果使用 Docker）
    stop_docker_container

    # 8. 還原資料庫
    restore_database

    # 9. 啟動容器（如果使用 Docker）
    start_docker_container

    # 10. 驗證還原
    verify_restore

    # 11. 清理暫存檔案
    cleanup

    log "INFO" "=========================================="
    log "INFO" "資料庫還原完成！"
    log "INFO" "備份檔案：$BACKUP_FILENAME"
    log "INFO" "=========================================="

    # 12. 發送成功通知
    send_notification "SUCCESS" "資料庫還原成功完成"
}

# 錯誤處理
trap 'log "ERROR" "還原過程發生錯誤"; send_notification "ERROR" "還原失敗"; exit 1' ERR

# 執行主程式
main
