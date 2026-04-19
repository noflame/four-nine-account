## 1. Backend API Extension

- [x] 1.1 修改 `apps/api/src/routes/dashboard.ts`，增加 `totalCreditLimit` 與 `usedCredit` 欄位的回傳。需從 `creditCards` 資料表抓取額度並累加，與負債總額一併回傳。
- [x] 1.2 修改 `apps/api/src/routes/dashboard.ts`，增加 `liquidCash` (可用現金) 與 `monthlyGrowth` (月成長率) 欄位，供 `HeroSection` 顯示使用。

## 2. Frontend Data Fetching

- [x] 2.1 在 `apps/web/src/pages/dashboard.tsx` 中引入 `useQuery` 與 Hono RPC (`hc`)，實作呼叫 `/api/dashboard` 的邏輯。
- [x] 2.2 實作 Loading 狀態：當資料載入中時，在原本的卡片位置渲染對應的 Skeleton 骨架屏元件。
- [x] 2.3 實作 Error 狀態：當 API 發生錯誤時，提供簡單的錯誤訊息或重試機制。

## 3. Frontend Components Update (Remove Mock Data)

- [x] 3.1 修改 `HeroSection`：將靜態假資料移除，改為接收 `netWorth`, `monthlyGrowth`, `liquidCash` 作為 Props 並顯示。
- [x] 3.2 修改 `TransactionList`：將靜態陣列移除，改為接收 `transactions` 作為 Props 進行迴圈渲染。
- [x] 3.3 修改 `ExpenseAnalysisCard`：改為接收 `monthlyExpenses` 等資料作為 Props 並呈現。
- [x] 3.4 修改 `CreditLimitCard`：改為接收 `totalCreditLimit` 與 `usedCredit` 作為 Props，並依此計算 Progress Bar 的寬度比例與剩餘額度。
