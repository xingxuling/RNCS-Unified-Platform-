@echo off
chcp 65001 >nul
title AutoRAG 安裝診斷工具

echo ========================================
echo     AutoRAG 安裝問題診斷工具
echo ========================================
echo.

:log_header
echo 診斷開始時間: %date% %time% > diagnose.log
echo ======================================== >> diagnose.log
echo AutoRAG 安裝問題診斷報告 >> diagnose.log
echo ======================================== >> diagnose.log
echo. >> diagnose.log

:check_admin
echo [1] 檢查管理員權限... >> diagnose.log
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ 管理員權限: 已確認 >> diagnose.log
    echo ✅ 管理員權限: 已確認
) else (
    echo ❌ 管理員權限: 未確認 (錯誤代碼: %errorLevel%) >> diagnose.log
    echo ❌ 管理員權限: 未確認
)
echo. >> diagnose.log

:check_python
echo [2] 檢查 Python 環境... >> diagnose.log
where python 2>&1 >> diagnose.log
where python >nul 2>&1
if errorlevel 1 (
    echo ❌ Python: 未找到 >> diagnose.log
    echo ❌ Python: 未找到
) else (
    python --version 2>&1 >> diagnose.log
    python --version 2>&1
    echo ✅ Python: 已安裝 >> diagnose.log
    echo ✅ Python: 已安裝
    
    python -c "import sys; print('Python 版本:', sys.version)" 2>&1 >> diagnose.log
    python -c "import sys; exit(0) if sys.version_info >= (3, 8) else exit(1)" >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  Python 版本: 低於 3.8 >> diagnose.log
        echo ⚠️  Python 版本: 低於 3.8
    ) else (
        echo ✅ Python 版本: >= 3.8 >> diagnose.log
        echo ✅ Python 版本: >= 3.8
    )
)
echo. >> diagnose.log

:check_pip
echo [3] 檢查 pip... >> diagnose.log
where pip 2>&1 >> diagnose.log
where pip >nul 2>&1
if errorlevel 1 (
    echo ❌ pip: 未找到 >> diagnose.log
    echo ❌ pip: 未找到
) else (
    pip --version 2>&1 >> diagnose.log
    echo ✅ pip: 已安裝 >> diagnose.log
    echo ✅ pip: 已安裝
)
echo. >> diagnose.log

:check_files
echo [4] 檢查必要文件... >> diagnose.log
echo 當前目錄: %cd% >> diagnose.log
echo. >> diagnose.log

set file_count=0
for %%f in (build_exe.py post_install.py main_enhanced.py one_click_install.bat) do (
    if exist "%%f" (
        echo ✅ %%f: 存在 >> diagnose.log
        set /a file_count+=1
    ) else (
        echo ❌ %%f: 不存在 >> diagnose.log
    )
)

echo. >> diagnose.log
echo 文件檢查結果: %file_count%/4 個文件存在 >> diagnose.log
echo 文件檢查結果: %file_count%/4 個文件存在
echo. >> diagnose.log

:check_pyinstaller
echo [5] 檢查 PyInstaller... >> diagnose.log
python -c "import pyinstaller; print('PyInstaller 版本:', pyinstaller.__version__)" 2>&1 >> diagnose.log
python -c "import pyinstaller" 2>&1 >nul
if errorlevel 1 (
    echo ❌ PyInstaller: 未安裝 >> diagnose.log
    echo ❌ PyInstaller: 未安裝
) else (
    echo ✅ PyInstaller: 已安裝 >> diagnose.log
    echo ✅ PyInstaller: 已安裝
)
echo. >> diagnose.log

:check_pywin32
echo [6] 檢查 pywin32... >> diagnose.log
python -c "import win32com; print('pywin32: 已安裝')" 2>&1 >> diagnose.log
python -c "import win32com" 2>&1 >nul
if errorlevel 1 (
    echo ❌ pywin32: 未安裝 >> diagnose.log
    echo ❌ pywin32: 未安裝
) else (
    echo ✅ pywin32: 已安裝 >> diagnose.log
    echo ✅ pywin32: 已安裝
)
echo. >> diagnose.log

:check_system
echo [7] 檢查系統信息... >> diagnose.log
echo 操作系統: >> diagnose.log
ver 2>&1 >> diagnose.log
echo. >> diagnose.log

echo 用戶名: %USERNAME% >> diagnose.log
echo 用戶目錄: %USERPROFILE% >> diagnose.log
echo. >> diagnose.log

echo 桌面路徑: %USERPROFILE%\Desktop >> diagnose.log
if exist "%USERPROFILE%\Desktop" (
    echo ✅ 桌面目錄: 存在 >> diagnose.log
) else (
    echo ❌ 桌面目錄: 不存在 >> diagnose.log
)
echo. >> diagnose.log

:log_footer
echo ======================================== >> diagnose.log
echo 診斷結束時間: %date% %time% >> diagnose.log
echo ======================================== >> diagnose.log

:summary
echo.
echo ========================================
echo     診斷完成
echo ========================================
echo.
echo 📋 診斷報告已保存到: diagnose.log
echo.
echo 🔍 常見問題解決方案:
echo.
echo 1. 如果沒有管理員權限:
echo    右鍵點擊腳本 → 以管理員身份運行
echo.
echo 2. 如果 Python 未安裝:
echo    下載 Python 3.8+: https://www.python.org/downloads/
echo    安裝時勾選「Add Python to PATH」
echo.
echo 3. 如果文件缺失:
echo    確保所有文件都在同一目錄下
echo.
echo 4. 如果依賴未安裝:
echo    手動運行: pip install pyinstaller pywin32
echo.
echo ========================================
echo.
echo 按任意鍵查看診斷報告...
pause >nul

type diagnose.log
echo.
echo ========================================
echo     下一步建議
echo ========================================
echo.
echo 根據診斷結果，建議:
echo.
if not exist "one_click_install_fixed.bat" (
    echo 1. 使用修復版安裝腳本: one_click_install_fixed.bat
) else (
    echo 1. 已找到修復版安裝腳本
)

echo 2. 確保以管理員身份運行
echo 3. 按照診斷報告修復問題
echo.
pause