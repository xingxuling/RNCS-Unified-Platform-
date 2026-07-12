@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 RAG 自動化系統啟動
echo ========================================

REM 檢查參數
if "%~1"=="" (
    echo 用法: %0 ^<項目路徑^>
    echo 示例: %0 C:\path\to\your\project
    exit /b 1
)

set "PROJECT_PATH=%~1"
set "SCRIPT_DIR=%~dp0"
set "TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "TIMESTAMP=%TIMESTAMP: =0%"

echo 📁 項目路徑: %PROJECT_PATH%
echo 📊 腳本目錄: %SCRIPT_DIR%
echo ⏰ 開始時間: %date% %time%

REM 檢查項目是否存在
if not exist "%PROJECT_PATH%" (
    echo ❌ 錯誤: 項目路徑不存在: %PROJECT_PATH%
    exit /b 1
)

REM 檢查 Python 環境
echo 🔍 檢查 Python 環境...
python --version >nul 2>&1
if errorlevel 1 (
    python3 --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ 錯誤: Python 未安裝
        echo 請安裝 Python 3.8+ 從 https://python.org
        exit /b 1
    ) else (
        set "PYTHON=python3"
    )
) else (
    set "PYTHON=python"
)

for /f "tokens=*" %%v in ('%PYTHON% --version 2^>^&1') do set "PYTHON_VERSION=%%v"
echo ✅ Python 版本: %PYTHON_VERSION%

REM 創建日誌目錄
set "LOG_DIR=%SCRIPT_DIR%logs"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
set "LOG_FILE=%LOG_DIR%\execution_%TIMESTAMP%.log"

echo 📝 日誌文件: %LOG_FILE%

echo ========================================
echo 🎯 開始執行 RAG 自動化系統
echo ========================================

REM 記錄開始時間
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set "START_TIME=%%I"
set "START_TIME=%START_TIME:~0,14%"

REM 執行主程序
cd /d "%SCRIPT_DIR%"
%PYTHON% main.py "%PROJECT_PATH%" > "%LOG_FILE%" 2>&1

REM 記錄結束時間
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set "END_TIME=%%I"
set "END_TIME=%END_TIME:~0,14%"

echo ========================================
echo 📊 執行統計
echo ========================================
echo 開始時間: %START_TIME:~0,4%-%START_TIME:~4,2%-%START_TIME:~6,2% %START_TIME:~8,2%:%START_TIME:~10,2%:%START_TIME:~12,2%
echo 結束時間: %END_TIME:~0,4%-%END_TIME:~4,2%-%END_TIME:~6,2% %END_TIME:~8,2%:%END_TIME:~10,2%:%END_TIME:~12,2%

REM 檢查執行結果
findstr /C:"RAG 自動化系統執行完成" "%LOG_FILE%" >nul
if not errorlevel 1 (
    echo ✅ 系統執行成功
    
    echo ========================================
    echo 📋 執行摘要
    echo ========================================
    
    REM 提取項目名稱
    for %%F in ("%PROJECT_PATH%") do set "PROJECT_NAME=%%~nxF"
    echo 項目名稱: %PROJECT_NAME%
    
    REM 提取分數
    for /f "tokens=3" %%S in ('findstr /C:"總體分數:" "%LOG_FILE%"') do set "SCORE=%%S"
    if defined SCORE (
        echo 總體分數: %SCORE%/100
    ) else (
        echo 總體分數: N/A
    )
    
    REM 提取打包文件
    for /f "tokens=2*" %%A in ('findstr /C:"打包文件:" "%LOG_FILE%"') do set "PACKAGE_FILE=%%A %%B"
    if defined PACKAGE_FILE (
        echo 打包文件: %PACKAGE_FILE%
    ) else (
        echo 打包文件: 無
    )
    
    echo ========================================
    echo 📁 桌面文件檢查
    echo ========================================
    
    set "DESKTOP_PATH=%USERPROFILE%\Desktop"
    if exist "%DESKTOP_PATH%" (
        echo 桌面目錄: %DESKTOP_PATH%
        echo.
        echo 相關文件:
        dir "%DESKTOP_PATH%\*RAG*" "%DESKTOP_PATH%\*optimized*" "%DESKTOP_PATH%\*packaging_report*" 2>nul | findstr /V "目錄"
    ) else (
        echo 桌面目錄不存在: %DESKTOP_PATH%
    )
    
) else (
    echo ❌ 系統執行可能失敗
    echo 請查看日誌文件: %LOG_FILE%
)

echo ========================================
echo 📄 重要文件
echo ========================================
echo 日誌文件: %LOG_FILE%
echo 輸出目錄: %SCRIPT_DIR%output\%TIMESTAMP%\

REM 創建完成標記
set "COMPLETION_FILE=%SCRIPT_DIR%completion_%TIMESTAMP%.txt"
(
    echo RAG 自動化系統執行完成
    echo =======================
    echo.
    echo 執行時間: %date% %time%
    echo 項目路徑: %PROJECT_PATH%
    echo.
    echo 重要文件:
    echo - 日誌: %LOG_FILE%
    echo - 輸出: %SCRIPT_DIR%output\%TIMESTAMP%\
) > "%COMPLETION_FILE%"

if defined PACKAGE_FILE (
    if not "%PACKAGE_FILE%"=="無" (
        echo - 打包: %PACKAGE_FILE% >> "%COMPLETION_FILE%"
        echo 狀態: 成功 >> "%COMPLETION_FILE%"
    ) else (
        echo 狀態: 部分成功 >> "%COMPLETION_FILE%"
    )
) else (
    echo 狀態: 部分成功 >> "%COMPLETION_FILE%"
)

(
    echo.
    echo 下一步:
    echo 1. 查看桌面上的打包文件和報告
    echo 2. 檢查輸出目錄的分析結果
    echo 3. 根據建議進行項目優化
) >> "%COMPLETION_FILE%"

echo 完成標記: %COMPLETION_FILE%
echo ========================================
echo 🎉 腳本執行完成!
echo ========================================

pause