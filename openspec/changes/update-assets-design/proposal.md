## Why

目前 Luminous Ledger 的資產管理頁面需要跟進現代化與優質化的設計體驗。透過新的 UI 設計，我們將提供更直覺的淨資產總計（包含成長幅度）、條理分明的資產明細分類清單，以及更清晰的資產配置比例圓餅/長條圖，藉此幫助使用者更容易掌握與管理其資產配置。

## What Changes

1. **重構 `/assets` 頁面**：根據提供的 HTML 原型，以 Tailwind CSS 重新建構頁面佈局與設計樣式。
2. **覆用共用元件**：將 `Dashboard` 所使用的 `TopAppBar` 應用到資產管理頁面上，確保導覽列的視覺與功能一致性。
3. **實作新的卡片與清單設計**：
   - Hero Section：顯示「淨資產總計」與月增長率，背景帶有主要品牌色的漸層與裝飾。
   - 資產明細 (Asset List)：清單列出各類別（現金、銀行帳戶、數位資產等），支援 Hover 效果並預留編輯/刪除按鈕空間。
   - 資產配置比例 (Allocation Chart)：以視覺化的條狀比例圖顯示現金、銀行與數位資產的分佈狀況。
   - 建立資產按鈕 (FAB)：頁面右下角懸浮按鈕。

## Capabilities

### New Capabilities
- `assets-management`: A modernized assets management interface that displays total net worth, categorizes asset types, visualizes asset allocation, and allows initiating asset creation.

### Modified Capabilities
<!-- No existing capabilities to modify. -->

## Impact

- **UI Components**: 會需要新增或修改 `AssetsPage` (`apps/web/src/pages/assets.tsx`) 的排版。
- **Shared Components**: 可能需要稍微調整 `TopAppBar` 以支援自訂標題，或是確保在不同頁面都能正確顯示。
- **Styling**: 完全使用 Tailwind CSS 處理，不依賴外部 CSS 檔案。
