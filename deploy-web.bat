@echo off
echo Building Web App...
cd apps/web
set VITE_API_URL=https://lin-fan-api.linjuang.workers.dev
call pnpm build
if %ERRORLEVEL% NEQ 0 (
    echo Build failed!
    exit /b %ERRORLEVEL%
)

echo Deploying to Cloudflare Pages...
set CLOUDFLARE_ACCOUNT_ID=644cca80ced0666be85479869a4f17a8
call npx wrangler pages deploy dist --project-name=lin-fan-web --branch=main
if %ERRORLEVEL% NEQ 0 (
    echo Deployment failed!
    exit /b %ERRORLEVEL%
)

echo Deployment Complete!
echo You can visit your site at: https://lin-fan-web.pages.dev
