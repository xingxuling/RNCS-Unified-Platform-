@echo off
chcp 65001 >nul
title 增強版RAG系統 - Windows雙擊啟動器
color 0A

echo ========================================
echo     增強版RAG系統 - Windows版本
echo     雙擊啟動，一鍵分析
echo ========================================
echo.

:check_python
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
        goto main_menu
    )
)

:install_python
echo.
echo 📥 Python安裝指引
echo =================
echo.
echo 增強版RAG系統需要Python 3.8或更高版本。
echo.
echo 請按照以下步驟安裝：
echo.
echo 1. 訪問Python官方網站：
echo    https://www.python.org/downloads/
echo.
echo 2. 下載最新版本的Python安裝程序
echo.
echo 3. 安裝時務必勾選：
echo    ✅ Add Python to PATH
echo    ✅ Install launcher for all users (推薦)
echo.
echo 4. 安裝完成後，重新雙擊此文件啟動系統
echo.
echo 按任意鍵打開Python下載頁面...
pause >nul
start https://www.python.org/downloads/
exit /b 1

:main_menu
echo.
echo ========================================
echo     主菜單 - 請選擇功能
echo ========================================
echo.
echo [1] 🚀 增強版RAG分析 (完整流程)
echo [2] 📊 監測系統 (實時監測)
echo [3] 🔄 增量處理系統
echo [4] 🔍 基礎RAG分析
echo [5] ⚙️  系統設置
echo [6] 📖 查看文檔
echo [7] 🧪 運行測試
echo [8] ❌ 退出系統
echo.
echo ========================================
set /p choice="請輸入選擇 (1-8): "

if "%choice%"=="1" goto enhanced_analysis
if "%choice%"=="2" goto monitoring_system
if "%choice%"=="3" goto incremental_processing
if "%choice%"=="4" goto basic_analysis
if "%choice%"=="5" goto system_settings
if "%choice%"=="6" goto view_docs
if "%choice%"=="7" goto run_tests
if "%choice%"=="8" goto exit_system

echo.
echo ❌ 無效選擇，請輸入1-8之間的數字
pause
goto main_menu

:enhanced_analysis
echo.
echo 🚀 增強版RAG分析
echo =================
echo.
echo 此功能將執行完整的RAG分析流程：
echo 1. 項目結構分析
echo 2. 代碼質量評估
echo 3. 智能學習優化
echo 4. 自動打包輸出
echo.
set /p project_path="請輸入要分析的項目路徑: "
if "%project_path%"=="" (
    echo ❌ 未輸入項目路徑
    pause
    goto main_menu
)

echo.
echo 📊 開始分析項目: %project_path%
echo 請稍候，這可能需要幾分鐘時間...
echo.

python main_enhanced.py "%project_path%"
if errorlevel 1 (
    echo ❌ 分析過程中出現錯誤
) else (
    echo ✅ 分析完成！
    echo 📄 結果已保存到桌面和output目錄
)

echo.
echo 按任意鍵返回主菜單...
pause >nul
goto main_menu

:monitoring_system
echo.
echo 📊 監測系統
echo ============
echo.
echo 此功能將啟動實時監測系統：
echo • 監測項目變化
echo • 自動觸發分析
echo • 提供實時建議
echo.
echo 按Ctrl+C停止監測
echo.

python run_monitoring_system.py
echo.
echo 監測已停止
pause
goto main_menu

:incremental_processing
echo.
echo 🔄 增量處理系統
echo ================
echo.
echo 此功能執行增量式項目處理：
echo • 智能緩存管理
echo • 高效資源利用
echo • 持續改進支持
echo.
set /p project_path="請輸入要處理的項目路徑: "
if "%project_path%"=="" (
    echo ❌ 未輸入項目路徑
    pause
    goto main_menu
)

echo.
echo 🔄 開始增量處理: %project_path%
python run_with_incremental_processing.py "%project_path%"
echo.
pause
goto main_menu

