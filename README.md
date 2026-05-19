# Penny101 - 私有化記帳系統

100% 私有化、高精度、時區絕對準確的記帳系統

## 技術棧

- **前端框架**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **UI 元件**: shadcn/ui + lucide-react
- **圖表**: recharts
- **資料庫**: PostgreSQL 15
- **ORM**: Drizzle ORM
- **金額計算**: decimal.js（浮點數零容忍）
- **時區處理**: dayjs + timezone plugin（Asia/Taipei UTC+8）

## 核心原則

### 1. 浮點數零容忍
- ❌ 禁止使用 JavaScript 原生 `Number` 進行金額計算
- ✅ 所有財務運算必須使用 `decimal.js`
- ✅ 資料庫金額欄位使用 `DECIMAL(12,2)`

### 2. 時區絕對防禦 (UTC+8)
- ✅ 強制使用 `Asia/Taipei` 時區
- ✅ 資料庫時間欄位使用 `TIMESTAMPTZ`
- ✅ 所有日期查詢以 UTC+8 午夜為切分點

### 3. Git 追蹤禁令
嚴格排除以下內容：
- `*.csv` - 財務資料
- `docs/` - 系統機密
- `pg_data/` - 資料庫掛載
- `scripts/credentials/` - API 金鑰
- `.env` - 環境變數

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 啟動資料庫（Docker）

```bash
docker-compose up -d db
```

### 3. 執行資料庫 Migration

```bash
npm run db:push
```

### 4. 啟動開發伺服器

```bash
npm run dev
```

訪問 [http://localhost:3000](http://localhost:3000)

## 資料庫 Schema

### accounts（帳戶）
- id, name, type（銀行/現金/電子支付）, currency, is_active

### categories（分類）
- id, name, type（支出/收入）, parent_id（支援主子分類階層）

### transactions（交易明細）
- id, transaction_date（TIMESTAMPTZ）, amount（DECIMAL 12,2）, type, account_id, category_id, memo

## 可用指令

```bash
npm run dev          # 啟動開發伺服器
npm run build        # 建置生產版本
npm run start        # 啟動生產伺服器
npm run lint         # 執行 ESLint
npm run db:generate  # 產生 migration 檔案
npm run db:push      # 推送 schema 到資料庫
npm run db:studio    # 啟動 Drizzle Studio
```

## Docker 部署

```bash
# 啟動所有服務
docker-compose up -d

# 停止所有服務
docker-compose down

# 查看日誌
docker-compose logs -f
```

## 備份與還原

詳見 `scripts/` 目錄：
- `backup_to_gdrive.sh` - 備份到 Google Drive
- `restore_from_gdrive.sh` - 從 Google Drive 還原

## 授權

ISC
