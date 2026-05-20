# 🚀 Penny101 快速開始指南

本指南將帶你在 **5 分鐘內** 完成 Penny101 的安裝和首次記帳。

---

## 📋 前置需求檢查

在開始之前，請確認你的電腦已安裝：

```bash
# 檢查 Node.js 版本（需要 18+）
node --version  # 應該顯示 v18.x.x 或更高

# 檢查 npm 版本
npm --version

# 檢查 Docker 是否安裝
docker --version
docker-compose --version
```

如果缺少任何工具，請先安裝：
- **Node.js**: https://nodejs.org/
- **Docker Desktop**: https://www.docker.com/products/docker-desktop/

---

## ⚡ 快速安裝（3 分鐘）

### 步驟 1: Clone 專案

```bash
git clone https://github.com/Deep-Learning-101/Penny101.git
cd Penny101
```

### 步驟 2: 安裝依賴

```bash
npm install
```

> 🕐 這個步驟可能需要 1-2 分鐘，請耐心等待

### 步驟 3: 設定環境變數

```bash
# 複製範例檔案（Windows 請用 copy）
cp .env.example .env
```

預設配置已經可以直接使用，無需修改！

### 步驟 4: 啟動資料庫

```bash
docker-compose up -d db
```

> 📦 首次執行會下載 PostgreSQL 映像檔，可能需要 1-2 分鐘

確認資料庫已啟動：

```bash
docker-compose ps

# 應該看到類似輸出：
# NAME                    STATUS
# penny101-postgres-dev   Up X seconds
```

### 步驟 5: 初始化資料庫

```bash
# 推送 Schema 到資料庫
npm run db:push

# 建立測試資料（可選但建議）
npm run db:seed
```

成功後你會看到：

```
✅ Applying SQL statements
✅ Done!

🌱 開始建立種子資料...
✅ 建立 3 個帳戶
✅ 建立支出分類（4 個主分類，11 個子分類）
✅ 建立收入分類（3 個主分類）
✅ 建立 10 筆交易記錄
✅ 種子資料建立完成！
```

### 步驟 6: 啟動應用程式

```bash
npm run dev
```

看到以下訊息表示成功：

```
  ▲ Next.js 15.x.x
  - Local:        http://localhost:3000
  - Environments: .env

 ✓ Ready in X.XXs
```

### 🎉 完成！

現在打開瀏覽器訪問：**http://localhost:3000**

---

## 🎯 第一次使用（2 分鐘）

### 1. 瀏覽 Dashboard

你會看到：
- 📊 當月收支統計
- 🥧 支出分類圓餅圖
- 📈 每日支出趨勢
- 📝 最近交易清單

> 如果你執行了 `npm run db:seed`，這些圖表已經有測試資料了！

### 2. 新增你的第一筆交易

1. 點擊右下角的 **藍色 ➕ 按鈕**（FAB）
2. 填寫資訊：
   - 日期：選擇今天
   - 類型：選擇「支出」
   - 金額：輸入 `120`
   - 帳戶：選擇「現金」
   - 分類：選擇「飲食 > 午餐」
   - 備註：輸入「便當」（可選）
3. 點擊「儲存」

恭喜！你剛新增了第一筆記帳 🎊

### 3. 查看統計更新

返回首頁，你會看到：
- 總支出數字增加了 NT$ 120
- 圓餅圖更新，「飲食」分類變大了
- 這筆交易出現在「最近交易」列表頂端

---

## 📚 接下來做什麼？

### 管理帳戶和分類

訪問 **設定頁面**：http://localhost:3000/settings

你可以：
- ➕ 新增自己的帳戶（例如：台新銀行、悠遊卡）
- ➕ 新增自己的分類（例如：房租、訂閱費用）
- ✏️ 編輯現有分類
- 🗑️ 刪除不需要的分類

### 查看詳細報表

訪問 **報表頁面**：http://localhost:3000/reports

你可以看到：
- 📈 全年收支趨勢
- 📊 年度各月結餘
- 🥧 本月/全年支出分類統計
- 🏆 支出排行榜

### 查看帳戶餘額

