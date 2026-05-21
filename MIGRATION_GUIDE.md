# Penny101 架構重構遷移指南

## 概述

本次更新包含五大核心功能：

1. **轉帳功能隔離** - 避免轉帳交易污染收支統計
2. **帳戶初始餘額** - 支援設定初始餘額並一鍵重新計算
3. **帳戶明細頁效能優化** - 支援時間篩選（預設 6 個月）
4. **帳戶手動排序** - 自由調整帳戶顯示順序
5. **淨資產與負債統計** - 帳戶總覽新增財務健康度看板

## 資料庫遷移步驟

### Schema 變更

本次更新新增了以下欄位：

- `transactions.is_transfer` (boolean) - 標記轉帳交易
- `accounts.sort_order` (integer) - 帳戶排序順序

### 在雲端 VM 上執行遷移

```bash
# 1. 進入專案目錄
cd /path/to/Penny101

# 2. 拉取最新代碼
git pull origin main

# 3. 執行資料庫遷移（使用 Docker）
docker-compose exec app npx drizzle-kit migrate

# 或者直接執行 SQL
docker-compose exec postgres psql -U postgres -d penny101 -f /app/drizzle/0002_add_transfer_and_sort_order.sql

# 4. 重新編譯與重啟服務
docker-compose down
docker-compose up -d --build
```

### 手動執行遷移 SQL（如果需要）

```sql
-- 新增 transactions.is_transfer 欄位
ALTER TABLE "transactions" ADD COLUMN "is_transfer" boolean DEFAULT false NOT NULL;

-- 新增 accounts.sort_order 欄位
ALTER TABLE "accounts" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;

-- 為現有帳戶初始化 sort_order
UPDATE "accounts" SET "sort_order" = "id" WHERE "sort_order" = 0;

-- 建立索引
CREATE INDEX IF NOT EXISTS "idx_transactions_is_transfer" ON "transactions" ("is_transfer");
CREATE INDEX IF NOT EXISTS "idx_accounts_sort_order" ON "accounts" ("sort_order");
```

## 功能說明

### 1. 轉帳功能隔離

**變更說明：**
- 新增 `isTransfer` 欄位於 `transactions` 表
- CSV 匯入時，第 12 欄若為「是」則標記為轉帳
- 所有收支統計查詢已加上 `eq(transactions.isTransfer, false)` 條件
- **重要：** 帳戶餘額計算仍包含轉帳交易（支出扣除、收入增加）

**影響範圍：**
- `app/actions/finance.ts` - getDashboardStats, getMonthlyCategoryPie, getDailyTrend
- `app/actions/reports.ts` - 所有報表統計函數
- `app/actions/backup.ts` - CSV 匯入邏輯

### 2. 帳戶初始餘額與一鍵重算

**變更說明：**
- 帳戶餘額公式：`餘額 = initialBalance + 總收入 - 總支出`
- 新增「刷新餘額」按鈕（`/accounts` 頁面右上角）
- 點擊後會重新計算所有帳戶餘額並刷新頁面

**新增 Actions：**
- `recalculateAllBalances()` - 重新計算所有帳戶餘額

### 3. 帳戶明細頁效能優化

**變更說明：**
- 預設只載入近 6 個月的交易記錄
- 支援切換時間範圍：3 個月、6 個月、1 年、全部
- 透過 URL 參數 `?range=6m` 控制

**新增組件：**
- `TimeRangeSelector` - 時間範圍選擇器（Tabs）

**修改 Action：**
- `getAccountTransactions()` 新增 `range` 參數

### 4. 帳戶手動排序

**變更說明：**
- 新增 `sortOrder` 欄位於 `accounts` 表
- 帳戶列表按 `sortOrder` 排序
- 每個帳戶卡片右側顯示上下箭頭按鈕

**新增 Actions：**
- `swapAccountOrder()` - 調換兩個帳戶的排序順序

**新增組件：**
- `AccountSortButtons` - 排序按鈕組件

### 5. 淨資產與負債統計

**變更說明：**
- 帳戶總覽頁面頂部新增兩張統計卡片
- **總淨資產 (Net Worth)** - 所有帳戶餘額加總（含負債）
- **淨負債 (Total Liabilities)** - 僅負數帳戶的絕對值加總

**新增 Action：**
- `getAccountsSummary()` - 計算淨資產與負債

## 測試建議

### 1. 測試轉帳隔離
```bash
# 匯入包含轉帳的 CSV
# 檢查首頁總收入/總支出是否正確（應排除轉帳）
# 檢查帳戶餘額是否正確（應包含轉帳）
```

### 2. 測試帳戶排序
```bash
# 進入 /accounts 頁面
# 點擊上下箭頭調整順序
# 刷新頁面確認順序保持
```

### 3. 測試時間篩選
```bash
# 點擊任一帳戶進入明細頁
# 切換不同時間範圍
# 確認載入的資料筆數正確
```

### 4. 測試餘額重算
```bash
# 點擊「刷新餘額」按鈕
# 確認所有帳戶餘額計算正確
```

## 已知限制

- 帳戶排序僅支援拖曳相鄰帳戶（上移/下移），不支援跨越式拖曳
- 時間篩選僅影響帳戶明細頁，不影響其他頁面
- CSV 匯入的轉帳標記依賴第 12 欄格式（「是」、「true」、「1」）

## 回滾計畫

如需回滾到舊版本：

```sql
-- 移除新增欄位
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "is_transfer";
ALTER TABLE "accounts" DROP COLUMN IF EXISTS "sort_order";

-- 移除索引
DROP INDEX IF EXISTS "idx_transactions_is_transfer";
DROP INDEX IF EXISTS "idx_accounts_sort_order";
```

## 聯絡資訊

如有問題請查看：
- GitHub Issues
- CHANGELOG.md
