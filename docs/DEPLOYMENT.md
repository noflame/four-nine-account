# 部署說明文件 (Deployment Guide)

本專案是一個 Monorepo 架構，包含後端 API (Cloudflare Workers) 與前端 Web (React + Vite)，並使用 Cloudflare D1 作為資料庫。

## 1. 前置準備 (Prerequisites)

請確保您的開發環境已安裝以下工具：

- **Node.js**: v18 或以上
- **pnpm**: 套件管理工具 (`npm install -g pnpm`)
- **Wrangler**: Cloudflare CLI 工具 (`npm install -g wrangler`)
- **Cloudflare 帳號**: 需要登入 Cloudflare (`wrangler login`)

## 2. 專案安裝 (Installation)

在專案根目錄執行：

```bash
pnpm install
```

## 3. 資料庫設定 (Database Setup)

本專案使用 Cloudflare D1。

### 3.1 建立 D1 資料庫

```bash
npx wrangler d1 create lin-fan-db
```

執行後會顯示 `database_id`，請將其填入 `apps/api/wrangler.toml` 中的 `database_id` 欄位。

### 3.2 執行資料庫遷移 (Migrations)

將資料庫結構部署到 Cloudflare D1：

```bash
# 在專案根目錄執行
npx wrangler d1 migrations apply lin-fan-db --remote --config apps/api/wrangler.toml
```

> **注意**: 如果是本地開發測試，請加上 `--local` 參數。

## 4. 後端部署 (Backend Deployment)

後端位於 `apps/api`，是一個 Hono 應用程式。

### 4.1 設定環境變數

確認 `apps/api/wrangler.toml` 設定正確。

### 4.2 部署到 Cloudflare Workers

```bash
cd apps/api
pnpm run deploy
# 或者
npx wrangler deploy --minify src/index.ts
```

部署成功後，您會獲得一個 API URL (例如 `https://api.your-project.workers.dev`)。

## 5. 前端部署 (Frontend Deployment)

前端位於 `apps/web`，是一個 React + Vite 應用程式。

### 5.1 設定環境變數

在 `apps/web` 目錄下建立 `.env.production` 檔案 (或直接在 Cloudflare Pages 後台設定)，填入後端 API 網址：

```env
VITE_API_URL=https://api.your-project.workers.dev
```

### 5.2 建置與部署

#### 方法 A: 使用 Cloudflare Pages (推薦)

1. 登入 Cloudflare Dashboard，進入 "Workers & Pages"。
2. 選擇 "Create Application" -> "Pages" -> "Connect to Git"。
3. 選擇您的 GitHub Repository。
4. 設定 Build Settings:
   - **Framework Preset**: Vite
   - **Build Command**: `pnpm run build`
   - **Build Output Directory**: `dist`
   - **Root Directory**: `apps/web` (重要！)
5. 設定 Environment Variables:
   - `VITE_API_URL`: 填入步驟 4.2 獲得的後端 URL。

#### 方法 B: 手動建置並上傳

```bash
cd apps/web
pnpm run build
npx wrangler pages deploy dist --project-name lin-fan-web
```

## 6. Firebase Authentication 設定

前端使用 Firebase 進行身分驗證。

1. 在 Firebase Console 建立專案。
2. 啟用 Authentication，並開啟 Google Sign-In 提供者。
3. 新增 Web App，取得 Firebase Config。
4. 在 `apps/web/.env` 或 Cloudflare Pages 環境變數中設定 Firebase Config：

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## 7. 常見指令 (Commands)

- **啟動本地開發環境**: `pnpm dev`
- **本地 API 測試**: `cd apps/api && pnpm dev`
- **本地 Web 測試**: `cd apps/web && pnpm dev`
