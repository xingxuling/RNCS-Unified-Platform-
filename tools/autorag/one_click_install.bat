@echo off
chcp 65001 >nul
title AutoRAG 一鍵安裝器
echo ===============================
echo     AutoRAG 一鍵安裝器
echo ===============================
echo.

:check_python
echo [1/6] 檢查 Python 環境...
where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] 未檢測到 Python，請先安裝 Python 3.8+
    echo.
    echo 下載地址: https://www.python.org/downloads/
    echo 安裝時請務必勾選「Add Python to PATH」
    echo.
    pause
    exit /b 1
)

python --version
echo ✅ Python 檢測成功
echo.

:check_python_version
echo [2/6] 檢查 Python 版本...
python -c "import sys; exit(0) if sys.version_info >= (3, 8) else exit(1)" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python 版本過低，需要 Python 3.8+
    echo 當前版本:
    python --version
    echo.
    pause
    exit /b 1
)
echo ✅ Python 版本符合要求 (>= 3.8)
echo.

:check_files
echo [3/6] 檢查必要文件...
if not exist "build_exe.py" (
    echo [ERROR] 找不到 build_exe.py
    pause
    exit /b 1
)
if not exist "post_install.py" (
    echo [ERROR] 找不到 post_install.py
    pause
    exit /b 1
)
if not exist "main_enhanced.py" (
    echo [ERROR] 找不到 main_enhanced.py
    pause
    exit /b 1
)
echo ✅ 所有必要文件都存在
echo.

:install_pyinstaller
echo [4/6] 安裝 PyInstaller...
echo 這可能需要幾分鐘時間，請稍候...
python -m pip install --upgrade pyinstaller
if errorlevel 1 (
    echo [WARNING] PyInstaller 安裝失敗，嘗試繼續...
)
echo.

:build_exe
echo [5/6] 生成 EXE 文件...
python build_exe.py
if errorlevel 1 (
    echo [ERROR] EXE 生成失敗
    echo 請檢查錯誤信息
    echo.
    pause
    exit /b 1
)
echo ✅ EXE 生成成功
echo.

:install_pywin32
echo [6/6] 安裝系統集成...
echo 安裝 pywin32...
python -m pip install pywin32
if errorlevel 1 (
    echo [WARNING] pywin32 安裝失敗，嘗試繼續...
)

echo 創建快捷方式...
python post_install.py
if errorlevel 1 (
    echo [WARNING] 系統集成失敗，但 EXE 已生成
    echo 您可以手動運行 dist\AutoRAG.exe
)

echo.
echo ===============================
echo     🎉 安裝完成！
echo ===============================
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
echo ===============================
echo.
pause