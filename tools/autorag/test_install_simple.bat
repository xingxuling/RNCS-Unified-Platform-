@echo off
chcp 65001 >nul
title 簡單安裝測試

echo ========================================
echo     簡單安裝測試
echo ========================================
echo.

echo 測試 1: 檢查 Python
python --version
if errorlevel 1 (
    echo ❌ Python 檢查失敗
    pause
    exit /b 1
)

echo.
echo 測試 2: 運行 Python 簡單腳本
python -c "print('Python 運行正常')"
if errorlevel 1 (
    echo ❌ Python 腳本運行失敗
    pause
    exit /b 1
)

echo.
echo 測試 3: 檢查當前目錄
echo 當前目錄: %cd%
dir /b *.py *.bat

echo.
echo 測試 4: 嘗試運行 build_exe.py 的第一部分
echo 正在測試 PyInstaller 安裝...
python -c "import subprocess; subprocess.call(['python', '-m', 'pip', 'install', '--upgrade', 'pip'])"

echo.
echo ========================================
echo     測試完成
echo ========================================
echo.
echo 如果以上測試都通過，但原始腳本仍然閃退：
echo 1. 可能是權限問題
echo 2. 可能是防毒軟體攔截
echo 3. 可能是路徑問題
echo.
echo 建議：
echo 1. 暫時關閉防毒軟體
echo 2. 在命令提示字元中手動運行命令
echo 3. 使用修復版安裝腳本
echo.
pause