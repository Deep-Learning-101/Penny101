# 🤝 貢獻指南

感謝你對 Penny101 的興趣！我們歡迎各種形式的貢獻，包括：

- 🐛 報告 Bug
- 💡 提出新功能建議
- 📝 改進文檔
- 🔧 提交程式碼修復或新功能
- 🎨 UI/UX 改進建議

---

## 📋 目錄

- [開發環境設定](#開發環境設定)
- [提交 Issue](#提交-issue)
- [提交 Pull Request](#提交-pull-request)
- [編碼規範](#編碼規範)
- [Commit 訊息規範](#commit-訊息規範)
- [測試](#測試)
- [核心原則](#核心原則)

---

## 🛠️ 開發環境設定

### 1. Fork 專案

點擊 GitHub 頁面右上角的「Fork」按鈕。

### 2. Clone 你的 Fork

```bash
git clone https://github.com/YOUR_USERNAME/Penny101.git
cd Penny101
```

### 3. 新增 Upstream Remote

```bash
git remote add upstream https://github.com/Deep-Learning-101/Penny101.git
```

### 4. 安裝依賴

```bash
npm install
```

### 5. 啟動開發環境

```bash
# 啟動資料庫
docker-compose up -d db

# 推送 Schema
npm run db:push

# 建立測試資料
npm run db:seed

# 啟動開發伺服器
npm run dev
```

### 6. 建立功能分支

```bash
git checkout -b feature/your-feature-name
```

---

## 🐛 提交 Issue

在提交 Issue 前，請先：

1. **搜尋現有 Issues**：確認問題尚未被回報
2. **使用最新版本**：確認 Bug 在最新版本仍然存在

### Bug 回報範本

```markdown
## Bug 描述
簡短描述問題

## 重現步驟
1. 前往 '...'
2. 點擊 '...'
3. 捲動到 '...'
4. 看到錯誤

## 預期行為
描述應該發生什麼

## 實際行為
描述實際發生了什麼

## 截圖
如果適用，請加上截圖

## 環境資訊
- OS: [例如 macOS 14.0]
- Browser: [例如 Chrome 120]
- Node.js 版本: [例如 v20.10.0]
- Penny101 版本: [例如 v0.3.0]

## 其他資訊
其他相關資訊
```

### 功能建議範本

```markdown
## 功能描述
清楚描述你建議的功能

## 使用場景
描述這個功能能解決什麼問題

## 建議的實現方式（可選）
如果有想法，可以描述如何實現

## 替代方案（可選）
是否有其他可行的方案

## 其他資訊
其他相關資訊或參考資料
```

---

## 🔀 提交 Pull Request

### 1. 同步 Upstream

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

### 2. 開發功能

在你的功能分支上進行開發：

```bash
git checkout feature/your-feature-name
# 開始開發...
```

### 3. 遵循編碼規範

請遵循本文檔的 [編碼規範](#編碼規範) 章節。

### 4. 測試你的改動

```bash
# 執行 TypeScript 類型檢查
npm run build

# 執行 Linter
npm run lint

# 執行 Server Actions 測試
npm run test:actions

# 手動測試 UI
npm run dev
```

### 5. Commit 你的改動

```bash
git add .
git commit -m "feat: 新增 XXX 功能"
```

請遵循 [Commit 訊息規範](#commit-訊息規範)。

### 6. Push 到你的 Fork

```bash
git push origin feature/your-feature-name
```

### 7. 建立 Pull Request

1. 前往你的 GitHub Fork 頁面
2. 點擊「Compare & pull request」
3. 填寫 PR 描述（見下方範本）
4. 提交 PR

### Pull Request 範本

```markdown
## 改動描述
簡短描述你做了什麼改動

## 相關 Issue
Fixes #(issue 編號)

## 改動類型
- [ ] Bug 修復
- [ ] 新功能
- [ ] 重構
- [ ] 文檔更新
- [ ] 樣式調整
- [ ] 測試
- [ ] 其他（請說明）

## 測試檢查清單
- [ ] 在本地測試過所有改動
- [ ] 新增或更新了相關測試
- [ ] 所有測試通過
- [ ] 程式碼通過 Linter 檢查
- [ ] 更新了相關文檔

## 截圖（如適用）
如果改動影響 UI，請附上截圖

## 其他資訊
其他相關資訊
```

---

## 📝 編碼規範

### TypeScript

- 使用 TypeScript 嚴格模式
- 避免使用 `any`，盡可能使用具體類型
- 為函式參數和返回值標註類型
- 使用 Interface 定義物件結構

```typescript
// ✅ 好的範例
interface TransactionData {
  amount: string;
  type: "收入" | "支出";
  accountId: number;
}

function addTransaction(data: TransactionData): Promise<{ success: boolean }> {
  // ...
}

// ❌ 不好的範例
function addTransaction(data: any) {
  // ...
}
```

### React / Next.js

- 優先使用 Server Components
- 只在需要互動時使用 `"use client"`
- 使用 Server Actions 處理資料變更
- 組件名稱使用 PascalCase

```typescript
// ✅ Server Component（預設）
export default async function DashboardPage() {
  const data = await getDashboardStats();
  return <Dashboard data={data} />;
}

// ✅ Client Component（需要互動）
"use client";
export function AddTransactionDialog() {
  const [open, setOpen] = useState(false);
  // ...
}
```

### 金額計算（重要！）

**絕對禁止使用 JavaScript Number 進行金額計算**

```typescript
// ❌ 錯誤：使用 Number
const total = parseFloat(amount1) + parseFloat(amount2);

// ✅ 正確：使用 decimal.js
import Decimal from "decimal.js";
const total = new Decimal(amount1).plus(amount2).toFixed(2);
```

### 日期處理（重要！）

**永遠使用 Asia/Taipei 時區**

```typescript
// ❌ 錯誤：使用本地時間
const date = new Date();

// ✅ 正確：使用 Day.js + 時區
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(timezone);
const date = dayjs().tz("Asia/Taipei");
```

### 命名慣例

- 變數/函式：camelCase (`userName`, `getAccounts`)
- 類別/組件：PascalCase (`UserProfile`, `DashboardCard`)
- 常數：UPPER_SNAKE_CASE (`MAX_AMOUNT`, `DEFAULT_CURRENCY`)
- 檔案名稱：kebab-case (`user-profile.tsx`, `get-accounts.ts`)

### 程式碼格式

- 使用 2 空格縮排
- 使用分號結尾
- 字串優先使用雙引號
- 遵循 ESLint 規則

---

## 💬 Commit 訊息規範

使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hant/) 格式：

```
<type>: <subject>

<body>

<footer>
```

### Type 類型

- `feat`: 新功能
- `fix`: Bug 修復
- `docs`: 文檔更新
- `style`: 程式碼格式調整（不影響功能）
- `refactor`: 重構（不是新功能也不是 Bug 修復）
- `perf`: 效能改進
- `test`: 測試相關
- `chore`: 建置或工具變更

### 範例

```bash
# 新功能
git commit -m "feat: 新增轉帳功能"

# Bug 修復
git commit -m "fix: 修復圓餅圖標籤重疊問題"

# 文檔更新
git commit -m "docs: 更新 README 快速開始指南"

# 重構
git commit -m "refactor: 重構帳戶餘額計算邏輯"

# 詳細訊息範例
git commit -m "feat: 新增多幣別支援

- 新增貨幣選擇欄位
- 更新帳戶 Schema
- 實現匯率轉換邏輯

Closes #123"
```

---

## 🧪 測試

### 執行測試

```bash
# Server Actions 測試
npm run test:actions

# TypeScript 類型檢查
npm run build

# Linter 檢查
npm run lint
```

### 手動測試

在提交 PR 前，請手動測試：

1. **基本功能**
   - [ ] 新增交易
   - [ ] 編輯交易
   - [ ] 刪除交易
   - [ ] 查看統計

2. **分類管理**
   - [ ] 新增主分類
   - [ ] 新增子分類
   - [ ] 編輯分類
   - [ ] 刪除分類

3. **帳戶管理**
   - [ ] 新增帳戶
   - [ ] 編輯帳戶
   - [ ] 停用帳戶
   - [ ] 查看帳戶餘額

4. **CSV 匯入/匯出**
   - [ ] 匯出 CSV
   - [ ] 匯入 CSV
   - [ ] 容錯機制測試

5. **報表**
   - [ ] Dashboard 統計
   - [ ] 圓餅圖顯示
   - [ ] 趨勢圖顯示
   - [ ] 報表頁面

---

## 🎯 核心原則

### 1. 浮點數零容忍

**所有金額計算必須使用 `decimal.js`**

這是 Penny101 的核心原則，絕對不可違反。

```typescript
// 測試你的程式碼
import Decimal from "decimal.js";

// 確保所有金額計算都經過 Decimal
const amount1 = new Decimal("100.50");
const amount2 = new Decimal("200.30");
const total = amount1.plus(amount2); // "300.80"
```

### 2. 時區絕對防禦

**永遠使用 `Asia/Taipei` 時區**

```typescript
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(timezone);

// 所有日期操作都要指定時區
const now = dayjs().tz("Asia/Taipei");
const startOfDay = dayjs().tz("Asia/Taipei").startOf("day");
```

### 3. 資料完整性

- 使用外鍵約束保護資料關聯
- 重要資料使用軟刪除（`is_active` 欄位）
- 驗證使用者輸入
- 使用 TypeScript 強型別

---

## 📚 相關資源

- [Next.js 文檔](https://nextjs.org/docs)
- [Drizzle ORM 文檔](https://orm.drizzle.team/)
- [shadcn/ui 元件庫](https://ui.shadcn.com/)
- [decimal.js 文檔](https://github.com/MikeMcl/decimal.js/)
- [Day.js 文檔](https://day.js.org/)

---

## ❓ 問題？

如果有任何問題，請：

1. 查閱 [README.md](README.md)
2. 搜尋 [現有 Issues](https://github.com/Deep-Learning-101/Penny101/issues)
3. 提交新的 Issue

---

## 🙏 感謝

感謝所有貢獻者的付出！你們的貢獻讓 Penny101 變得更好 ❤️

---

**Happy Contributing! 🎉**
