# Product Requirements Document (PRD): 家庭資產記帳系統 (Multi-Ledger)

## 1. 專案概述 (Project Overview)
### 1.1 背景
建立一個專為家庭或個人使用的記帳與資產管理網站，核心架構升級為 **Multi-Ledger (多帳本)** 系統。每個「帳本 (Ledger)」可視為一個獨立的家庭或個人帳務空間。
旨在解決市面上記帳軟體對「資產消長」、「信用卡分期管理」與「股票投資損益」整合度不足的問題，並透過靈活的帳本切換功能，滿足使用者同時管理「個人私帳」與「家庭公帳」的需求。

### 1.2 目標
- **帳本隔離**：支援一人多本帳（如：個人帳本、家庭公用帳本），資料完全隔離。
- **全貌掌握**：提供清晰的資產總覽（Net Worth），每個帳本獨立計算。
- **精準追蹤**：準確計算信用卡分期與繳款狀態。
- **投資整合**：即時掌握股票投資損益。
- **協作共用**：支援帳本共享，多人共同記帳（Owner/Editor/Viewer 權限分級）。
- **行動優先**：介面針對手機優化，支援 PWA 安裝。

## 2. 技術架構 (Technical Stack)
- **Frontend**: React (Vite)
  - 部署於 Cloudflare Pages。
  - 使用 `useApiClient` 封裝，自動注入 `X-Ledger-Id` Header。
- **Backend**: Hono
  - 部署於 Cloudflare Workers。
  - Middleware 統一驗證 `X-Ledger-Id` 權限。
- **Auth**: Firebase Authentication
  - 提供 Google Sign-In 與 Email/Password 登入。
- **Database**: Cloudflare D1 (SQLite)
  - 核心表格：`ledgers`, `ledger_users`。
  - 資料表格（Scoped）：`assets`, `transactions`, `credit_cards`, `stocks`, `categories`，皆包含 `ledger_id` 欄位。
- **ORM**: Drizzle ORM
- **Stock Data**: `yahoo-finance2`
- **Styling**: Tailwind CSS + Shadcn/ui

## 3. 功能需求 (Functional Requirements)

### 3.1 帳本與權限管理 (Ledger & RBAC) [NEW]
- **多帳本架構**：
  - 使用者註冊後，預設引導建立第一個帳本。
  - 支援隨時建立新帳本（Create Ledger）或加入現有帳本（Join Ledger）。
  - **切換帳本**：提供全域切換器 (Switcher)，切換後前端所有資料自動刷新為該帳本內容。

- **角色與權限 (Role-Based Access Control)**：
  權限綁定於「帳本」而非「系統全域」。一位使用者在帳本 A 可以是擁有者，在帳本 B 可以是觀察者。
| 角色 (Role) | 權限描述 | 適用場景 |
| :--- | :--- | :--- |
| **Owner (擁有者)** | 完全控制，可邀請/移除成員，刪除帳本。 | 家長、帳本建立者 |
| **Editor (編輯者)** | 可新增/修改/刪除交易、資產、卡片。不可管理成員。 | 配偶、共同記帳人 |
| **Viewer (觀察者)** | 僅可檢視資料，不可修改。 | 小孩、會計檢視 |

### 3.2 資料儲存策略 (Data Storage Strategy)
為了確保精確度，所有涉及金額與價格的欄位採用統一標準：
- **儲存型別**：SQLite `INTEGER` (64-bit)。
- **轉換邏輯**：**所有數值一律放大 10,000 倍** (Scale Factor = 10,000)。
  - $100 TWD -> 存入 `1,000,000`
  - $12.50 USD -> 存入 `125,000`
- **前端顯示**：除以 10,000 後顯示。

### 3.3 資產管理模組 (Asset Management)
- **帳戶管理**：
  - 綁定於特定 Ledger。
  - 支援現金、銀行、數位帳戶。
  - 支援現金、銀行、數位帳戶。
- **資產總覽**：
  - 計算 Net Worth = (Assets Total - Liabilities Total)。

### 3.4 信用卡管理模組 (Credit Card Tracking)
- **分期付款**：
  - 勾選分期後，系統記錄總金額與期數。
  - **自動繳款**：支援「繳卡費」功能，從資產帳戶扣款並沖銷信用卡債務。

### 3.5 股票投資模組 (Stock Trading)
- **獨立持倉**：
  - 每個帳本獨立管理持倉。
  - 支援自訂「受益人 (Owner Label)」，如：爸爸、媽媽、小孩，方便在同一帳本下區分歸屬。
- **操作**：
  - **Buy**：扣除帳戶餘額，增加持倉。
  - **Sell**：減少持倉，增加帳戶餘額（實現損益）。

### 3.6 交易記帳模組 (Transactions)
所有記帳行為皆需發生於特定 Ledger Context 下：
- **核心邏輯**：
  - **支出 (Expense)**：Source Account -> null (金額流出)
  - **收入 (Income)**：null -> Destination Account (金額流入)
  - **轉帳 (Transfer)**：Source -> Destination
  - **刷卡 (Credit)**：Credit Card -> null (負債增加)
- **分類管理**：
  - 分類 (Categories) 亦為 Ledger Scoped。
  - 新開帳本時，系統自動複製一份預設分類 (Seed Data) 給該帳本。

## 4. UI/UX 設計
- **全域 Ledger Context**：
  - 頂部/側邊欄顯示「目前帳本名稱」。
  - 任何新增/修改操作皆隱式攜帶 `ledgerId`。
- **Mobile First**：
  - FAB (懸浮按鈕) 快速記帳。
  - 響應式卡片設計。

## 5. 非功能需求
- **安全性**：API 強制檢查 `X-Ledger-Id` 與 User 的關聯表 (`ledger_users`)。
- **隔離性**：確保 A 帳本成員無法透過任何方式存取 B 帳本資料（除非也被加入 B 帳本）。

## 6. 未來規劃
- 帳本邀請碼機制的 UI 優化（QR Code）。
- Telegram Bot 整合（支援連動不同帳本）。
- CSV 匯入/匯出。