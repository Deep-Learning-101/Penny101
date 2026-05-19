# 🧪 Server Actions 測試指南

## 前置準備

### 1. 確保資料庫已啟動

```bash
# 啟動 PostgreSQL
docker-compose up -d db

# 確認資料庫連線
docker-compose logs db
```

### 2. 推送 Schema 到資料庫

```bash
npm run db:push
```

成功後會看到：
```
✅ Applying SQL statements
✅ Done!
```

---

## 測試流程

### 步驟 1：建立種子資料

執行種子資料腳本，自動建立測試資料：

```bash
npm run db:seed
```

**預期輸出：**
```
🌱 開始建立種子資料...

📦 建立帳戶...
✅ 建立 3 個帳戶

📦 建立支出分類...
✅ 建立支出分類（4 個主分類，11 個子分類）

📦 建立收入分類...
✅ 建立收入分類（3 個主分類）

📦 建立交易記錄...
✅ 建立 10 筆交易記錄

✅ 種子資料建立完成！

📊 資料統計：
   - 帳戶: 3 個
   - 分類: 7 個主分類，11 個子分類
   - 交易: 10 筆
```

**建立的資料：**

**帳戶（3個）：**
- 現金（現金帳戶）
- 中信銀行（銀行帳戶）
- LINE Pay（電子支付）

**支出分類（4個主分類）：**
1. 飲食
   - 早餐、午餐、晚餐、飲料
2. 交通
   - 捷運、計程車、加油
3. 購物
   - 服飾、3C
4. 娛樂
   - 電影、遊戲

**收入分類（3個主分類）：**
- 薪資
- 獎金
- 投資

**交易記錄（10筆）：**
- 2026-05-01: 薪資 +50,000
- 2026-05-02: 早餐、午餐、晚餐
- 2026-05-03: 飲料、捷運
- 2026-05-05: 電影
- 2026-05-10: 早餐、午餐
- 2026-05-15: 獎金 +5,000

---

### 步驟 2：測試 Server Actions

執行測試腳本，驗證所有 Actions：

```bash
npm run test:actions
```

**預期輸出：**

```
🧪 測試 Server Actions...

📊 測試 getAccounts()
✅ 取得 3 個帳戶
[
  { id: 1, name: '現金', type: '現金', ... },
  { id: 2, name: '中信銀行', type: '銀行', ... },
  { id: 3, name: 'LINE Pay', type: '電子支付', ... }
]

📊 測試 getCategories()
✅ 取得 7 個主分類
[
  { id: 1, name: '飲食', type: '支出', children: [...] },
  ...
]

📊 測試 getDashboardStats(2026, 5)
✅ 當月統計：
   總收入: NT$ 55000.00
   總支出: NT$ 1182.00
   淨資產: NT$ 53818.00

📊 測試 getMonthlyCategoryPie(2026, 5)
✅ 取得 4 個分類統計：
   飲食: NT$ 650.00 (55.0%)
   娛樂: NT$ 350.00 (29.6%)
   交通: NT$ 32.00 (2.7%)
   ...

📊 測試 getDailyTrend(2026, 5)
✅ 取得 31 天的趨勢資料
   2026-05-01: NT$ 0.00
   2026-05-02: NT$ 435.00
   2026-05-03: NT$ 87.00
   2026-05-05: NT$ 350.00
   2026-05-10: NT$ 210.00
   ...

📊 測試 getRecentTransactions(10)
✅ 取得 10 筆最近交易：
   2026-05-15 10:00 | 收入 +NT$ 5000.00 | 獎金 | 專案獎金
   2026-05-10 12:30 | 支出 -NT$ 150.00 | 午餐 | 牛肉麵
   2026-05-10 08:00 | 支出 -NT$ 60.00 | 早餐 | 麥當勞
   ...

✅ 所有測試完成！
```

---

### 步驟 3：驗證數據精度

使用 Drizzle Studio 視覺化檢查資料：

```bash
npm run db:studio
```

會在瀏覽器開啟 `https://local.drizzle.studio`

**檢查項目：**
1. ✅ transactions 表的 amount 欄位是 `numeric(12,2)` 類型
2. ✅ transaction_date 欄位是 `timestamptz` 類型
3. ✅ 所有金額都是兩位小數（例如：150.00）
4. ✅ 時間戳記包含時區資訊（+08:00）

---

## 驗證重點

### 1. 浮點數精度 ✅

**檢查點：**
- 加總計算正確無誤差
- 百分比計算精確到一位小數
- 金額排序正確

**測試案例：**
```typescript
// 預期：總收入 = 50000 + 5000 = 55000.00
getDashboardStats(2026, 5);
// 結果：totalIncome: "55000.00" ✅
```

### 2. 時區處理 ✅

**檢查點：**
- 當月查詢範圍正確（UTC+8 午夜切分）
- 日期顯示使用台灣時間
- 跨日交易不會錯誤歸屬

**測試案例：**
```typescript
// 交易時間：2026-05-02 08:30 (台灣時間)
// 儲存為：2026-05-02T00:30:00.000Z (UTC)
// 查詢 2026-05 月份時，正確包含此筆交易 ✅
```

### 3. 階層分類 ✅

**檢查點：**
- 子分類正確歸屬到主分類
- 圓餅圖按主分類加總
- 分類刪除有防呆機制

**測試案例：**
```typescript
// "早餐" 是 "飲食" 的子分類
// getMonthlyCategoryPie 結果會將 "早餐" 的金額加總到 "飲食" ✅
```

---

## 常見問題

### Q: 種子資料腳本執行失敗？

**A:** 檢查資料庫是否已啟動並推送 schema：
```bash
docker-compose ps
npm run db:push
```

### Q: 測試腳本顯示連線錯誤？

**A:** 確認 `.env` 檔案的 `DATABASE_URL` 設定正確：
```env
DATABASE_URL=postgresql://penny101:penny101_dev_password@localhost:5432/penny101
```

### Q: 如何清空資料重新測試？

**A:** 刪除 Docker volume 並重新建立：
```bash
docker-compose down -v
docker-compose up -d db
npm run db:push
npm run db:seed
```

---

## 下一步

Server Actions 驗證完成後，可以開始實作 UI：
1. 儀表板頁面（Dashboard）
2. 新增記帳表單（FAB + Dialog）
3. 設定頁面（分類與帳戶管理）

所有 UI 元件可以直接使用這些 Server Actions！
