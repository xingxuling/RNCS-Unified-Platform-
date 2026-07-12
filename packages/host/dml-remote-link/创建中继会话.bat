@echo off
chcp 65001 >nul
node src\relay\cli.mjs create-session --state state\relay --name "数字蓝天机"
pause
