# 💰 Penny101

> 100% 私有化、高精度、時區絕對準確的個人記帳系統

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://www.postgresql.org/)

Penny101 是一個專為注重**隱私**、**精度**和**可靠性**的使用者設計的記帳系統。所有資料完全儲存在你的私有環境中，採用金融級數值計算，並正確處理時區問題。

---

## ✨ 核心特色

### 🔒 100% 私有化
- 所有資料儲存在你的 PostgreSQL 資料庫
- 無第三方雲端服務依賴
- 支援自動備份到 Google Drive（可選）
- 完整的資料所有權與控制權

### 🎯 金融級精度
- **零浮點數誤差**：使用 `decimal.js` 處理所有金額計算
- **資料庫精度保障**：`DECIMAL(12,2)` 型別確保數據一致性
- **無累積誤差**：千萬筆交易也不會有一分錢偏差

### ⏰ 時區絕對準確
- 強制使用 `Asia/Taipei` 時區（UTC+8）
- 所有日期查詢以台灣時間午夜為切分點
- `TIMESTAMPTZ` 型別確保跨時區資料正確性

### 📊 強大的功能
- **智能圓餅圖**：自動合併小額分類，避免標籤擁擠
- **主子分類**：支援兩層分類階層，靈活分類管理
- **帳戶管理**：多帳戶支援，初始餘額設定，計入統計控制
- **財務報表**：月度/年度趨勢、分類統計、每日趨勢圖
- **CSV 匯入**：支援外部記帳軟體格式，含容錯機制
- **彈性統計**：可選擇哪些交易/帳戶計入統計

---

## 🚀 快速開始

### 前置需求

- Node.js 18+ 
- Docker & Docker Compose
- PostgreSQL 15（或使用 Docker）

### 1. Clone 專案

```bash
git clone https://github.com/Deep-Learning-101/Penny101.git
cd Penny101
```

### 2. 安裝依賴

```bash
npm install
```

### 3. 設定環境變數

```bash
cp .env.example .env
```

編輯 `.env` 檔案（預設配置已可直接使用）：

```env
# 資料庫連線
DATABASE_URL=postgresql://penny101:penny101_dev_password@localhost:5432/penny101

# PostgreSQL 設定（用於 Docker Compose）
POSTGRES_PASSWORD=penny101_dev_password

# Node 環境
NODE_ENV=development
```

### 4. 啟動資料庫

```bash
# 使用 Docker Compose 啟動 PostgreSQL
docker-compose up -d db

# 檢查資料庫狀態
docker-compose ps
```

### 5. 初始化資料庫

```bash
# 推送 Schema 到資料庫
npm run db:push

# （可選）建立測試種子資料
npm run db:seed
```

### 6. 啟動開發伺服器

```bash
npm run dev
```

現在可以訪問 **http://localhost:3000** 🎉

---

## 📖 使用指南

### 基本操作流程

1. **設定帳戶與分類** (`/settings`)
   - 新增至少一個帳戶（例如：現金、銀行帳戶）
   - 新增分類（支援主分類和子分類）

2. **開始記帳** (首頁右下角 FAB 按鈕)
   - 選擇日期、類型（收入/支出）
   - 輸入金額
   - 選擇帳戶和分類
   - 新增備註（可選）

3. **查看統計** (首頁 `/` 和報表頁 `/reports`)
   - Dashboard：當月收支統計、圓餅圖、每日趨勢、最近交易
   - 報表：年度趨勢、月度分析、分類統計

4. **匯入資料** (`/settings` → 備份與還原)
   - 支援 CSV 匯入（格式：日期、類別、主分類、子分類、帳戶、金額、備註）
   - 自動建立缺失的帳戶和分類
   - 容錯機制：髒資料部分匯入

5. **備份資料**
   - 匯出 CSV：所有交易記錄
   - Google Drive 備份：自動備份腳本（見 `scripts/`）

---

## 🛠️ 可用指令

### 開發指令

