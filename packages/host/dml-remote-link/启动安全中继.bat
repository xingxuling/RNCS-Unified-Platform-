@echo off
chcp 65001 >nul
set /p DML_ALLOWED_ORIGINS=请输入允许的工作台 Origin（例如 https://your-app.lovable.app）: 
if "%DML_ALLOWED_ORIGINS%"=="" set DML_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
node src\relay\cli.mjs serve --host 127.0.0.1 --port 17901 --origins "%DML_ALLOWED_ORIGINS%" --state state\relay
pause
