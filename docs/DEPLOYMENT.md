# Penny101 雲端部署指南

本文件說明如何將 Penny101 部署到 GCP (Google Cloud Platform) 或其他雲端環境。

## 目錄

- [前置準備](#前置準備)
- [GCP VM 初始設定](#gcp-vm-初始設定)
- [部署步驟](#部署步驟)
- [自動備份設定](#自動備份設定)
- [監控與維護](#監控與維護)
- [故障排除](#故障排除)

---

## 前置準備

### 1. GCP VM 規格建議

**最低配置（開發/測試）:**
- Machine type: e2-small (2 vCPU, 2GB RAM)
- Boot disk: 20GB SSD
- OS: Ubuntu 22.04 LTS

**生產環境建議:**
- Machine type: e2-medium (2 vCPU, 4GB RAM)
- Boot disk: 30GB SSD
- OS: Ubuntu 22.04 LTS

### 2. 防火牆規則

在 GCP 控制台設定以下防火牆規則：

```bash
# HTTP (如果使用反向代理)
gcloud compute firewall-rules create allow-http \
    --allow tcp:80 \
    --source-ranges 0.0.0.0/0 \
    --target-tags penny101-server

# HTTPS (如果使用反向代理)
gcloud compute firewall-rules create allow-https \
    --allow tcp:443 \
    --source-ranges 0.0.0.0/0 \
    --target-tags penny101-server

# Next.js (僅在開發時開放)
gcloud compute firewall-rules create allow-nextjs \
    --allow tcp:3000 \
    --source-ranges YOUR_IP/32 \
    --target-tags penny101-server
```

### 3. 必要軟體

- Docker & Docker Compose
- Git
- rclone (用於 Google Drive 備份)
- PostgreSQL client tools

---

## GCP VM 初始設定

### 1. 連線到 VM

```bash
gcloud compute ssh penny101-server --zone=asia-east1-a
```

### 2. 更新系統

```bash
sudo apt update && sudo apt upgrade -y
```

### 3. 安裝 Docker

```bash
# 安裝 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 將當前使用者加入 docker 群組
sudo usermod -aG docker $USER

# 安裝 Docker Compose
sudo apt install docker-compose-plugin -y

# 登出後重新登入以套用群組變更
exit
```

### 4. 安裝 PostgreSQL Client

```bash
sudo apt install postgresql-client -y
```

### 5. 安裝 rclone

```bash
# 安裝 rclone
curl https://rclone.org/install.sh | sudo bash

# 設定 Google Drive remote
rclone config
```

**rclone 設定步驟:**

```
n) New remote
name> gdrive
Storage> drive (選擇 Google Drive)
client_id> (直接按 Enter 使用預設)
client_secret> (直接按 Enter 使用預設)
scope> 1 (Full access)
root_folder_id> (直接按 Enter)
service_account_file> (直接按 Enter)
Edit advanced config? n
Use auto config? n (因為在遠端伺服器)
# 複製顯示的 URL 到本地瀏覽器進行授權
# 將取得的 authorization code 貼回
Configure this as a team drive? n
y) Yes this is OK
q) Quit config
```

### 6. 建立部署目錄

```bash
# 建立應用程式目錄
sudo mkdir -p /opt/penny101
sudo chown $USER:$USER /opt/penny101

# 建立日誌目錄
sudo mkdir -p /var/log/penny101
sudo chown $USER:$USER /var/log/penny101

# 建立資料庫資料目錄
sudo mkdir -p /opt/penny101/pg_data
sudo chown 999:999 /opt/penny101/pg_data  # PostgreSQL container UID
```

---

## 部署步驟

### 1. Clone 專案

```bash
cd /opt/penny101
git clone https://github.com/YOUR_USERNAME/Penny101.git .
```

### 2. 設定環境變數

```bash
# 建立 .env 檔案
cat > .env <<EOF
# 資料庫密碼（請更換為強密碼）
POSTGRES_PASSWORD=YOUR_STRONG_PASSWORD_HERE

# Node 環境
NODE_ENV=production
EOF

# 設定檔案權限
chmod 600 .env
```

### 3. 建置與啟動

```bash
# 使用生產環境 docker-compose
docker compose -f docker-compose.prod.yml build

# 啟動服務
docker compose -f docker-compose.prod.yml up -d

# 檢查服務狀態
docker compose -f docker-compose.prod.yml ps

# 檢查日誌
docker compose -f docker-compose.prod.yml logs -f
```

### 4. 初始化資料庫

```bash
# 進入 web 容器執行 migration
docker exec -it penny101-web-prod sh -c "npm run db:push"
```

### 5. 驗證部署

```bash
# 檢查資料庫連線
docker exec -it penny101-postgres-prod psql -U penny101 -d penny101 -c "\dt"

# 測試 Web 服務
curl http://localhost:3000
```

---

## 自動備份設定

### 1. 測試備份腳本

```bash
# 設定執行權限
chmod +x /opt/penny101/scripts/backup_to_gdrive.sh

# 測試備份
cd /opt/penny101
./scripts/backup_to_gdrive.sh
```

### 2. 設定 Crontab 自動備份

```bash
# 編輯 crontab
crontab -e
```

**Crontab 設定範例:**

```bash
# Penny101 自動備份設定
# 環境變數
POSTGRES_PASSWORD=YOUR_STRONG_PASSWORD_HERE
DB_HOST=localhost
DB_PORT=5432
DB_NAME=penny101
DB_USER=penny101

# 每天凌晨 2:00 執行備份
0 2 * * * cd /opt/penny101 && /opt/penny101/scripts/backup_to_gdrive.sh >> /var/log/penny101/cron.log 2>&1

# 每週日凌晨 3:00 清理舊日誌（保留最近 90 天）
0 3 * * 0 find /var/log/penny101 -name "*.log" -type f -mtime +90 -delete

# 每天凌晨 4:00 清理舊的 Docker 映像
0 4 * * * docker image prune -af --filter "until=720h" >> /var/log/penny101/docker-prune.log 2>&1
```

**其他排程範例:**

```bash
# 每 6 小時備份一次
0 */6 * * * cd /opt/penny101 && /opt/penny101/scripts/backup_to_gdrive.sh

# 每週一到五上午 9:00 備份
0 9 * * 1-5 cd /opt/penny101 && /opt/penny101/scripts/backup_to_gdrive.sh

# 每月 1 號凌晨 1:00 執行完整備份
0 1 1 * * cd /opt/penny101 && /opt/penny101/scripts/backup_to_gdrive.sh
```

### 3. 驗證 Crontab

```bash
# 檢查 crontab 是否正確設定
crontab -l

# 檢查 cron 服務狀態
sudo systemctl status cron

# 監控 cron 日誌
tail -f /var/log/penny101/cron.log
```

---

## 資料還原

### 1. 還原資料庫

```bash
# 設定執行權限
chmod +x /opt/penny101/scripts/restore_from_gdrive.sh

# 還原資料庫（互動模式）
cd /opt/penny101
./scripts/restore_from_gdrive.sh

# 或直接指定備份檔案
./scripts/restore_from_gdrive.sh penny101_backup_20260520_020000.sql.gz
```

### 2. Docker 模式還原

```bash
# 使用 Docker 模式還原
USE_DOCKER=true DOCKER_CONTAINER=penny101-postgres-prod ./scripts/restore_from_gdrive.sh
```

---

## 監控與維護

### 1. 系統監控

```bash
# 檢查 Docker 容器狀態
docker compose -f docker-compose.prod.yml ps

# 檢查資源使用
docker stats

# 檢查磁碟空間
df -h

# 檢查備份日誌
tail -100 /var/log/penny101/backup_$(date +"%Y%m").log
```

### 2. 更新應用程式

```bash
cd /opt/penny101

# 拉取最新程式碼
git pull

# 重新建置
docker compose -f docker-compose.prod.yml build

# 重啟服務
docker compose -f docker-compose.prod.yml up -d

# 執行 migration（如果有 schema 變更）
docker exec -it penny101-web-prod sh -c "npm run db:push"
```

### 3. 日誌管理

```bash
# 查看應用程式日誌
docker compose -f docker-compose.prod.yml logs -f web

# 查看資料庫日誌
docker compose -f docker-compose.prod.yml logs -f db

# 查看備份日誌
tail -f /var/log/penny101/backup_$(date +"%Y%m").log

# 清理舊日誌
find /var/log/penny101 -name "*.log" -type f -mtime +90 -delete
```

### 4. 資料庫維護

```bash
# 進入資料庫容器
docker exec -it penny101-postgres-prod psql -U penny101 -d penny101

# 執行 VACUUM（清理與優化）
VACUUM ANALYZE;

# 檢查資料庫大小
SELECT pg_size_pretty(pg_database_size('penny101'));

# 檢查資料表大小
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 故障排除

### 1. 容器無法啟動

```bash
# 檢查容器日誌
docker compose -f docker-compose.prod.yml logs

# 檢查環境變數是否正確
cat .env

# 重新建置並啟動
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

### 2. 資料庫連線失敗

```bash
# 檢查資料庫容器狀態
docker ps | grep postgres

# 檢查資料庫健康狀態
docker exec penny101-postgres-prod pg_isready -U penny101

# 檢查網路
docker network inspect penny101-network
```

### 3. 備份失敗

```bash
# 檢查備份日誌
tail -100 /var/log/penny101/backup_$(date +"%Y%m").log

# 測試 rclone 連線
rclone lsd gdrive:

# 手動執行備份以查看詳細錯誤
/opt/penny101/scripts/backup_to_gdrive.sh
```

### 4. 磁碟空間不足

```bash
# 清理 Docker 資源
docker system prune -af

# 清理舊備份
rm -f /tmp/penny101_backups/*.sql.gz

# 清理舊日誌
find /var/log/penny101 -name "*.log" -type f -mtime +30 -delete
```

### 5. 記憶體不足

```bash
# 檢查記憶體使用
free -h

# 重啟容器釋放記憶體
docker compose -f docker-compose.prod.yml restart

# 調整 docker-compose.prod.yml 的資源限制
```

---

## 安全建議

### 1. 防火牆設定

```bash
# 只允許特定 IP 存取 SSH
sudo ufw allow from YOUR_IP/32 to any port 22

# 允許 HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 啟用防火牆
sudo ufw enable
```

### 2. 定期更新

```bash
# 設定自動安全更新
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 3. 備份加密

考慮使用 rclone 的加密功能：

```bash
# 建立加密的 remote
rclone config

# 選擇 crypt 並設定基於 gdrive 的加密層
# 然後更新 backup_to_gdrive.sh 使用加密的 remote
```

### 4. 密碼政策

- 使用強密碼（至少 20 字元，包含大小寫字母、數字、特殊符號）
- 定期更換資料庫密碼
- 不要在 Git 提交 .env 檔案

---

## 效能優化

### 1. PostgreSQL 調校

編輯 `/opt/penny101/pg_data/postgresql.conf`：

```conf
# 根據 2GB RAM 的建議值
shared_buffers = 512MB
effective_cache_size = 1536MB
maintenance_work_mem = 128MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

### 2. Docker 優化

```bash
# 定期清理未使用的資源
docker system prune -af --volumes

# 限制日誌大小（已在 docker-compose.prod.yml 設定）
```

---

## 聯絡與支援

如有問題，請參考：
- GitHub Issues: https://github.com/YOUR_USERNAME/Penny101/issues
- 專案文件: /opt/penny101/docs/

---

**最後更新:** 2026-05-20
