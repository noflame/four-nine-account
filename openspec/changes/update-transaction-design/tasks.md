## 1. Setup & Configuration

- [x] 1.1 更新 `tailwind.config.ts`，將設計稿中的自定義色票 (如 `primary`, `surface-container`, `error-container` 等) 全數寫入 `theme.extend.colors` 中。確保後續開發完全使用 Tailwind Theme 進行樣式設定，不寫死任何個別的 HEX 顏色 (`bg-[#...]` 等寫法)。
- [x] 1.2 在全域樣式或 `tailwind.config.ts` 中設定新的字型家族 `fontFamily` (包含 `Manrope` 作為 headline/body 字體與 `Inter` 作為 label 字體)。
- [x] 1.3 確保專案的 `index.html` 或全域入口引入了 Google Fonts 與 Material Symbols Outlined 圖示庫。

## 2. Layout & Global Components

- [x] 2.1 建立 `TopAppBar` 元件：包含品牌名稱 (Luminous Ledger)、置中標題 (Dashboard) 以及右側通知與使用者大頭貼。
- [x] 2.2 建立 `BottomNavBar` 元件：建構底部導航列，包含 Overview, Assets, Transactions, Cards, Investments 等分頁圖示，並支援 Active 狀態切換。
- [x] 2.3 建立通用的 FAB (Floating Action Button) 元件：用於快速新增交易紀錄的懸浮按鈕。

## 3. Dashboard Content Components

- [x] 3.1 建立 `HeroSection` (Net Worth Card) 元件：顯示總淨值 (Total Net Worth)、月增長與可用現金，確保使用定義好的 Tailwind 漸層色主題背景 (`from-primary` to `primary-dim`)。
- [x] 3.2 建立 `SegmentedControl` 元件：用來切換「今日紀錄」與「資產明細」的 UI 開關。
- [x] 3.3 建立 `TransactionList` 與 `TransactionItem` 元件：負責渲染 Bento-style 的交易清單，包含類別圖示、標題、時間、金額與 Tag。
- [x] 3.4 建立 `ExpenseAnalysisCard` 元件：顯示長條圖 (可先用 div 實作靜態佔位符) 以及支出分析總結文字。
- [x] 3.5 建立 `CreditLimitCard` 元件：顯示主要信用卡的可用額度與視覺化的進度條 (Progress bar)。

## 4. Integration

- [x] 4.1 建立 `TransactionDashboard` 頁面：負責引入並組合上述所有的 UI 元件 (TopAppBar, HeroSection, SegmentedControl, TransactionList, Insights, BottomNavBar)。
- [x] 4.2 以假資料 (Mock Data) 填充畫面以確保各項邊界狀況正常顯示 (長文字、空資料等)。
- [x] 4.3 確保在不同的螢幕尺寸 (Mobile, Tablet, Desktop) 下，RWD 排版皆正常。
