@echo off
chcp 65001 >nul
echo ========================================
echo    RAG 自動化系統 - 安裝程序
echo ========================================
echo.

echo 🚀 開始安裝 RAG 自動化系統...
echo.

REM 檢查 Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未找到 Python
    echo 請先安裝 Python 3.8+
    echo 下載地址: https://www.python.org/downloads/
    echo.
    echo 安裝時請務必勾選:
    echo   ✅ Add Python to PATH
    echo   ✅ Install launcher for all users
    echo.
    pause
    exit /b 1
)

echo ✅ Python 已安裝
echo.

REM 檢查必要文件
if not exist "rag_app.py" (
    echo ❌ 找不到主程序文件 rag_app.py
    pause
    exit /b 1
)

if not exist "main.py" (
    echo ❌ 找不到分析腳本 main.py
    pause
    exit /b 1
)

echo ✅ 系統文件檢查完成
echo.

REM 創建桌面快捷方式
echo 📋 創建桌面快捷方式...

set "SCRIPT_PATH=%~dp0rag_app.py"
set "SHORTCUT_PATH=%USERPROFILE%\Desktop\RAG 自動化系統.lnk"

REM 使用 PowerShell 創建快捷方式
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = 'python'; $s.Arguments = '\"%SCRIPT_PATH%\"'; $s.WorkingDirectory = '%~dp0'; $s.IconLocation = '%~dp0rag_icon.ico,0'; $s.Description = 'RAG 自動化系統'; $s.Save()" >nul 2>&1

if errorlevel 1 (
    echo ⚠️  無法創建桌面快捷方式（可能需要管理員權限）
    echo 您可以手動創建快捷方式:
    echo   目標: python "%~dp0rag_app.py"
    echo   起始位置: %~dp0
    echo.
) else (
    echo ✅ 桌面快捷方式已創建
    echo.
)

REM 創建開始菜單快捷方式
echo 📋 創建開始菜單快捷方式...

set "START_MENU_PATH=%APPDATA%\Microsoft\Windows\Start Menu\Programs\RAG 系統"
mkdir "%START_MENU_PATH%" 2>nul

powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%START_MENU_PATH%\RAG 自動化系統.lnk'); $s.TargetPath = 'python'; $s.Arguments = '\"%SCRIPT_PATH%\"'; $s.WorkingDirectory = '%~dp0'; $s.IconLocation = '%~dp0rag_icon.ico,0'; $s.Description = 'RAG 自動化系統'; $s.Save()" >nul 2>&1

if errorlevel 1 (
    echo ⚠️  無法創建開始菜單快捷方式
) else (
    echo ✅ 開始菜單快捷方式已創建
    echo.
)

REM 創配置文件
echo ⚙️ 創建配置文件...

if not exist "config" mkdir config

(
echo {
echo   "system": {
echo     "name": "RAG 自動化系統",
echo     "version": "1.0.0",
echo     "install_date": "%date% %time%"
echo   },
echo   "paths": {
echo     "project_dir": "C:\\Users\\%USERNAME%\\projects",
echo     "output_dir": "output",
echo     "log_dir": "logs"
echo   },
echo   "settings": {
echo     "auto_update": true,
echo     "notifications": true,
echo     "monitor_interval": 5
echo   }
echo }
) > config\app_config.json

echo ✅ 配置文件已創建
echo.

REM 創建啟動腳本
echo 📜 創建啟動腳本...

(
echo @echo off
echo chcp 65001 ^>nul
echo echo 正在啟動 RAG 自動化系統...
echo echo.
echo python "%~dp0rag_app.py"
echo pause
) > start_rag.bat

echo ✅ 啟動腳本已創建
echo.

echo 🎉 安裝完成！
echo.
echo 📋 使用方法：
echo 1. 雙擊桌面上的「RAG 自動化系統」快捷方式
echo 2. 或運行 start_rag.bat
echo 3. 或直接運行: python rag_app.py
echo.
echo 💡 提示：
echo - 首次使用建議先查看幫助
echo - 確保項目目錄有讀取權限
echo - 大型項目可能需要較長時間分析
echo.
echo ========================================
echo    安裝完成，感謝使用！
echo ========================================
echo.
pause