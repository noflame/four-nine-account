## 1. Components Setup

- [ ] 1.1 建立 `AssetsHero.tsx` 於 `apps/web/src/components/assets/`，實作「淨資產總計與成長幅度」區塊，套用漸層與文字樣式。
- [ ] 1.2 建立 `AssetList.tsx` 於 `apps/web/src/components/assets/`，實作「資產明細」的 Bento Grid，包含不同資產項目、長條圖與 Hover 後的編輯/刪除按鈕。
- [ ] 1.3 建立 `AllocationChart.tsx` 於 `apps/web/src/components/assets/`，實作「資產配置比例」區塊。

## 2. Page Layout Integration

- [ ] 2.1 修改原本位於 Dashboard 的 `TopAppBar`，讓它能支援自訂標題，以便在資產頁面顯示「資產管理」。
- [ ] 2.2 重構 `apps/web/src/pages/assets.tsx`，替換掉原本的版面，引入 `TopAppBar`、`AssetsHero`、`AssetList`、`AllocationChart`。
- [ ] 2.3 於 `assets.tsx` 實作頁面右下角的「建立資產」懸浮按鈕 (FAB)。
- [ ] 2.4 確保所有 Tailwind CSS 樣式、Material Icons 等視覺呈現皆與提供的 HTML 原型完全一致。
