@echo off
chcp 65001 >nul
title 增強版RAG系統 - Windows自動安裝器

echo ========================================
echo     增強版RAG系統 - Windows自動安裝器
echo ========================================
echo.

:check_admin
echo 🔍 檢查管理員權限...
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ 管理員權限已確認
    goto check_python
) else (
    echo ⚠️  需要管理員權限進行安裝
    echo.
    echo 請以管理員身份運行此程序：
    echo 1. 右鍵點擊此文件
    echo 2. 選擇「以管理員身份運行」
    echo.
    pause
    exit /b 1
)

:check_python
echo.
echo 🔍 檢查Python環境...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未找到Python
    goto install_python
) else (
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
    echo ✅ Python版本: %PYTHON_VERSION%
    
    rem 檢查Python版本
    python -c "import sys; exit(0) if sys.version_info >= (3, 8) else exit(1)" >nul 2>&1
    if errorlevel 1 (
        echo ❌ Python版本過低 (需要>=3.8)
        goto install_python
    ) else (
        echo ✅ Python版本符合要求
        goto install_dependencies
    )
)

:install_python
echo.
echo 📥 安裝Python 3.8+...
echo.
echo 請訪問以下網址下載Python安裝程序：
echo https://www.python.org/downloads/
echo.
echo 安裝時請務必勾選：
echo ✅ Add Python to PATH
echo ✅ Install launcher for all users
echo.
echo 安裝完成後重新運行此安裝程序。
echo.
pause
exit /b 1

:install_dependencies
echo.
echo 📦 安裝Python依賴...
echo.

rem 創建requirements.txt
echo # 增強版RAG系統依賴 > requirements.txt
echo python^>=3.8 >> requirements.txt
echo. >> requirements.txt
echo # 可選依賴（增強功能） >> requirements.txt
echo # colorama^>=0.4.6    # 彩色終端輸出 >> requirements.txt
echo # tqdm^>=4.66.0      # 進度條顯示 >> requirements.txt
echo # psutil^>=5.9.0     # 系統監控 >> requirements.txt

echo 正在安裝依賴，請稍候...
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ 依賴安裝失敗
    echo 請手動運行: pip install -r requirements.txt
    pause
    exit /b 1
)
echo ✅ 依賴安裝完成

:create_directories
echo.
echo 📁 創建系統目錄...
mkdir output 2>nul
mkdir logs 2>nul
mkdir config 2>nul
mkdir temp 2>nul
echo ✅ 目錄創建完成

:create_config
echo.
echo ⚙️  創建配置文件...
echo {
echo   "system": {
echo     "name": "Enhanced RAG System",
echo     "version": "1.0.0",
echo     "windows": true
echo   },
echo   "paths": {
echo     "default_project_dir": "C:\\Users\\%USERNAME%\\projects",
echo     "output_dir": "./output",
echo     "logs_dir": "./logs"
echo   }
echo } > config\system_config.json
echo ✅ 配置文件創建完成

:create_launcher
echo.
echo 🚀 創建Windows啟動器...

