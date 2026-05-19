# Server Actions 使用文件

所有 Server Actions 都遵守 PRD 的核心防護原則：
- ✅ **浮點數零容忍**：使用 `decimal.js` 處理所有金額計算
- ✅ **Asia/Taipei 時區防禦**：使用 `dayjs` + timezone plugin 確保時區正確

---

## finance.ts - 財務相關 Actions

### 1. getDashboardStats(year, month)

取得指定年月的儀表板統計資料。

**參數：**
- `year: number` - 年份（例如：2026）
- `month: number` - 月份（1-12）

**返回值：**
```typescript
{
  totalIncome: string;   // 總收入（字串格式，兩位小數）
  totalExpense: string;  // 總支出
  netWorth: string;      // 淨資產（收入 - 支出）
}
```

**使用範例：**
```typescript
const stats = await getDashboardStats(2026, 5);
console.log(`總收入: NT$ ${stats.totalIncome}`);
console.log(`總支出: NT$ ${stats.totalExpense}`);
console.log(`淨資產: NT$ ${stats.netWorth}`);
```

---

### 2. getMonthlyCategoryPie(year, month)

取得當月支出按主分類加總的圓餅圖資料。

**參數：**
- `year: number` - 年份
- `month: number` - 月份（1-12）

**返回值：**
```typescript
Array<{
  categoryId: number;
  categoryName: string;
  amount: string;      // 該分類總金額
  percentage: string;  // 百分比（一位小數）
}>
```

**使用範例：**
```typescript
const pie = await getMonthlyCategoryPie(2026, 5);
pie.forEach(item => {
  console.log(`${item.categoryName}: NT$ ${item.amount} (${item.percentage}%)`);
});
```

---

### 3. getDailyTrend(year, month)

取得當月每日支出總額（用於長條圖）。

**參數：**
- `year: number` - 年份
- `month: number` - 月份（1-12）

**返回值：**
```typescript
Array<{
  date: string;   // YYYY-MM-DD 格式
  day: string;    // 日期（1-31）
  amount: string; // 當日支出總額
}>
```

**使用範例：**
```typescript
const trend = await getDailyTrend(2026, 5);
trend.forEach(item => {
  console.log(`${item.date}: NT$ ${item.amount}`);
});
```

---

### 4. getRecentTransactions(limit)

取得最新的交易明細清單。

**參數：**
- `limit: number` - 返回筆數（預設：20）

**返回值：**
```typescript
Array<{
  id: number;
  transactionDate: string;  // ISO 8601 格式
  displayDate: string;      // 台灣時區顯示格式（YYYY-MM-DD HH:mm）
  amount: string;
  type: "收入" | "支出";
  memo: string;
  accountName: string;
  categoryName: string;
}>
```

**使用範例：**
```typescript
const recent = await getRecentTransactions(10);
recent.forEach(t => {
  const sign = t.type === "支出" ? "-" : "+";
  console.log(`${t.displayDate} | ${t.type} ${sign}NT$ ${t.amount}`);
});
```

---

### 5. addTransaction(data)

新增一筆交易記錄。

**參數：**
```typescript
{
  transactionDate: string;     // ISO 8601 格式
  amount: string;              // 字串格式的金額（必須 > 0）
  type: "收入" | "支出";
  accountId: number;
  categoryId: number;
  memo?: string;               // 可選
}
```

**返回值：**
```typescript
{
  success: boolean;
  data?: {
    id: number;
    transactionDate: string;
    amount: string;
    type: string;
  };
  error?: string;
}
```

**使用範例：**
```typescript
const result = await addTransaction({
  transactionDate: dayjs().tz("Asia/Taipei").toISOString(),
  amount: "150.50",
  type: "支出",
  accountId: 1,
  categoryId: 5,
  memo: "午餐"
});

if (result.success) {
  console.log("新增成功！", result.data);
} else {
  console.error("新增失敗：", result.error);
}
```

---

## accounts.ts - 帳戶管理 Actions

### getAccounts()
取得所有帳戶清單。

### getActiveAccounts()
取得所有啟用的帳戶。

### createAccount(data)
新增帳戶。

### updateAccount(id, data)
更新帳戶資訊。

### deactivateAccount(id)
停用帳戶（軟刪除）。

---

## categories.ts - 分類管理 Actions

### getCategories()
取得所有分類（含階層結構）。

### getCategoriesByType(type)
取得指定類型的分類（"支出" 或 "收入"）。

### getMainCategories()
取得所有主分類。

### getSubCategories(parentId)
取得指定主分類的所有子分類。

### createCategory(data)
新增分類。

### updateCategory(id, data)
更新分類。

### deleteCategory(id)
刪除分類（需檢查是否有關聯交易）。

---

## 重要提醒

### 1. 金額處理
所有金額必須使用**字串格式**傳遞，例如：`"1234.56"`

❌ 錯誤：
```typescript
addTransaction({ amount: 150.5, ... })
```

✅ 正確：
```typescript
addTransaction({ amount: "150.50", ... })
```

### 2. 時區處理
所有日期時間必須使用 **Asia/Taipei** 時區：

```typescript
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

const now = dayjs().tz("Asia/Taipei").toISOString();
```

### 3. 查詢時間範圍
Server Actions 內部已正確處理 UTC+8 午夜切分點，無需額外處理。

---

## 測試

執行測試腳本：
```bash
npm run test:actions
```

建立種子資料：
```bash
npm run db:seed
```