```bash
npm run dev          # 啟動開發伺服器（http://localhost:3000）
npm run build        # 建置生產版本
npm run start        # 啟動生產伺服器
npm run lint         # 執行 ESLint 檢查
```

### 資料庫指令

```bash
npm run db:generate  # 產生 Drizzle migration 檔案
npm run db:push      # 推送 schema 到資料庫（開發用）
npm run db:migrate   # 執行 migration（生產用）
npm run db:studio    # 啟動 Drizzle Studio（視覺化資料庫管理）
npm run db:seed      # 建立測試種子資料
```

### 測試指令

```bash
npm run test:actions # 測試所有 Server Actions
```

---

## 🏗️ 技術架構

### 技術棧

| 類別 | 技術 | 說明 |
|------|------|------|
| **前端框架** | Next.js 15 (App Router) | React Server Components + TypeScript |
| **UI 元件** | shadcn/ui + Radix UI | 無障礙、可自訂的元件庫 |
| **樣式** | Tailwind CSS | Utility-first CSS 框架 |
| **圖表** | Recharts | React 圖表庫 |
| **資料庫** | PostgreSQL 15 | 關聯式資料庫 |
| **ORM** | Drizzle ORM | TypeScript-first ORM |
| **金額計算** | decimal.js | 高精度十進位運算 |
| **日期處理** | Day.js + timezone | 時區正確處理 |
| **CSV 解析** | PapaParse | 強大的 CSV 解析器 |

### 資料庫 Schema

```
accounts (帳戶)
├─ id, name, type, currency
├─ initial_balance       // 初始餘額
├─ include_in_total      // 是否計入總資產
└─ is_active, created_at, updated_at

categories (分類)
├─ id, name, type
├─ parent_id             // 支援主子分類
└─ created_at, updated_at

transactions (交易)
├─ id, transaction_date (TIMESTAMPTZ)
├─ amount (DECIMAL 12,2)
├─ type, account_id, category_id, memo
├─ include_in_stats      // 是否計入統計
└─ created_at, updated_at
```

### 資料夾結構

```
Penny101/
├── app/
│   ├── actions/           # Server Actions（後端邏輯）
│   ├── components/        # React 元件
│   ├── accounts/          # 帳戶頁面
│   ├── reports/           # 報表頁面
│   ├── settings/          # 設定頁面
│   └── page.tsx           # 首頁（Dashboard）
├── components/ui/         # shadcn/ui 元件
├── db/
│   ├── schema.ts          # 資料庫 Schema 定義
│   └── index.ts           # Drizzle 實例
├── lib/                   # 工具函式
├── drizzle/               # Migration 檔案
├── scripts/               # 工具腳本
│   ├── seed.ts            # 種子資料
│   ├── backup_to_gdrive.sh
│   └── restore_from_gdrive.sh
├── docs/                  # 文檔
└── docker-compose.yml     # Docker 配置
```

---

## 📚 詳細文檔

- **[部署指南](docs/DEPLOYMENT.md)** - GCP 部署、自動備份、效能優化
- **[測試指南](TESTING.md)** - Server Actions 測試流程
- **[儀表板指南](DASHBOARD_GUIDE.md)** - Dashboard 功能測試
- **[設定指南](SETTINGS_GUIDE.md)** - 帳戶與分類管理
- **[功能更新](FEATURES_UPDATE.md)** - 最新功能說明
- **[圓餅圖優化](PIE_CHART_OPTIMIZATION.md)** - 圖表優化說明

---

## 🐳 Docker 部署

### 開發環境

```bash
# 啟動資料庫
docker-compose up -d db

# 停止服務
docker-compose down
```

### 生產環境

```bash
# 建置並啟動所有服務
docker-compose -f docker-compose.prod.yml up -d --build

# 查看日誌
docker-compose -f docker-compose.prod.yml logs -f

# 停止服務
docker-compose -f docker-compose.prod.yml down
```

詳見 **[部署指南](docs/DEPLOYMENT.md)**

---