rem 創建主啟動器
echo @echo off > RAG_System.bat
echo chcp 65001 ^>nul >> RAG_System.bat
echo. >> RAG_System.bat
echo echo ======================================== >> RAG_System.bat
echo echo     增強版RAG系統 - Windows版本 >> RAG_System.bat
echo echo ======================================== >> RAG_System.bat
echo echo. >> RAG_System.bat
echo. >> RAG_System.bat
echo :menu >> RAG_System.bat
echo echo ======================================== >> RAG_System.bat
echo echo     主菜單 >> RAG_System.bat
echo echo ======================================== >> RAG_System.bat
echo echo. >> RAG_System.bat
echo echo    [1] 🚀 增強版RAG分析 >> RAG_System.bat
echo echo    [2] 📊 監測系統 >> RAG_System.bat
echo echo    [3] 🔄 增量處理 >> RAG_System.bat
echo echo    [4] 🔍 基礎分析 >> RAG_System.bat
echo echo    [5] 📖 查看文檔 >> RAG_System.bat
echo echo    [6] ❌ 退出 >> RAG_System.bat
echo echo. >> RAG_System.bat
echo echo ======================================== >> RAG_System.bat
echo set /p choice="請選擇功能 (1-6): " >> RAG_System.bat
echo. >> RAG_System.bat
echo if "%%choice%%"=="1" goto enhanced >> RAG_System.bat
echo if "%%choice%%"=="2" goto monitor >> RAG_System.bat
echo if "%%choice%%"=="3" goto incremental >> RAG_System.bat
echo if "%%choice%%"=="4" goto basic >> RAG_System.bat
echo if "%%choice%%"=="5" goto docs >> RAG_System.bat
echo if "%%choice%%"=="6" goto exit >> RAG_System.bat
echo. >> RAG_System.bat
echo echo ❌ 無效選擇 >> RAG_System.bat
echo pause >> RAG_System.bat
echo goto menu >> RAG_System.bat
echo. >> RAG_System.bat
echo :enhanced >> RAG_System.bat
echo echo. >> RAG_System.bat
echo set /p project_path="請輸入項目路徑: " >> RAG_System.bat
echo if "%%project_path%%"=="" ( >> RAG_System.bat
echo     echo ❌ 未輸入項目路徑 >> RAG_System.bat
echo     pause >> RAG_System.bat
echo     goto menu >> RAG_System.bat
echo ) >> RAG_System.bat
echo python main_enhanced.py "%%project_path%%" >> RAG_System.bat
echo pause >> RAG_System.bat
echo goto menu >> RAG_System.bat
echo. >> RAG_System.bat
echo :monitor >> RAG_System.bat
echo python run_monitoring_system.py >> RAG_System.bat
echo pause >> RAG_System.bat
echo goto menu >> RAG_System.bat
echo. >> RAG_System.bat
echo :incremental >> RAG_System.bat
echo echo. >> RAG_System.bat
echo set /p project_path="請輸入項目路徑: " >> RAG_System.bat
echo if "%%project_path%%"=="" ( >> RAG_System.bat
echo     echo ❌ 未輸入項目路徑 >> RAG_System.bat
echo     pause >> RAG_System.bat
echo     goto menu >> RAG_System.bat
echo ) >> RAG_System.bat
echo python run_with_incremental_processing.py "%%project_path%%" >> RAG_System.bat
echo pause >> RAG_System.bat
echo goto menu >> RAG_System.bat
echo. >> RAG_System.bat
echo :basic >> RAG_System.bat
echo echo. >> RAG_System.bat
echo set /p project_path="請輸入項目路徑: " >> RAG_System.bat
echo if "%%project_path%%"=="" ( >> RAG_System.bat
echo     echo ❌ 未輸入項目路徑 >> RAG_System.bat
echo     pause >> RAG_System.bat
echo     goto menu >> RAG_System.bat
echo ) >> RAG_System.bat
echo python main.py "%%project_path%%" >> RAG_System.bat
echo pause >> RAG_System.bat
echo goto menu >> RAG_System.bat
echo. >> RAG_System.bat
echo :docs >> RAG_System.bat
echo start README_ENHANCED.md >> RAG_System.bat
echo goto menu >> RAG_System.bat
echo. >> RAG_System.bat
echo :exit >> RAG_System.bat
echo echo. >> RAG_System.bat
echo echo 👋 感謝使用增強版RAG系統！ >> RAG_System.bat
echo echo. >> RAG_System.bat
echo pause >> RAG_System.bat
echo exit /b 0 >> RAG_System.bat

echo ✅ 創建主啟動器: RAG_System.bat

rem 創建桌面快捷方式
echo.
echo 📋 創建桌面快捷方式...
set "SCRIPT=%~dp0RAG_System.bat"
set "SHORTCUT=%USERPROFILE%\Desktop\增強版RAG系統.lnk"

powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT%'); $s.TargetPath = '%SCRIPT%'; $s.WorkingDirectory = '%~dp0'; $s.Save()"

if errorlevel 1 (
    echo ⚠️  桌面快捷方式創建失敗
    echo 請手動創建快捷方式
) else (
    echo ✅ 桌面快捷方式已創建
)

rem 創建開始菜單快捷方式
echo.
echo 📋 添加到開始菜單...
set "START_MENU_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\增強版RAG系統"
if not exist "%START_MENU_DIR%" mkdir "%START_MENU_DIR%"

set "MENU_SHORTCUT=%START_MENU_DIR%\增強版RAG系統.lnk"
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%MENU_SHORTCUT%'); $s.TargetPath = '%SCRIPT%'; $s.WorkingDirectory = '%~dp0'; $s.Save()"

if errorlevel 1 (
    echo ⚠️  開始菜單快捷方式創建失敗
) else (
    echo ✅ 開始菜單快捷方式已創建
)

:create_test_project
echo.
echo 🧪 創建測試項目...
mkdir test_project 2>nul
echo # 測試項目 > test_project\README.md
echo 用於測試增強版RAG系統。 >> test_project\README.md
echo. >> test_project\README.md
echo print("測試項目運行正常！") > test_project\test.py
echo ✅ 測試項目創建完成

:installation_complete
echo.
echo ========================================
echo 🎉 安裝完成！
echo ========================================
echo.
echo 📋 安裝摘要：
echo.
echo ✅ Python環境檢查通過
echo ✅ 依賴包安裝完成
echo ✅ 系統目錄創建完成
echo ✅ 配置文件設置完成
echo ✅ Windows啟動器創建完成
echo ✅ 桌面快捷方式創建完成
echo ✅ 開始菜單快捷方式創建完成
echo ✅ 測試項目準備完成
echo.
echo 🚀 使用方法：
echo.
echo 1. 雙擊桌面「增強版RAG系統」快捷方式
echo 2. 或從開始菜單啟動
echo 3. 或運行 RAG_System.bat
echo.
echo 💡 立即試用：
echo   運行 RAG_System.bat 並選擇功能
echo.
echo 📖 文檔：
echo   README_ENHANCED.md    - 詳細系統文檔
echo   QUICK_START_GUIDE.md  - 快速開始指南
echo.
echo ========================================
echo 🧪 測試系統：
echo   運行: python main_enhanced.py test_project
echo ========================================
echo.
pause
exit /b 0