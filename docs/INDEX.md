# 📚 Penny101 文檔索引

歡迎來到 Penny101 文檔中心！這裡整理了所有可用的文檔，幫助你快速找到需要的資訊。

---

## 🚀 入門指南

### 新手必讀

| 文檔 | 說明 | 閱讀時間 |
|------|------|----------|
| **[README](../README.md)** | 專案概覽、核心特色、技術架構 | 5 分鐘 |
| **[快速開始指南](../QUICKSTART.md)** | 5 分鐘內完成安裝並開始記帳 | 5 分鐘 |
| **[測試指南](../TESTING.md)** | Server Actions 測試流程 | 3 分鐘 |

### 功能教學

| 文檔 | 說明 | 閱讀時間 |
|------|------|----------|
| **[儀表板指南](../DASHBOARD_GUIDE.md)** | Dashboard 功能測試與使用 | 5 分鐘 |
| **[設定指南](../SETTINGS_GUIDE.md)** | 帳戶與分類管理教學 | 5 分鐘 |

---

## 🛠️ 進階使用

### 部署與維運

| 文檔 | 說明 | 閱讀時間 |
|------|------|----------|
| **[部署指南](DEPLOYMENT.md)** | GCP/雲端部署完整教學 | 15 分鐘 |
| 　├─ 前置準備 | VM 規格、防火牆、軟體安裝 | |
| 　├─ 部署步驟 | Clone、設定、建置、啟動 | |
| 　├─ 自動備份 | Crontab 排程、Google Drive | |
| 　├─ 監控維護 | 日誌、更新、資料庫維護 | |
| 　└─ 故障排除 | 常見問題與解決方案 | |

---

## 📝 開發資源

### 貢獻與開發

| 文檔 | 說明 | 閱讀時間 |
|------|------|----------|
| **[貢獻指南](../CONTRIBUTING.md)** | 如何貢獻程式碼、提交 Issue/PR | 10 分鐘 |
| 　├─ 開發環境設定 | Fork、Clone、安裝、啟動 | |
| 　├─ 編碼規範 | TypeScript、React、命名慣例 | |
| 　├─ Commit 規範 | Conventional Commits 格式 | |
| 　└─ 核心原則 | 浮點數零容忍、時區防禦 | |

### 更新記錄

| 文檔 | 說明 | 閱讀時間 |
|------|------|----------|
| **[更新日誌](../CHANGELOG.md)** | 完整版本歷史與變更記錄 | 5 分鐘 |
| **[功能更新](../FEATURES_UPDATE.md)** | v0.3.0 新功能詳細說明 | 10 分鐘 |
| 　├─ CSV 匯入支援主子分類 | | |
| 　├─ 帳戶初始餘額設定 | | |
| 　├─ 統計控制功能 | | |
| 　└─ API 變更說明 | | |

---

## 🎨 技術文檔

### 設計與優化

| 文檔 | 說明 | 閱讀時間 |
|------|------|----------|
| **[圓餅圖優化](../PIE_CHART_OPTIMIZATION.md)** | 智能圓餅圖設計與實現 | 8 分鐘 |
| 　├─ 問題分析 | 標籤擁擠、視覺混亂 | |
| 　├─ 解決方案 | 智能合併、條件式標籤 | |
| 　├─ 技術實現 | SmartPieChart 組件 | |
| 　└─ 自訂設定 | 合併閾值調整 | |
| **[PRD](PRD.md)** | 產品需求文件 | 5 分鐘 |

---

## 📖 快速導航

### 依使用情境

#### 🆕 我是新使用者，想快速開始
1. 閱讀 **[README](../README.md)** 了解專案
2. 跟隨 **[快速開始指南](../QUICKSTART.md)** 完成安裝
3. 參考 **[儀表板指南](../DASHBOARD_GUIDE.md)** 開始記帳

#### 🔧 我想部署到雲端
1. 閱讀 **[部署指南](DEPLOYMENT.md)** 的前置準備
2. 跟隨部署步驟完成安裝
3. 設定自動備份與監控

#### 🤝 我想貢獻程式碼
1. 閱讀 **[貢獻指南](../CONTRIBUTING.md)** 了解規範
2. 設定開發環境
3. 遵循編碼規範與 Commit 規範
4. 提交 Pull Request

#### 📊 我想了解新功能
1. 查看 **[更新日誌](../CHANGELOG.md)** 的最新版本
2. 閱讀 **[功能更新](../FEATURES_UPDATE.md)** 詳細說明
3. 測試新功能並給予回饋

#### 🐛 我遇到問題
1. 查閱 **[快速開始指南](../QUICKSTART.md)** 的常見問題
2. 查閱 **[部署指南](DEPLOYMENT.md)** 的故障排除
3. 搜尋 [GitHub Issues](https://github.com/Deep-Learning-101/Penny101/issues)
4. 提交新的 Issue

---

## 📁 文檔結構

```
Penny101/
├── README.md                          # 專案主頁
├── QUICKSTART.md                      # 快速開始指南
├── CHANGELOG.md                       # 更新日誌
├── CONTRIBUTING.md                    # 貢獻指南
├── FEATURES_UPDATE.md                 # 功能更新說明
├── PIE_CHART_OPTIMIZATION.md          # 圓餅圖優化文檔
├── DASHBOARD_GUIDE.md                 # 儀表板使用指南
├── SETTINGS_GUIDE.md                  # 設定使用指南
├── TESTING.md                         # 測試指南
└── docs/
    ├── INDEX.md                       # 📍 你在這裡
    ├── DEPLOYMENT.md                  # 部署指南
    └── PRD.md                         # 產品需求文件
```

---

## 🔍 搜尋提示

### 常見搜尋關鍵字

| 你想找... | 看這裡 |
|-----------|--------|
| 安裝步驟 | [快速開始指南](../QUICKSTART.md) |
| 部署到 GCP | [部署指南](DEPLOYMENT.md) |
| 如何記帳 | [儀表板指南](../DASHBOARD_GUIDE.md) |
| 帳戶管理 | [設定指南](../SETTINGS_GUIDE.md) |
| CSV 匯入 | [功能更新](../FEATURES_UPDATE.md) |
| 圓餅圖優化 | [圓餅圖優化](../PIE_CHART_OPTIMIZATION.md) |
| 貢獻程式碼 | [貢獻指南](../CONTRIBUTING.md) |
| 版本歷史 | [更新日誌](../CHANGELOG.md) |
| 自動備份 | [部署指南 - 自動備份設定](DEPLOYMENT.md#自動備份設定) |
| 測試 | [測試指南](../TESTING.md) |
| Docker | [README - Docker 部署](../README.md#-docker-部署) |
| 資料庫 Schema | [README - 技術架構](../README.md#-技術架構) |
| 核心原則 | [README - 核心設計原則](../README.md#-核心設計原則) |
| 故障排除 | [部署指南 - 故障排除](DEPLOYMENT.md#故障排除) |

---

## 💡 文檔貢獻

發現文檔有誤或需要改進？歡迎貢獻！

1. Fork 專案
2. 編輯文檔
3. 提交 Pull Request

文檔貢獻指南請參考 **[貢獻指南](../CONTRIBUTING.md)**。

---

## 📬 回饋

對文檔有任何建議或問題？

- 🐛 [回報問題](https://github.com/Deep-Learning-101/Penny101/issues/new)
- 💡 [提出建議](https://github.com/Deep-Learning-101/Penny101/issues/new)
- ⭐ [給專案星星](https://github.com/Deep-Learning-101/Penny101)

---

**Happy Reading! 📖**

*最後更新：2026-05-20*
