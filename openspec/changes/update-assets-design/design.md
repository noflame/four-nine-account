## Context

專案目前正在進行介面現代化的翻新，其中 Dashboard 已初步完成設計與 API 的串接。接下來要更新「資產管理」 (`/assets`) 頁面，使用新的 HTML 設計稿與 Tailwind CSS 來全面重構。這個頁面將顯示所有資金帳戶與錢包，並讓使用者能夠新增、修改或刪除這些資產。

## Goals / Non-Goals

**Goals:**
- 以 Tailwind CSS 與提供的 HTML 原型完整重現「資產管理」頁面設計。
- 覆用與 Dashboard 相同的 `TopAppBar` 元件，保持整體風格一致。
- 將頁面結構拆分為合理的子元件（例如 `HeroSection`、`AssetList`、`AllocationChart`）。

**Non-Goals:**
- 不包含這階段與後端 `/api/assets` 進行實際的 CRUD API 串接（僅作靜態/假資料展示或準備好 Props，串接將於後續 Task 中進行）。
- 不調整其他不相關頁面的排版。

## Decisions

1. **元件切分與架構**：
   - 為了保持 `AssetsPage` 的乾淨，將 HTML 內文拆分為三個主要元件放置於 `apps/web/src/components/assets/`：
     - `AssetsHero`: 顯示總淨資產與成長率。
     - `AssetList`: 以 Bento Grid 呈現各項資產清單。
     - `AllocationChart`: 顯示資產配置比例圖。
   - `AssetsPage` 頁面本體將做為這三個元件的容器。

2. **TopAppBar 的覆用**：
   - 現有的 `TopAppBar` 位於 `apps/web/src/components/dashboard/TopAppBar.tsx`。
   - 為了符合「最上面的導覽頁覆用 dashboard 的元件」的要求，我們將直接在 `AssetsPage` 引入該元件。
   - 若 `TopAppBar` 內部有寫死「Dashboard」的標題文字，我們將修改它使其可接受 `title` prop，或根據目前的路徑動態變更標題，以利在 `/assets` 顯示正確的標題（例如：顯示 "Assets" 或不顯示）。

3. **樣式系統**：
   - 使用使用者定義好的 Tailwind 配置與 CSS 變數（包含在 `index.css` 與 `tailwind.config.js` 的設計系統代碼）。這確保了漸層色、`surface`、`primary` 等色彩變數能正確應用。

## Risks / Trade-offs

- [Risk] `TopAppBar` 可能原本緊密耦合於 Dashboard 邏輯。
  → Mitigation: 將標題作為 prop 抽離，讓它成為一個更純粹的 Layout 元件。
- [Risk] HTML 原型中的 Icon 可能是透過不同的字體設定引入（例如 `font-variation-settings`）。
  → Mitigation: 確認現有的 `index.html` 或 `index.css` 是否已有 Material Symbols Outlined 的正確設定，若無則補充。
