# Proposal: Update Transaction Design

## Why

使用者需要一個全新的交易畫面與總覽設計。為了提供更好的視覺層次與使用者體驗，新的設計加入了資產總覽（Total Net Worth）、今日花費與資產明細的快速切換、以 Bento-style 呈現的交易紀錄、支出分析（Expense Analysis）以及信用卡額度（Credit Limit）等區塊，並且包含更清晰的底部導航列，讓使用者能直覺地掌握財務狀況。

## What Changes

- 導入基於 Tailwind CSS 與 Material Symbols 的全新設計語彙。
- 實作新的 Dashboard / Overview 頁面（更新現有的交易頁面），包含以下區塊：
  - **TopAppBar**: 帶有玻璃擬物化 (Glassmorphism) 效果的頂部導航列，包含通知與使用者頭像。
  - **Hero Section**: 呈現總淨值 (Total Net Worth)、月增長 (Monthly Growth) 與可用現金 (Liquid Cash) 的漸層卡片設計。
  - **Segmented Control**: 提供切換「今日紀錄」與「資產明細」的頁籤。
  - **Transactions List**: 列出今日花費的交易明細。
  - **Insights/Stats**: 提供支出分析長條圖與信用卡額度使用狀況。
  - **FAB & BottomNavBar**: 懸浮的新增交易按鈕與底部主功能導航列 (Overview, Assets, Transactions, Cards, Investments)。

## Capabilities

### New Capabilities
- `transaction-dashboard`: 包含資產總覽、今日交易紀錄、支出分析與底部導航列的綜合性儀表板介面設計。

### Modified Capabilities

## Impact

- 將會影響目前所有與交易、資產總覽相關的前端介面 (UI) 結構。
- 由於依賴新的 Tailwind CSS 設定檔 (自定義色票) 與字體 (Manrope, Inter)，可能需要更新前端專案的全域的樣式配置。
- 將影響主要版面配置 (Layout)，特別是 TopAppBar 與 BottomNavBar 的覆用佈局。
