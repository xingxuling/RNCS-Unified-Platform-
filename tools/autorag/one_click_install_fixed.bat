@echo off
chcp 65001 >nul
title AutoRAG 一鍵安裝器 (修復版)

echo ========================================
echo     AutoRAG 一鍵安裝器 (修復版)
echo ========================================
echo.

:check_admin
echo 🔍 檢查管理員權限...
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ 管理員權限已確認
    goto check_python
) else (
    echo ❌ 需要管理員權限
    echo.
    echo 請右鍵點擊此文件，選擇「以管理員身份運行」
    echo.
    pause
    exit /b 1
)

:check_python
echo.
echo 🔍 檢查 Python 環境...
where python >nul 2>&1
if errorlevel 1 (
    echo ❌ 未檢測到 Python
    echo.
    echo 請先安裝 Python 3.8+ 並添加到 PATH
    echo 下載地址: https://www.python.org/downloads/
    echo.
    echo 安裝時請務必勾選「Add Python to PATH」
    echo.
    pause
    exit /b 1
)

python --version
python -c "import sys; exit(0) if sys.version_info >= (3, 8) else exit(1)" >nul 2>&1
if errorlevel 1 (
    echo ❌ Python 版本過低 (需要 >= 3.8)
    pause
    exit /b 1
)
echo ✅ Python 版本符合要求

:check_files
echo.
echo 🔍 檢查必要文件...
if not exist "build_exe.py" (
    echo ❌ 找不到 build_exe.py
    pause
    exit /b 1
)

if not exist "post_install.py" (
    echo ❌ 找不到 post_install.py
    pause
    exit /b 1
)

if not exist "main_enhanced.py" (
    echo ❌ 找不到 main_enhanced.py
    pause
    exit /b 1
)
echo ✅ 所有必要文件都存在

:step1
echo.
echo ========================================
echo     [1/3] 生成 EXE 文件
echo ========================================
echo.
echo 正在安裝 PyInstaller 並生成 EXE...
echo 這可能需要幾分鐘時間...
echo.

python build_exe.py
if errorlevel 1 (
    echo ❌ EXE 生成失敗
    echo.
    echo 請檢查:
    echo 1. Python 是否正確安裝
    echo 2. 網絡連接是否正常
    echo 3. 磁盤空間是否充足
    echo.
    pause
    exit /b 1
)
echo ✅ EXE 生成成功

:step2
echo.
echo ========================================
echo     [2/3] 安裝系統集成
echo ========================================
echo.
echo 正在安裝 pywin32...
python -m pip install pywin32
if errorlevel 1 (
    echo ⚠️  pywin32 安裝失敗，嘗試替代方法...
    python -m pip install --upgrade pip
    python -m pip install pywin32 --user
)

echo.
echo 正在創建快捷方式和設置開機自啟動...
python post_install.py
if errorlevel 1 (
    echo ⚠️  系統集成部分失敗，但 EXE 已生成
    echo 您可以手動運行 dist\AutoRAG.exe
)

:step3
echo.
echo ========================================
echo     [3/3] 安裝完成
echo ========================================
echo.
echo 🎉 安裝完成！
echo.
echo 📋 安裝結果:
echo.
if exist "dist\AutoRAG.exe" (
    echo ✅ EXE 文件: dist\AutoRAG.exe
) else (
    echo ❌ EXE 文件生成失敗
)

if exist "%USERPROFILE%\Desktop\AutoRAG.lnk" (
    echo ✅ 桌面快捷方式: 已創建
) else (
    echo ⚠️  桌面快捷方式: 未創建
)

echo.
echo 🚀 使用方法:
echo 1. 雙擊桌面上的 AutoRAG 快捷方式
echo 2. 或直接運行 dist\AutoRAG.exe
echo.
echo 📖 文檔:
echo   查看 README_ENHANCED.md 獲取詳細信息
echo.
echo ========================================
echo.
pause