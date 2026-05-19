#!/bin/bash

#############################################
# Penny101 資料庫備份腳本
# 功能：備份 PostgreSQL 到 Google Drive
# 使用方式：./backup_to_gdrive.sh
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

# 備份設定
BACKUP_DIR="/tmp/penny101_backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="penny101_backup_${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"

# Google Drive 設定（使用 rclone）
GDRIVE_REMOTE="gdrive"  # rclone remote 名稱
GDRIVE_FOLDER="Penny101_Backups"  # Google Drive 資料夾名稱

# 保留備份數量（本地與雲端）
KEEP_LOCAL_BACKUPS=3
KEEP_GDRIVE_BACKUPS=30

# 日誌設定
LOG_DIR="/var/log/penny101"
LOG_FILE="${LOG_DIR}/backup_$(date +"%Y%m").log"

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
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
    log "INFO" "已建立備份目錄：$BACKUP_DIR"
}

# 檢查必要工具
check_dependencies() {
    log "INFO" "檢查必要工具..."

    if ! command -v pg_dump &> /dev/null; then
        log "ERROR" "pg_dump 未安裝，請安裝 PostgreSQL 客戶端工具"
        exit 1
    fi

    if ! command -v rclone &> /dev/null; then
        log "ERROR" "rclone 未安裝，請參考：https://rclone.org/install/"
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

# 執行資料庫備份
backup_database() {
    log "INFO" "開始備份資料庫：$DB_NAME"

    # 設定密碼環境變數
    export PGPASSWORD="$DB_PASSWORD"

    # 執行 pg_dump 並壓縮
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --no-owner --no-acl --clean --if-exists \
        | gzip > "$BACKUP_PATH"; then

        local backup_size=$(du -h "$BACKUP_PATH" | cut -f1)
        log "INFO" "資料庫備份成功：$BACKUP_FILENAME (大小：$backup_size)"
    else
        log "ERROR" "資料庫備份失敗"
        exit 1
    fi

    # 清除密碼環境變數
    unset PGPASSWORD
}

# 上傳到 Google Drive
upload_to_gdrive() {
    log "INFO" "上傳備份到 Google Drive..."

    if rclone copy "$BACKUP_PATH" "${GDRIVE_REMOTE}:${GDRIVE_FOLDER}" \
        --progress --transfers 1 --checkers 1; then
        log "INFO" "上傳成功：${GDRIVE_REMOTE}:${GDRIVE_FOLDER}/${BACKUP_FILENAME}"
    else
        log "ERROR" "上傳到 Google Drive 失敗"
        exit 1
    fi
}

# 清理舊的本地備份
cleanup_local_backups() {
    log "INFO" "清理舊的本地備份（保留最近 ${KEEP_LOCAL_BACKUPS} 個）..."

    local backup_count=$(ls -1 "$BACKUP_DIR"/penny101_backup_*.sql.gz 2>/dev/null | wc -l)

    if [ "$backup_count" -gt "$KEEP_LOCAL_BACKUPS" ]; then
        ls -1t "$BACKUP_DIR"/penny101_backup_*.sql.gz | tail -n +$((KEEP_LOCAL_BACKUPS + 1)) | xargs rm -f
        log "INFO" "已刪除 $((backup_count - KEEP_LOCAL_BACKUPS)) 個舊備份"
    else
        log "INFO" "本地備份數量未超過限制，無需清理"
    fi
}

# 清理舊的 Google Drive 備份
cleanup_gdrive_backups() {
    log "INFO" "清理舊的 Google Drive 備份（保留最近 ${KEEP_GDRIVE_BACKUPS} 個）..."

    # 列出所有備份檔案（按時間排序）
    local remote_path="${GDRIVE_REMOTE}:${GDRIVE_FOLDER}"
    local backup_files=$(rclone lsf "$remote_path" --files-only | grep "penny101_backup_.*\.sql\.gz" | sort -r)
    local backup_count=$(echo "$backup_files" | wc -l)

    if [ "$backup_count" -gt "$KEEP_GDRIVE_BACKUPS" ]; then
        echo "$backup_files" | tail -n +$((KEEP_GDRIVE_BACKUPS + 1)) | while read -r file; do
            rclone delete "${remote_path}/${file}"
            log "INFO" "已刪除雲端備份：$file"
        done
    else
        log "INFO" "雲端備份數量未超過限制，無需清理"
    fi
}

# 驗證備份完整性
verify_backup() {
    log "INFO" "驗證備份完整性..."

    # 檢查本地檔案
    if [ ! -f "$BACKUP_PATH" ]; then
        log "ERROR" "本地備份檔案不存在"
        exit 1
    fi

    # 檢查檔案大小
    local file_size=$(stat -f%z "$BACKUP_PATH" 2>/dev/null || stat -c%s "$BACKUP_PATH" 2>/dev/null)
    if [ "$file_size" -lt 1024 ]; then
        log "ERROR" "備份檔案過小，可能不完整"
        exit 1
    fi

    # 測試 gzip 檔案完整性
    if gzip -t "$BACKUP_PATH" 2>/dev/null; then
        log "INFO" "備份檔案驗證成功"
    else
        log "ERROR" "備份檔案損壞"
        exit 1
    fi
}

# 發送通知（可選，需要設定 mail 或其他通知工具）
send_notification() {
    local status=$1
    local message=$2

    # 範例：使用 mail 指令發送通知
    # echo "$message" | mail -s "Penny101 備份通知 - $status" your-email@example.com

    log "INFO" "通知：$status - $message"
}

# ============================================
# 主程式
# ============================================

main() {
    log "INFO" "=========================================="
    log "INFO" "Penny101 資料庫備份開始"
    log "INFO" "=========================================="

    # 1. 建立目錄
    create_directories

    # 2. 檢查依賴
    check_dependencies
    check_rclone_config

    # 3. 執行備份
    backup_database

    # 4. 驗證備份
    verify_backup

    # 5. 上傳到 Google Drive
    upload_to_gdrive

    # 6. 清理舊備份
    cleanup_local_backups
    cleanup_gdrive_backups

    log "INFO" "=========================================="
    log "INFO" "資料庫備份完成！"
    log "INFO" "本地備份：$BACKUP_PATH"
    log "INFO" "雲端備份：${GDRIVE_REMOTE}:${GDRIVE_FOLDER}/${BACKUP_FILENAME}"
    log "INFO" "=========================================="

    # 7. 發送成功通知
    send_notification "SUCCESS" "資料庫備份成功完成"
}

# 錯誤處理
trap 'log "ERROR" "備份過程發生錯誤"; send_notification "ERROR" "備份失敗"; exit 1' ERR

# 執行主程式
main
