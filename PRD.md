# Product Requirements Document (PRD): 家庭資產記帳系統

## 1. 專案概述 (Project Overview)
### 1.1 背景
建立一個專為家庭或個人使用的記帳與資產管理網站，旨在解決市面上記帳軟體對「資產消長」、「信用卡分期管理」與「股票投資損益」整合度不足的問題。特別針對家庭場景，需具備讓小孩參與記帳但保護家庭資產隱私的權限控管功能。

### 1.2 目標
- **全貌掌握**：提供清晰的資產總覽（Net Worth）。
- **精準追蹤**：準確計算信用卡分期與繳款狀態。
- **投資整合**：即時掌握股票投資損益。
- **家庭共用**：支援多成員協作，並具備隱私分級。
- **行動優先**：介面需針對手機 (iOS/Android) 優化，確保隨時隨地皆可流暢操作。

## 2. 技術架構 (Technical Stack)
- **Frontend**: React (Vite)
  - 部署於 Cloudflare Pages。
- **Backend**: Hono
  - 部署於 Cloudflare Workers / Pages Functions。
  - 使用 Hono RPC 實現型別安全。
- **Auth**: Firebase Authentication
  - 提供 Google Sign-In 與 Email/Password 登入。
  - 使用 Firebase SDK 進行前端身分驗證，後端透過 ID Token 驗證。
- **Database**: Cloudflare D1 (SQLite)
- **ORM**: Drizzle ORM
- **Stock Data**: `yahoo-finance2`
- **Styling**: Tailwind CSS + Shadcn/ui

## 3. 功能需求 (Functional Requirements)

### 3.1 權限與使用者管理 (RBAC)
- **身分驗證**：採用 **Firebase Authentication** 處理登入與註冊。
- **角色授權**：使用者登入後，系統根據資料庫 `users` table 中的 `role` 欄位決定權限。
| 角色 | 權限描述 |
| :--- | :--- |
| **Admin (家長)** | 完全控制，可見全家資產。 |
| **Member (配偶)** | 共同管理，可見全家資產。 |
| **Child (小孩)** | 僅可見自己的錢包餘額與收支。 |

### 3.2 資料儲存策略 (Data Storage Strategy) [UPDATED]
為了確保計算精確度與開發一致性，所有涉及金額與價格的欄位採用統一標準：
- **儲存型別**：SQLite `INTEGER` (64-bit)。
- **轉換邏輯**：**所有數值一律放大 10,000 倍** (Scale Factor = 10,000)。
  - 範例 1 (台幣)：$100 TWD -> 存入 `1,000,000`
  - 範例 2 (美金)：$12.50 USD -> 存入 `125,000`
  - 範例 3 (股價)：$34.5678 -> 存入 `345,678`
- **前端顯示**：
  - 取出數值除以 10,000。
  - 依照幣別決定顯示小數位數 (如 TWD 顯示 0 位, USD 顯示 2 位)。

### 3.3 資產管理模組 (Asset Management)
- **帳戶管理**：
  - 支援現金、銀行、數位帳戶。
  - 綁定 Owner 以落實權限控管。
- **資產總覽**：
  - 計算 Net Worth 時，將各幣別/資產統一轉換為基礎貨幣 (如 TWD) 顯示。

### 3.4 信用卡管理模組 (Credit Card Tracking)
- **分期付款**：
  - 勾選分期後，系統記錄總金額與期數，後端邏輯自動攤提每月應繳金額。
  - 攤提時若有除不盡的餘數，將餘數加總至第一期或最後一期，確保總帳吻合。

### 3.6 交易記帳模組 (Transactions & Smart Asset Logic) [NEW]
為了達成「好記帳」的目標，記帳功能需高度自動化並與資產連動：

- **核心邏輯**：
  - **支出 (Expense)**：記錄金額並從指定 `Source Account` 扣款。
  - **收入 (Income)**：記錄金額並存入指定 `Destination Account`。
  - **轉帳 (Transfer)**：從 `Source Account` 扣款並存入 `Destination Account` (資產不滅)。

- **分類管理 (Categories) [UPDATED]**：
  - **預設分類**：系統預載常用分類（食、衣、住、行、育、樂、薪資、投資等），方便快速上手。
  - **自訂分類**：
    - 支援使用者**新增**與**刪除**自訂分類。
    - 提供預設圖示集 (Icons) 供選擇。

- **UI/UX 設計 (Mobile First)**：
  - **快速記帳入口 (FAB)**：在主畫面右下角提供懸浮按鈕 (+)，點擊即進入記帳模式。
  - **直覺表單**：
    - 大字體數字鍵盤與金額顯示。
    - 頂部快速切換「支出 / 收入 / 轉帳」。
    - 網格狀 (Grid) 顯示分類圖示，減少選單層級。


### 3.5 股票投資模組 (Stock Trading)
- **現價更新**：
  - 透過 Cron Trigger 定期更新股價。
  - 股價同樣採用 `INTEGER (x10000)` 儲存，確保無浮點數誤差。
- **損益計算**：
  - 所有運算 (成本、現價、手續費) 皆在整數層級完成運算後，最後才除以 10,000 進行顯示。

## 4. 非功能需求
- **效能**：API 回應 < 100ms。
- **備份**：D1 自動備份。
- **擴充性**：保留未來匯率換算彈性 (x10000 的精度足夠支援大多數匯率)。
- **跨平台支援**：必須完整支援 iOS 與 Android 手機瀏覽器操作 (RWD/PWA)。

## 5. 未來規劃
- CSV 匯入。
- Telegram 通知。