# Proposal: Connect Dashboard API

## Problem
目前新版的交易儀表板 (Dashboard) 雖然已經完成了 UI 佈局與元件開發，但畫面上的數據與列表全部使用寫死的靜態假資料 (Mock Data)。這使得儀表板無法反映使用者的真實財務狀況。

## Proposed Solution
我們將替換 `HeroSection`, `TransactionList`, `ExpenseAnalysisCard` 以及 `CreditLimitCard` 中的假資料，並串接現有的 `/api/dashboard` 及相關後端端點。
若現有端點（例如 `monthlyGrowth` 或是各信用卡的 `limit` 額度）資訊不足，也將同步微調後端 API 以補齊畫面所需之欄位。

## What Changes

1. **Dashboard Page (Frontend)**:
   - 引入 TanStack Query (React Query) 搭配 Hono RPC 來獲取 `/api/dashboard` 的資料。
   - 將獲取到的資料透過 Props 或 Context 往下傳遞給各個子元件。
   - 實作資料加載中 (Loading) 與錯誤 (Error) 狀態的 UI 處理。
2. **Dashboard API (Backend)**:
   - 擴充 `/api/dashboard` 端點，補齊前端 `HeroSection` 需顯示的可用現金 (Liquid Cash) 或月成長率 (Monthly Growth)。
   - 補齊 `CreditLimitCard` 所需要的總信用額度 (Total Credit Limit) 與已用額度 (Used Credit) 資訊。

## Capabilities

### Modified Capabilities
- `transaction-dashboard`: 儀表板畫面將不再使用靜態資料，而是真實反映資料庫中的財務數據。

## Impact
- `apps/web/src/pages/dashboard.tsx`
- `apps/web/src/components/dashboard/*.tsx`
- `apps/api/src/routes/dashboard.ts`

</template>
<success_criteria>
- 所有 Dashboard 子元件皆成功顯示 API 回傳的真實數據。
- 無任何寫死的假資料殘留於 Dashboard 的渲染邏輯中。
</success_criteria>
<unlocks>
Completing this artifact enables: design, specs
</unlocks>
