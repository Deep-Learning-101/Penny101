# 🚀 快速部署指南

## 本地端操作（已完成）✅

所有代碼修改已完成，無需在本地安裝或編譯。

---

## 雲端 VM 部署步驟

### Step 1: 推送代碼到 GitHub

```bash
cd /mnt/e/我的雲端硬碟/Writing/GitHub/Penny101

# 查看變更
git status

# 新增檔案
git add .

# 提交（可使用 COMMIT_MESSAGE.txt 內容）
git commit -F COMMIT_MESSAGE.txt

# 推送
git push origin main
```

---

### Step 2: 在雲端 VM 上拉取與部署

```bash
# 1. SSH 連接到雲端 VM
ssh your-vm-user@your-vm-ip

# 2. 進入專案目錄
cd /path/to/Penny101

# 3. 拉取最新代碼
git pull origin main

# 4. 執行資料庫遷移
docker-compose exec app npx drizzle-kit migrate

# 或使用 PostgreSQL 直接執行 SQL
docker-compose exec postgres psql -U postgres -d penny101 -f /app/drizzle/0002_add_transfer_and_sort_order.sql

# 5. 重新編譯與重啟服務
docker-compose down
docker-compose up -d --build

# 6. 檢查服務狀態
docker-compose ps
docker-compose logs -f app
```

---

### Step 3: 驗證功能

#### ✅ 檢查清單

1. **轉帳隔離驗證**
   - [ ] 打開首頁，檢查「總收入」與「總支出」
   - [ ] 匯入包含轉帳的 CSV（第 12 欄為「是」）
   - [ ] 確認轉帳不計入總收支
   - [ ] 檢查帳戶餘額（應包含轉帳變動）

2. **帳戶排序驗證**
   - [ ] 進入 `/accounts` 頁面
   - [ ] 點擊帳戶卡片右側的上下箭頭
   - [ ] 確認帳戶順序立即改變
   - [ ] 刷新頁面，確認順序保持

3. **時間篩選驗證**
   - [ ] 點擊任一帳戶進入明細頁
   - [ ] 切換時間範圍 Tabs（3m / 6m / 1y / 全部）
   - [ ] 確認交易筆數隨範圍改變
   - [ ] 檢查 URL 參數是否正確（`?range=6m`）

4. **財務看板驗證**
   - [ ] 進入 `/accounts` 頁面
   - [ ] 檢查頂部「總淨資產」卡片
   - [ ] 檢查「淨負債」卡片
   - [ ] 驗證數字正確（淨資產 = 所有餘額加總，負債 = 負數餘額絕對值）

5. **刷新餘額驗證**
   - [ ] 點擊「刷新餘額」按鈕
   - [ ] 確認顯示「刷新成功」訊息
   - [ ] 驗證所有帳戶餘額計算正確

---

## 🔧 故障排除

### 遷移失敗

```bash
# 檢查錯誤日誌
docker-compose logs app

# 手動執行 SQL
docker-compose exec postgres psql -U postgres -d penny101
\i /app/drizzle/0002_add_transfer_and_sort_order.sql
\q
```

### 服務無法啟動

```bash
# 檢查容器狀態
docker-compose ps

# 查看詳細日誌
docker-compose logs -f

# 重新編譯
docker-compose build --no-cache
docker-compose up -d
```

### TypeScript 編譯錯誤

```bash
# 進入容器檢查
docker-compose exec app sh
npm run build

# 如果有錯誤，檢查具體檔案
```

---

## 📋 快速回滾

如果部署後發現問題，可快速回滾：

```bash
# 1. 回滾 Git 版本
git revert HEAD
git push origin main

# 2. 在 VM 上拉取
git pull origin main

# 3. 回滾資料庫
docker-compose exec postgres psql -U postgres -d penny101
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "is_transfer";
ALTER TABLE "accounts" DROP COLUMN IF EXISTS "sort_order";
\q

# 4. 重啟服務
docker-compose down
docker-compose up -d
```

---

## 📞 聯絡資訊

- 詳細文檔：`MIGRATION_GUIDE.md`
- 變更日誌：`CHANGELOG.md`
- 重構總結：`REFACTORING_SUMMARY.md`

---

**部署時間預估：** 5-10 分鐘  
**停機時間：** < 1 分鐘（重啟服務時）  
**風險等級：** 🟢 低（有完整回滾方案）
