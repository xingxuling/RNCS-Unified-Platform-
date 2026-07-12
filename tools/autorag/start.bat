@echo off
REM auto-rag-system 啟動腳本 (Windows 版本)
REM 版本: 1.0.0

setlocal enabledelayedexpansion

echo ========================================
echo 啟動 RAG 自動化系統
echo ========================================
echo.

REM 檢查 Python 環境
echo [INFO] 檢查 Python 環境...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python 未安裝
    echo 請安裝 Python: https://www.python.org/downloads/
    pause
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo [SUCCESS] Python 版本: %PYTHON_VERSION%

REM 檢查依賴
echo [INFO] 檢查依賴...
if exist "requirements.txt" (
    echo [INFO] 安裝 Python 依賴...
    pip install -r requirements.txt -q
    if errorlevel 1 (
        echo [WARNING] 依賴安裝可能失敗，繼續執行...
    ) else (
        echo [SUCCESS] 依賴安裝完成
    )
) else (
    echo [WARNING] 未找到 requirements.txt
)

REM 檢查虛擬環境
if exist "venv\Scripts\activate.bat" (
    echo [INFO] 激活虛擬環境...
    call venv\Scripts\activate.bat
)

REM 選擇啟動模式
echo.
echo 請選擇啟動模式:
echo 1. 基礎分析 (main.py)
echo 2. 增強分析 (main_enhanced.py)
echo 3. RAG 應用 (rag_app.py)
echo 4. 自動化簡單版 (rag_automation_simple.py)
echo 5. 監控系統 (run_monitoring_system.py)
echo.

set /p choice="請輸入選擇 (1-5, 默認 1): "

if "%choice%"=="" set choice=1

if "%choice%"=="1" (
    set "ENTRY_FILE=main.py"
    echo [INFO] 啟動基礎分析模式...
) else if "%choice%"=="2" (
    set "ENTRY_FILE=main_enhanced.py"
    echo [INFO] 啟動增強分析模式...
) else if "%choice%"=="3" (
    set "ENTRY_FILE=rag_app.py"
    echo [INFO] 啟動 RAG 應用模式...
) else if "%choice%"=="4" (
    set "ENTRY_FILE=rag_automation_simple.py"
    echo [INFO] 啟動自動化簡單版...
) else if "%choice%"=="5" (
    set "ENTRY_FILE=run_monitoring_system.py"
    echo [INFO] 啟動監控系統...
) else (
    set "ENTRY_FILE=main.py"
    echo [INFO] 使用默認模式: 基礎分析
)

REM 檢查入口文件
if not exist "%ENTRY_FILE%" (
    echo [ERROR] 未找到入口文件: %ENTRY_FILE%
    echo 可用文件:
    dir /b *.py 2>nul | findstr /i "main rag run"
    if errorlevel 1 echo 無可用文件
    pause
    exit /b 1
)

echo [SUCCESS] 使用入口文件: %ENTRY_FILE%

REM 運行參數
echo.
echo [INFO] 輸入項目路徑進行分析 (按 Enter 使用測試項目):
set /p project_path="項目路徑: "

if "%project_path%"=="" (
    set "project_path=test-project"
    echo [INFO] 使用測試項目: %project_path%
)

REM 啟動應用
echo.
echo ========================================
echo [INFO] 開始運行 RAG 自動化系統
echo ========================================
echo.

if "%ENTRY_FILE%"=="rag_app.py" (
    python "%ENTRY_FILE%"
) else (
    python "%ENTRY_FILE%" "%project_path%"
)

set EXIT_CODE=%errorlevel%

echo.
echo ========================================
if %EXIT_CODE% equ 0 (
    echo [SUCCESS] RAG 系統運行完成
) else (
    echo [ERROR] RAG 系統運行失敗 (退出碼: %EXIT_CODE%)
)
echo ========================================

REM 顯示結果目錄
if exist "output" (
    for /f "delims=" %%i in ('dir /b /ad /o-d output 2^>nul ^| findstr /n "." ^| findstr "^1:"') do (
        set "LATEST_OUTPUT=%%i"
        set "LATEST_OUTPUT=!LATEST_OUTPUT:~2!"
    )
    if defined LATEST_OUTPUT (
        echo.
        echo [INFO] 最新分析結果:
        echo   output\%LATEST_OUTPUT%\
        echo.
        echo 生成的文件:
        dir /b "output\%LATEST_OUTPUT%\*.json" "output\%LATEST_OUTPUT%\*.txt" "output\%LATEST_OUTPUT%\*.md" 2>nul
    )
)

echo.
echo 提示:
echo   - 查看詳細文檔: type README.md
echo   - 使用增強功能: python main_enhanced.py ^<項目路徑^>
echo   - 監控系統: python run_monitoring_system.py
echo.

pause