## 🔒 安全原則

### Git 追蹤禁令

以下內容嚴格排除在版本控制之外（已設定在 `.gitignore`）：

```
*.csv                    # 財務資料
pg_data/                 # 資料庫檔案
scripts/credentials/     # API 金鑰
.env                     # 環境變數
```

### 備份建議

- 定期備份資料庫（建議每日自動備份）
- 使用 `scripts/backup_to_gdrive.sh` 備份到 Google Drive
- 保留至少 30 天的備份歷史
- 測試備份還原流程

---

## 🎯 核心設計原則

### 1. 浮點數零容忍

```typescript
// ❌ 錯誤：使用 JavaScript Number
const total = 0.1 + 0.2; // 0.30000000000000004

// ✅ 正確：使用 decimal.js
import Decimal from "decimal.js";
const total = new Decimal(0.1).plus(0.2); // "0.3"
```

### 2. 時區絕對防禦

```typescript
// ✅ 強制使用 Asia/Taipei
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(timezone);
const date = dayjs().tz("Asia/Taipei"); // 永遠使用 UTC+8
```

### 3. 資料完整性

- 所有金額欄位使用 `DECIMAL(12,2)`
- 所有日期欄位使用 `TIMESTAMPTZ`
- 外鍵約束：`onDelete: "restrict"` 防止誤刪
- 交易記錄不可刪除（軟刪除）

---

## 🤝 貢獻指南

歡迎貢獻！請遵循以下原則：

1. **Fork 專案** 並建立你的功能分支
2. **遵守核心原則**：浮點數零容忍、時區防禦、資料完整性
3. **撰寫清晰的 Commit 訊息**
4. **測試你的改動**：執行 `npm run test:actions`
5. **提交 Pull Request**

### 開發規範

- TypeScript：嚴格模式
- ESLint：遵循專案配置
- Commit 格式：`feat: 新功能` / `fix: 修復問題` / `docs: 文檔更新`

---

## 📝 更新日誌

### v0.3.0 (2026-05-20)

**新增功能**
- ✨ 智能圓餅圖：自動合併小額分類（< 5%），解決標籤擁擠問題
- ✨ 帳戶初始餘額設定
- ✨ 帳戶/交易計入統計控制（可排除內部轉帳）
- ✨ CSV 匯入支援主子分類
- ✨ CSV 容錯機制：髒資料部分匯入

**修復問題**
- 🐛 修復 CSV 匯入標題列被當作資料的問題
- 🐛 修復日期和金額格式轉換導致的資料庫錯誤
- 🐛 修復子分類匯入被忽略的問題

**優化**
- 💄 圓餅圖顯示優化：條件式標籤、增強 Tooltip
- 🔧 錯誤訊息改善：顯示真實的系統錯誤

### v0.2.0 (2026-05-19)

- ✨ 財務報表系統上線
- ✨ CSV 匯入/匯出功能
- ✨ 帳戶餘額總覽
- 🐛 修復 SSR 衝突問題

### v0.1.0 (2026-05-18)

- 🎉 初始版本發佈
- ✅ 基本記帳功能
- ✅ 帳戶與分類管理
- ✅ Dashboard 統計

---

## 🐛 已知問題

目前沒有已知的嚴重問題。如發現 Bug，請到 [Issues](https://github.com/Deep-Learning-101/Penny101/issues) 回報。

---

## 📄 授權

本專案採用 [ISC License](LICENSE)。

---

## 🙏 致謝

- [Next.js](https://nextjs.org/) - React 框架
- [shadcn/ui](https://ui.shadcn.com/) - UI 元件
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [Recharts](https://recharts.org/) - 圖表庫
- [decimal.js](https://github.com/MikeMcl/decimal.js/) - 高精度運算

---

## 📬 聯絡方式

- GitHub Issues: [提交問題](https://github.com/Deep-Learning-101/Penny101/issues)
- Email: your-email@example.com（如果要公開）

---

**Built with ❤️ for personal finance management**