訪問 **帳戶頁面**：http://localhost:3000/accounts

你可以：
- 查看所有帳戶的即時餘額
- 點擊帳戶查看該帳戶的所有交易明細

### 匯入現有資料

如果你之前用其他記帳軟體，可以匯入資料：

1. 前往 **設定頁面** → **備份與還原**
2. 點擊「匯入 CSV」
3. 選擇你的 CSV 檔案（格式需符合範例）
4. 系統會自動建立缺失的帳戶和分類

---

## 🛠️ 常見問題

### Q: 資料庫無法啟動？

**檢查 Docker 是否正在執行**：

```bash
docker ps
```

如果沒有輸出，請啟動 Docker Desktop。

**檢查 Port 5432 是否被佔用**：

```bash
# macOS/Linux
lsof -i :5432

# Windows
netstat -ano | findstr :5432
```

如果 Port 被佔用，可以修改 `docker-compose.yml` 的 Port 設定。

### Q: npm install 失敗？

**清除快取重試**：

```bash
rm -rf node_modules package-lock.json
npm install
```

**確認 Node.js 版本**：

```bash
node --version  # 必須是 v18 或更高
```

### Q: npm run dev 顯示資料庫連線錯誤？

**檢查 .env 檔案**：

```bash
cat .env

# 應該包含：
DATABASE_URL=postgresql://penny101:penny101_dev_password@localhost:5432/penny101
```

**確認資料庫已啟動**：

```bash
docker-compose ps
docker-compose logs db
```

### Q: 頁面空白或沒有資料？

**建立種子資料**：

```bash
npm run db:seed
```

**或手動新增資料**：

1. 前往設定頁面新增帳戶和分類
2. 使用 FAB 按鈕新增交易

### Q: 想重新開始？

**清空所有資料**：

```bash
# 停止並刪除資料庫 Volume
docker-compose down -v

# 重新啟動並初始化
docker-compose up -d db
npm run db:push
npm run db:seed
```

---

## 🎓 學習資源

- **完整文檔**: [README.md](README.md)
- **部署指南**: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **功能說明**: [FEATURES_UPDATE.md](FEATURES_UPDATE.md)
- **測試指南**: [TESTING.md](TESTING.md)

---

## 💡 專業提示

### 每日記帳習慣

1. **即時記錄**：消費後立即記帳，不要累積
2. **使用備註**：記錄消費地點或原因，方便日後查詢
3. **定期檢視**：每週檢視一次報表，了解消費趨勢
4. **善用分類**：建立符合自己生活的分類系統

### 分類建議

**支出分類範例**：
- 飲食 → 早餐、午餐、晚餐、飲料、零食
- 交通 → 捷運、公車、計程車、加油、停車
- 居家 → 房租、水電、網路、瓦斯、物業費
- 購物 → 服飾、3C、日用品、書籍
- 娛樂 → 電影、遊戲、運動、旅遊
- 醫療 → 看診、藥品、保健食品
- 教育 → 課程、書籍、線上訂閱

**收入分類範例**：
- 薪資 → 正職薪資、兼職收入、獎金
- 投資 → 股票、基金、利息
- 其他 → 紅包、退款、副業

### 備份建議

定期備份資料，避免資料遺失：

```bash
# 方法 1: 匯出 CSV（在設定頁面）
# 下載後妥善保存

# 方法 2: 資料庫備份（推薦）
# 設定自動備份到 Google Drive
# 詳見 docs/DEPLOYMENT.md
```

---

## 🚀 進階使用

準備好進階使用了嗎？

- **部署到雲端**：[部署指南](docs/DEPLOYMENT.md)
- **自動備份**：設定 cron job 自動備份
- **效能優化**：PostgreSQL 調校
- **安全加固**：防火牆、SSL、密碼政策

---

## ❤️ 享受使用 Penny101！

如果遇到問題或有建議，歡迎：
- 📧 提交 [GitHub Issue](https://github.com/Deep-Learning-101/Penny101/issues)
- ⭐ 給專案一顆星星
- 🔄 分享給朋友

**Happy Accounting! 💰**
