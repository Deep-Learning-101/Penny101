# 📝 Changelog

所有重要的專案變更都會記錄在此文件中。

格式基於 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/)，
版本號遵循 [Semantic Versioning](https://semver.org/lang/zh-TW/)。

---

## [Unreleased]

### 規劃中
- [ ] 使用者自訂圓餅圖合併閾值
- [ ] 多幣別支援
- [ ] 預算管理
- [ ] 標籤系統
- [ ] 匯出 PDF 報表

---

## [0.4.0] - 2026-05-21

### Added (新增)
- ✨ **轉帳功能隔離** ([#004](link))
  - 新增 `is_transfer` 欄位於 transactions 表
  - 轉帳交易不計入收支統計，但計入帳戶餘額計算
  - CSV 匯入支援第 12 欄轉帳標記（「是」/「true」/「1」）
  - 所有統計查詢已排除轉帳資料，避免數據失真

- ✨ **帳戶手動排序功能** ([#004](link))
  - 新增 `sort_order` 欄位於 accounts 表
  - 帳戶列表支援上下箭頭調整排序
  - 點擊後即時更新，自動刷新頁面
  - 新增 `AccountSortButtons` 組件

- ✨ **帳戶明細頁效能優化** ([#004](link))
  - 預設只載入近 6 個月的交易記錄
  - 新增時間範圍選擇器：3 個月、6 個月、1 年、全部
  - 透過 URL 參數 `?range=6m` 控制
  - 大幅提升大量交易帳戶的載入速度

- ✨ **財務健康度看板** ([#004](link))
  - 帳戶總覽頁新增「總淨資產 (Net Worth)」卡片
  - 新增「淨負債 (Total Liabilities)」卡片
  - 一眼掌握財務狀況（資產、負債）

- ✨ **一鍵刷新帳戶餘額** ([#004](link))
  - 帳戶頁面新增「刷新餘額」按鈕
  - 重新計算所有帳戶餘額並驗證正確性
  - 適用於資料遷移後的餘額核對

### Changed (變更)
- 🔧 **統計邏輯全面更新**
  - getDashboardStats：排除轉帳交易
  - getMonthlyCategoryPie：排除轉帳交易
  - getDailyTrend：排除轉帳交易
  - getMonthSummary：排除轉帳交易
  - getYearSummary：排除轉帳交易
  - getYearlyTrend：排除轉帳交易
  - getYearlyExpenseByCategory：排除轉帳交易
  - getMonthlyExpenseByCategory：排除轉帳交易
  - getMonthlyTopExpenses：排除轉帳交易

- 🔧 **帳戶餘額計算邏輯**
  - 餘額 = initialBalance + 總收入 - 總支出（含轉帳）
  - 統計 = 收入 - 支出（不含轉帳）

### Fixed (修復)
- 🐛 **修正轉帳導致收支失真問題**
  - 轉帳交易不再計入總收入與總支出
  - 報表數據更準確反映真實財務狀況

### Database (資料庫)
- 📦 **Schema 變更**
  - `transactions` 新增 `is_transfer` 欄位（boolean, default: false）
  - `accounts` 新增 `sort_order` 欄位（integer, default: 0）
  - 新增索引：`idx_transactions_is_transfer`
  - 新增索引：`idx_accounts_sort_order`

### Performance (效能)
- ⚡ **帳戶明細頁載入速度提升**
  - 預設只查詢 6 個月內的交易
  - 避免一次載入數千筆資料造成卡頓

---

## [0.3.0] - 2026-05-20

### Added (新增)
- ✨ **智能圓餅圖顯示** ([#003](link))
  - 自動合併佔比 < 5% 的小分類為「其他」
  - 條件式標籤顯示，避免標籤擁擠和重疊
  - 增強 Tooltip：懸停顯示「其他」分類明細
  - 新增可重用組件 `SmartPieChart`
  - 統一應用於 Dashboard 和報表頁面

- ✨ **帳戶初始餘額設定** ([#002](link))
  - 新增 `initial_balance` 欄位（預設 0）
  - 餘額計算：初始餘額 + 收入 - 支出
  - 適用於從其他系統遷移或設定現有帳戶餘額

- ✨ **帳戶與交易統計控制** ([#002](link))
  - 帳戶新增 `include_in_total` 欄位：控制是否計入總資產統計
  - 交易新增 `include_in_stats` 欄位：控制是否計入收支統計
  - 新增 `getTotalAssets()` API 計算總資產
  - 可用於排除內部轉帳等不計入統計的交易

- ✨ **CSV 匯入支援主子分類** ([#002](link))
  - 正確讀取 CSV 的「主分類」和「子分類」欄位
  - 自動建立分類階層關係
  - 使用 `主分類>子分類` 作為唯一識別 key

### Fixed (修復)
- 🐛 **修復 CSV 匯入標題列問題** ([#001](link))
  - 新增雙重標題列檢測，防止標題列被當作資料寫入
  - 檢查第一行是否包含「日期」、「id」等標題特徵
  - 遍歷時再次檢查每一行，確保標題列不會被處理

- 🐛 **修復 CSV 匯入格式轉換問題** ([#001](link))
  - 強制將日期轉換為 ISO 格式：`dayjs().tz("Asia/Taipei").toISOString()`
  - 嚴格驗證金額格式，防止 NaN 導致資料庫崩潰
  - 新增日期和金額有效性檢查

- 🐛 **修復子分類匯入被忽略** ([#002](link))
  - 修正只讀取主分類的問題
  - 現在會同時處理 CSV 的第 2 欄（主分類）和第 3 欄（子分類）

### Changed (變更)
- 💄 **改善錯誤訊息顯示** ([#001](link))
  - 最外層 catch 改為顯示真實錯誤訊息
  - 格式：`"系統例外錯誤：" + error.message`
  - 方便除錯，不再只顯示通用錯誤

- 🔧 **Dashboard 統計過濾邏輯** ([#002](link))
  - 自動過濾 `includeInStats = false` 的交易
  - 只統計計入總資產的帳戶餘額

### Documentation (文檔)
- 📚 新增 `FEATURES_UPDATE.md`：詳細功能更新說明
- 📚 新增 `PIE_CHART_OPTIMIZATION.md`：圓餅圖優化技術文件
- 📚 更新 `README.md`：完整專案介紹和使用指南

### Database (資料庫)
- 🗄️ 新增 Migration: `0001_add_account_and_transaction_fields.sql`
  - `accounts.initial_balance` (DECIMAL 12,2)
  - `accounts.include_in_total` (BOOLEAN)
  - `transactions.include_in_stats` (BOOLEAN)

---

## [0.2.0] - 2026-05-19

### Added
- ✨ **財務報表系統**
  - 全年收支趨勢折線圖
  - 年度各月結餘趨勢
  - 本月支出分類圓餅圖
  - 本月支出排行榜 Top 5
  - 全年支出分類圓餅圖

- ✨ **CSV 匯入/匯出功能**
  - 支援外部記帳軟體格式（14 欄位）
  - 自動建立缺失的帳戶和分類
  - 匯出所有交易記錄為 CSV

- ✨ **帳戶餘額總覽**
  - 顯示所有帳戶的即時餘額
  - 帳戶詳情頁面：查看單一帳戶的所有交易
  - 餘額計算：收入 - 支出

- ✨ **清空資料功能**
  - 危險操作確認機制
  - 一鍵清空所有交易記錄

### Fixed
- 🐛 修復 Turbopack 建置錯誤
- 🐛 修復 SSR (Server-Side Rendering) 衝突
- 🐛 修復報表頁面 Recharts 客戶端衝突

### Changed
- ♻️ 重構報表頁面架構，改用 `"use client"` 組件
- ♻️ 使用 PapaParse 取代原生 CSV 解析，修復換行符號問題

---

## [0.1.0] - 2026-05-18

### Added
- 🎉 **初始版本發佈**
- ✅ 基本記帳功能
  - 新增交易（收入/支出）
  - 日期、金額、帳戶、分類、備註
  - FAB (Floating Action Button) 快速新增

- ✅ Dashboard (儀表板)
  - 當月收支統計
  - 支出分類圓餅圖
  - 每日支出趨勢圖
  - 最近交易清單

- ✅ 帳戶管理
  - CRUD 操作（新增、編輯、刪除、停用）
  - 帳戶類型：銀行、現金、電子支付
  - 多幣別支援（預設 TWD）

- ✅ 分類管理
  - 支援主分類和子分類（兩層階層）
  - 分離支出和收入分類
  - CRUD 操作

- ✅ 核心技術架構
  - Next.js 15 (App Router)
  - TypeScript
  - PostgreSQL 15
  - Drizzle ORM
  - Tailwind CSS + shadcn/ui
  - Recharts
  - decimal.js（金融級精度）
  - Day.js（時區處理）

- ✅ Docker 支援
  - `docker-compose.yml`（開發環境）
  - `docker-compose.prod.yml`（生產環境）

- ✅ 資料庫工具
  - Migration 系統（Drizzle Kit）
  - 種子資料腳本 (`scripts/seed.ts`)
  - 測試腳本 (`scripts/test-actions.ts`)

- ✅ 備份還原
  - Google Drive 自動備份腳本
  - 資料還原腳本

---

## [0.0.1] - 2026-05-15

### Added
- 🏗️ 專案初始化
- 📦 基礎依賴安裝
- 🗄️ 資料庫 Schema 設計
- 🔧 開發環境設定

---

## 版本說明

### 版本號規則

版本號格式：`主版本.次版本.修訂版本`

- **主版本**：重大架構變更，可能不向後相容
- **次版本**：新功能，向後相容
- **修訂版本**：Bug 修復、小改進，向後相容

### 標籤說明

- ✨ Added (新增)：新功能
- 🐛 Fixed (修復)：Bug 修復
- 💄 Changed (變更)：功能變更
- ♻️  Refactored (重構)：程式碼重構
- 🗑️  Removed (移除)：功能移除
- 🔒 Security (安全)：安全性修復
- 📚 Documentation (文檔)：文檔更新
- 🗄️  Database (資料庫)：Schema 變更

---

## 相關連結

- **GitHub Repository**: https://github.com/Deep-Learning-101/Penny101
- **Issue Tracker**: https://github.com/Deep-Learning-101/Penny101/issues
- **文檔**: [README.md](README.md)