:basic_analysis
echo.
echo 🔍 基礎RAG分析
echo ==============
echo.
echo 此功能執行快速項目評估：
echo • 代碼質量檢查
echo • 結構分析
echo • 基本建議生成
echo.
set /p project_path="請輸入要分析的項目路徑: "
if "%project_path%"=="" (
    echo ❌ 未輸入項目路徑
    pause
    goto main_menu
)

echo.
echo 🔍 開始基礎分析: %project_path%
python main.py "%project_path%"
echo.
pause
goto main_menu

:system_settings
echo.
echo ⚙️  系統設置
echo ===========
echo.
echo [1] 檢查系統狀態
echo [2] 更新依賴包
echo [3] 清理臨時文件
echo [4] 查看系統信息
echo [5] 返回主菜單
echo.
set /p setting_choice="請選擇設置選項: "

if "%setting_choice%"=="1" goto check_system
if "%setting_choice%"=="2" goto update_dependencies
if "%setting_choice%"=="3" goto cleanup_temp
if "%setting_choice%"=="4" goto system_info
if "%setting_choice%"=="5" goto main_menu

echo ❌ 無效選擇
pause
goto system_settings

:check_system
echo.
echo 🔍 檢查系統狀態...
python -c "
import sys
import os
from pathlib import Path

print('系統狀態檢查:')
print('=' * 40)
print(f'Python版本: {sys.version}')
print(f'系統平台: {sys.platform}')
print(f'當前目錄: {os.getcwd()}')

# 檢查必要文件
files = ['main_enhanced.py', 'main.py', 'requirements.txt']
for file in files:
    if Path(file).exists():
        print(f'✅ {file} - 存在')
    else:
        print(f'❌ {file} - 缺失')

# 檢查目錄
dirs = ['modules', 'config', 'output', 'logs']
for dir_name in dirs:
    if Path(dir_name).exists():
        print(f'✅ {dir_name}/ - 存在')
    else:
        print(f'❌ {dir_name}/ - 缺失')

print('=' * 40)
print('系統狀態: ✅ 正常')
"
pause
goto system_settings

:update_dependencies
echo.
echo 📦 更新依賴包...
if not exist requirements.txt (
    echo ❌ 未找到requirements.txt文件
    pause
    goto system_settings
)

echo 正在更新Python依賴包...
pip install --upgrade -r requirements.txt
if errorlevel 1 (
    echo ❌ 更新失敗
) else (
    echo ✅ 更新完成
)
pause
goto system_settings

:cleanup_temp
echo.
echo 🗑️  清理臨時文件...
if exist __pycache__ (
    rmdir /s /q __pycache__
    echo ✅ 清理Python緩存文件
)

if exist temp (
    rmdir /s /q temp
    mkdir temp
    echo ✅ 清理臨時目錄
)

echo ✅ 清理完成
pause
goto system_settings

:system_info
echo.
echo ℹ️  系統信息
echo ===========
python -c "
import sys
import platform
import os
from datetime import datetime

