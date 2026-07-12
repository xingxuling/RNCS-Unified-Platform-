@echo off
chcp 65001 >nul
set /p SESSION_ID=请输入 session_id: 
set /p PAIR_CODE=请输入 pair_code: 
node src\host\cli.mjs pair --relay http://127.0.0.1:17901 --session "%SESSION_ID%" --code "%PAIR_CODE%" --allow-http --state state\host
pause
