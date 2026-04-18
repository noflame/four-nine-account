# Design: Update Transaction Design

## Context
使用者提供了一份全新的「交易畫面總覽」靜態 HTML 樣本，包含了複雜的 UI 元素如漸層背景、毛玻璃 (Glassmorphism) 效果、Bento-style 佈局與自定義的 Material Design 色票。我們需要將這份設計轉換為前端專案中的 React 元件與佈局。

## Goals / Non-Goals

**Goals:**
* 完整還原 HTML 樣本中的視覺設計，包含 TopAppBar, 總淨值卡片, 交易紀錄列表, 分析圖表以及底部導航列。
* 將設計拆解為可覆用的 React 元件。
* 更新 Tailwind CSS 設定檔，匯入樣本中定義的自定義色票 (如 `primary-fixed-dim`, `surface-container` 等) 與字體配置 (Manrope, Inter)。
* 確保 RWD 與行動裝置的顯示效果與底部導航列的行為一致。

**Non-Goals:**
* 第一階段不實作與後端 API 的真實資料串接，先使用 Mock Data 填入元件，但必須預留可接收資料的 Props。
* 暫不處理「資產明細」頁籤切換後的實際畫面設計（專注於「今日紀錄」/ 總覽版面）。

## Decisions
1. **全域樣式更新**: 
   * 更新 `tailwind.config.ts` 中的 `theme.extend.colors` 與 `theme.extend.fontFamily`。
   * 在 `index.css` (或全域 CSS) 引入 `Manrope`, `Inter` 字體，以及 `Material Symbols Outlined`。
2. **元件拆分策略**:
   * `TransactionDashboard` (Page/Layout): 負責組合各區塊。
   * `TopAppBar`: 包含 Logo, 標題、通知與頭像。
   * `NetWorthCard`: 處理漸層背景、總資產、月增長與可用現金的展示。
   * `SegmentedControl`: 頁籤切換元件。
   * `TransactionList` & `TransactionItem`: Bento-style 的交易明細列表與單筆項目。
   * `ExpenseAnalysisCard` & `CreditLimitCard`: 側邊的分析區塊。
   * `BottomNavBar`: 底部的主要導航列。

## Risks / Trade-offs
* **樣式衝突**: 匯入大量自定義 Tailwind 色票可能會與現有色票命名產生衝突，需要仔細檢視並整合。
* **字型與圖示載入效能**: 直接透過 Google Fonts 載入兩種字型及 Material Symbols 可能增加 Initial Load Time，後續可考慮自行 host 或做預載入最佳化。