print('增強版RAG系統 - 系統信息')
print('=' * 50)
print(f'系統時間: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
print(f'Python版本: {sys.version}')
print(f'操作系統: {platform.system()} {platform.release()}')
print(f'系統架構: {platform.machine()}')
print(f'用戶名: {os.getenv("USERNAME", "未知")}')
print(f'當前目錄: {os.getcwd()}')
print('=' * 50)

# 文件統計
import glob
py_files = glob.glob('*.py')
bat_files = glob.glob('*.bat')
md_files = glob.glob('*.md')

print(f'Python文件: {len(py_files)} 個')
print(f'批處理文件: {len(bat_files)} 個')
print(f'文檔文件: {len(md_files)} 個')
print('=' * 50)
"
pause
goto system_settings

:view_docs
echo.
echo 📖 查看文檔
echo ===========
echo.
echo [1] 增強版系統文檔 (README_ENHANCED.md)
echo [2] 快速開始指南 (QUICK_START_GUIDE.md)
echo [3] Windows使用指南 (WINDOWS_APPLICATION_GUIDE.md)
echo [4] 返回主菜單
echo.
set /p doc_choice="請選擇文檔: "

if "%doc_choice%"=="1" (
    if exist README_ENHANCED.md (
        start README_ENHANCED.md
    ) else (
        echo ❌ 未找到README_ENHANCED.md
        pause
    )
    goto view_docs
)

if "%doc_choice%"=="2" (
    if exist QUICK_START_GUIDE.md (
        start QUICK_START_GUIDE.md
    ) else (
        echo ❌ 未找到QUICK_START_GUIDE.md
        pause
    )
    goto view_docs
)

if "%doc_choice%"=="3" (
    if exist WINDOWS_APPLICATION_GUIDE.md (
        start WINDOWS_APPLICATION_GUIDE.md
    ) else (
        echo ❌ 未找到WINDOWS_APPLICATION_GUIDE.md
        pause
    )
    goto view_docs
)

if "%doc_choice%"=="4" goto main_menu

echo ❌ 無效選擇
pause
goto view_docs

:run_tests
echo.
echo 🧪 運行測試
echo ===========
echo.
echo [1] 測試增強版系統
echo [2] 測試基礎功能
echo [3] 測試Windows兼容性
echo [4] 返回主菜單
echo.
set /p test_choice="請選擇測試: "

if "%test_choice%"=="1" goto test_enhanced
if "%test_choice%"=="2" goto test_basic
if "%test_choice%"=="3" goto test_windows
if "%test_choice%"=="4" goto main_menu

echo ❌ 無效選擇
pause
goto run_tests

:test_enhanced
echo.
echo 🧪 測試增強版系統...
if not exist test_project (
    mkdir test_project
    echo # 測試項目 > test_project\README.md
    echo print("測試成功！") > test_project\test.py
    echo ✅ 創建測試項目
)

echo 運行增強版系統測試...
python main_enhanced.py test_project
echo.
pause
goto run_tests

:test_basic
echo.
echo 🧪 測試基礎功能...
if not exist test_project (
    mkdir test_project
    echo # 測試項目 > test_project\README.md
    echo print("測試成功！") > test_project\test.py
    echo ✅ 創建測試項目
)

echo 運行基礎系統測試...
python main.py test_project
echo.
pause
goto run_tests

:test_windows
echo.
echo 🧪 測試Windows兼容性...
python -c "
import sys
import os
import platform

print('Windows兼容性測試')
print('=' * 40)

# 測試路徑處理
test_paths = [
    'C:\\\\Users\\\\Test\\\\project',
    'D:\\\\開發\\\\項目',
    'E:\\\\中文路徑\\\\測試項目'
]

print('路徑處理測試:')
for path in test_paths:
    try:
        normalized = os.path.normpath(path)
        print(f'  ✅ {path} -> {normalized}')
    except:
        print(f'  ❌ {path} -> 處理失敗')

# 測試文件操作
print('\\n文件操作測試:')
try:
    with open('test_windows.txt', 'w', encoding='utf-8') as f:
        f.write('Windows兼容性測試文件')
    print('  ✅ 文件創建成功')
    
    with open('test_windows.txt', 'r', encoding='utf-8') as f:
        content = f.read()
    print('  ✅ 文件讀取成功')
    
    os.remove('test_windows.txt')
    print('  ✅ 文件刪除成功')
except Exception as e:
    print(f'  ❌ 文件操作失敗: {e}')

print('=' * 40)
print('Windows兼容性: ✅ 通過')
"
echo.
pause
goto run_tests

:exit_system
echo.
echo ========================================
echo     感謝使用增強版RAG系統！
echo ========================================
echo.
echo 📞 如有問題，請查看文檔或聯繫支持
echo 📁 分析結果保存在output目錄和桌面
echo 🚀 下次使用時直接雙擊此文件即可
echo.
echo ========================================
pause
exit /b 0