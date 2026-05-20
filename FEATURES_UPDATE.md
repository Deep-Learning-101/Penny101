# 功能更新說明

## 版本：2026-05-20

### 1. CSV 匯入支援主子分類

**問題**：之前匯入 CSV 時只會建立主分類，完全忽略子分類欄位。

**解決方案**：
- 現在會正確讀取 CSV 的第 3 欄（子分類）
- 自動建立主分類與子分類的階層關係
- 使用 `主分類>子分類` 作為唯一識別 key，避免重複建立

**CSV 格式範例**：
```csv
"日期","類別","主分類","子分類","帳戶","專案","金額","匯率","小計","更新時間","地址","發票號碼","轉帳","備註"
"2024-01-01","支出","飲食","早餐","現金","","100","","","","","","",""
```

### 2. 帳戶初始餘額設定

**新增欄位**：
- `initial_balance`：帳戶的初始餘額（預設為 0）
- 可在新增或編輯帳戶時設定

**餘額計算邏輯**：
```
帳戶餘額 = 初始餘額 + 所有收入 - 所有支出
```

**使用情境**：
- 匯入現有帳戶時，可設定當前實際餘額作為初始值
- 從其他記帳系統遷移時，直接設定初始餘額即可

### 3. 帳戶計入總資產控制

**新增欄位**：
- `include_in_total`：是否計入總資產統計（預設為 true）

**使用情境**：
- 某些帳戶不想計入總資產（例如：借出款項、待確認款項）
- 可在帳戶設定中關閉「計入總資產」選項

**影響範圍**：
- Dashboard 的總資產統計
- 報表中的資產分析
- 只影響統計顯示，不影響實際交易記錄

### 4. 交易計入統計控制

**新增欄位**：
- `include_in_stats`：是否計入收支統計（預設為 true）

**使用情境**：
- 內部轉帳：從 A 帳戶轉到 B 帳戶，不應計入收入或支出
- 調整項目：修正錯誤的歷史記錄，但不想影響統計
- 特殊交易：不想納入日常收支分析的交易

**影響範圍**：
- Dashboard 的收入/支出統計
- 每日趨勢圖表
- 分類支出圓餅圖
- 所有報表統計

**重要**：
- 不影響帳戶餘額計算（帳戶餘額永遠是所有交易的加總）
- 只影響統計圖表和報表的顯示

---

## 資料庫遷移

執行以下 SQL 以更新現有資料庫：

```sql
-- 新增帳戶的初始餘額與是否計入統計欄位
ALTER TABLE "accounts" ADD COLUMN "initial_balance" numeric(12, 2) DEFAULT '0' NOT NULL;
ALTER TABLE "accounts" ADD COLUMN "include_in_total" boolean DEFAULT true NOT NULL;

-- 新增交易的是否計入統計欄位
ALTER TABLE "transactions" ADD COLUMN "include_in_stats" boolean DEFAULT true NOT NULL;
```

或使用 Drizzle Kit：
```bash
npx drizzle-kit push
```

---

## API 變更

### accounts.ts

**createAccount**：
```typescript
createAccount({
  name: string;
  type: "銀行" | "現金" | "電子支付";
  currency?: string;
  initialBalance?: string;      // 新增
  includeInTotal?: boolean;      // 新增
})
```

**updateAccount**：
```typescript
updateAccount(id, {
  name?: string;
  type?: "銀行" | "現金" | "電子支付";
  currency?: string;
  initialBalance?: string;       // 新增
  includeInTotal?: boolean;       // 新增
  isActive?: boolean;
})
```

### finance.ts

**addTransaction**：
```typescript
addTransaction({
  transactionDate: string;
  amount: string;
  type: "收入" | "支出";
  accountId: number;
  categoryId: number;
  memo?: string;
  includeInStats?: boolean;      // 新增（預設 true）
})
```

### accountsBalance.ts

**新增函數 getTotalAssets**：
```typescript
getTotalAssets() => {
  totalAssets: string;           // 總資產金額
  includedAccountsCount: number; // 計入統計的帳戶數量
}
```

---

## 前端 UI 更新需求

### 帳戶管理頁面
1. 新增帳戶表單：
   - [ ] 新增「初始餘額」輸入欄位
   - [ ] 新增「計入總資產」勾選框

2. 編輯帳戶表單：
   - [ ] 新增「初始餘額」輸入欄位
   - [ ] 新增「計入總資產」勾選框

3. 帳戶列表：
   - [ ] 顯示初始餘額
   - [ ] 顯示是否計入統計的標記

### 交易新增/編輯頁面
1. 新增交易表單：
   - [ ] 新增「計入統計」勾選框（預設勾選）
   - [ ] 提示說明：用於排除內部轉帳等不計入統計的交易

2. 交易列表：
   - [ ] 顯示是否計入統計的標記（灰色標記表示未計入）

### Dashboard
1. 總資產顯示：
   - [ ] 顯示「總資產（已計入 X 個帳戶）」
   - [ ] 點擊可查看哪些帳戶被計入

2. 收支統計：
   - [ ] 顯示「（已排除 X 筆不計入統計的交易）」提示

---

## 測試建議

1. **CSV 匯入測試**：
   - 匯入包含主分類和子分類的 CSV
   - 驗證分類階層是否正確建立
   - 檢查是否有重複建立的分類

2. **初始餘額測試**：
   - 建立帳戶時設定初始餘額
   - 新增交易後檢查餘額是否正確計算

3. **統計控制測試**：
   - 建立不計入統計的帳戶，檢查總資產是否正確
   - 建立不計入統計的交易，檢查 Dashboard 統計是否正確
   - 驗證帳戶餘額不受統計控制影響

---

## 注意事項

1. **向後相容性**：
   - 所有新欄位都有預設值，不影響現有資料
   - 現有交易和帳戶會自動設為「計入統計」

2. **資料一致性**：
   - 帳戶餘額始終是所有交易的實際加總
   - 統計控制只影響報表顯示，不影響實際資料

3. **效能考量**：
   - `getTotalAssets()` 會查詢所有帳戶的交易記錄
   - 建議在需要時才調用，或考慮快取機制
