@echo off
echo Starting development server with Clash proxy...
set HTTP_PROXY=http://127.0.0.1:7897
set HTTPS_PROXY=http://127.0.0.1:7897
npm run dev
