## Context

目前 Dashboard 頁面 (`apps/web/src/pages/dashboard.tsx`) 的 UI 開發已經完成，包含 `HeroSection`、`SegmentedControl`、`TransactionList`、`ExpenseAnalysisCard` 以及 `CreditLimitCard` 等多個子元件。然而這些元件內部仍使用靜態假資料 (Mock Data) 進行渲染。
為確保系統具備真實價值，需要將 Dashboard 前端元件與後端 API (`/api/dashboard` 以及可能的 `/api/cards` 等) 進行串接，並以 TanStack Query (React Query) 取代現有的靜態邏輯，統一管理資料快取、加載中狀態與錯誤處理。

## Goals / Non-Goals

**Goals:**
- 於 `DashboardPage` 或個別子元件中引入 TanStack Query 抓取 `/api/dashboard` 資料。
- 將 `HeroSection`, `TransactionList`, `ExpenseAnalysisCard`, `CreditLimitCard` 等子元件改寫為接收真實資料（透過 Props 或內部呼叫 Hook）。
- 擴充 `/api/dashboard` 以提供 `CreditLimitCard` 需用到的總額度與已用額度資訊，以及 `HeroSection` 需要的可用現金或成長率資訊。
- 移除所有 Dashboard 子元件內的寫死假資料 (Mock Data)。

**Non-Goals:**
- 不包含新增其他頁面（如完整帳戶明細頁）的 API 串接。
- 不修改既有的 Tailwind 視覺設計或佈局方式。

## Decisions

1. **資料抓取層 (Data Fetching Layer):**
   決定使用 `TanStack Query (useQuery)` 配合 Hono RPC client (`hc`) 進行 API 抓取。
   *Rationale:* 專案已安裝 `@tanstack/react-query` 與 `@hono/zod-validator`。使用這套組合能獲得良好的型別安全 (Type-safety)，且 `useQuery` 能協助處理 Loading、Error 與自動重試 (Retries)，減少前端手動維護狀態的成本。

2. **API 擴充方式 (API Extension):**
   修改 `apps/api/src/routes/dashboard.ts`：
   - 增加 `totalCreditLimit` 與 `usedCredit` 欄位供 `CreditLimitCard` 使用（需查詢 `creditCards` 的 `limit` 總和）。
   - 調整或增加 `liquidCash` 或 `monthlyGrowth` 等欄位供 `HeroSection` 顯示。
   *Rationale:* 將儀表板需要的核心數據集中在一個 endpoint `/api/dashboard` 回傳，避免前端發起過多請求（N+1 問題），並加快首屏渲染速度。

3. **前端狀態分派 (Frontend State Distribution):**
   決定在 `DashboardPage` 頂層發起 `useQuery`，然後將擷取到的資料透過 Props 傳遞給 `HeroSection`、`TransactionList` 等子元件，或者如果專案慣例傾向元件自給自足，也可將 `useQuery` 封裝成自訂 Hook (e.g., `useDashboardData()`) 並在各個需要的子元件內部呼叫。為求資料一致與載入狀態容易統御，初步決定**在 `DashboardPage` 頂層抓取**，統一處理 Loading Skeleton 後再渲染子元件。

## Risks / Trade-offs

- **Risk:** 後端 `/api/dashboard` 目前的查詢邏輯在交易量極大時可能有性能瓶頸（例如：`Promise.all` 中對每張卡片作獨立查詢）。
  *Mitigation:* 初期可先保持現有寫法，若效能出現瓶頸，後續可針對 Dashboard 數據規劃 Redis 快取或資料庫 Materialized View 進行優化。
- **Trade-off:** 頂層元件 (`DashboardPage`) 抓取所有資料會導致任何一個子區塊資料卡住時，整個畫面都在 Loading。
  *Mitigation:* 這在 Dashboard 情境下相對合理，若未來要求部分區塊先顯示，再考慮將 Query 拆分為多個端點並獨立加載。
