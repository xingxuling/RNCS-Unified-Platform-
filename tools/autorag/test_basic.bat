@echo off
chcp 65001 >nul
title 基本功能測試

echo ========================================
echo     基本功能測試
echo ========================================
echo.

echo 1. 測試命令提示字元基本功能...
echo Hello World!
echo.

echo 2. 測試當前目錄...
echo 當前目錄: %cd%
echo.

echo 3. 測試 Python...
python --version
if errorlevel 1 (
    echo ❌ Python 未安裝或未添加到 PATH
) else (
    echo ✅ Python 已安裝
)

echo.
echo 4. 測試 pip...
pip --version
if errorlevel 1 (
    echo ⚠️  pip 未找到，嘗試 python -m pip...
    python -m pip --version
)

echo.
echo 5. 測試文件訪問...
if exist "main_enhanced.py" (
    echo ✅ main_enhanced.py 存在
) else (
    echo ❌ main_enhanced.py 不存在
)

if exist "build_exe.py" (
    echo ✅ build_exe.py 存在
) else (
    echo ❌ build_exe.py 不存在
)

if exist "post_install.py" (
    echo ✅ post_install.py 存在
) else (
    echo ❌ post_install.py 不存在
)

echo.
echo ========================================
echo     測試完成
echo ========================================
echo.
echo 如果以上測試都通過，但安裝腳本仍然閃退：
echo 1. 可能是防毒軟體攔截
echo 2. 可能是權限問題
echo 3. 可能是路徑包含特殊字符
echo.
echo 建議：
echo 1. 暫時關閉防毒軟體
echo 2. 確保以管理員身份運行
echo 3. 將文件移動到簡單路徑，如 C:\AutoRAG
echo.
pause