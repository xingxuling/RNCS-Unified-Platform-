#!/usr/bin/env python3
"""
簡化版EXE部署腳本
使用現有環境或創建最小化部署方案
"""

import os
import sys
import subprocess
import shutil
import zipfile
from pathlib import Path

def check_pyinstaller():
    """檢查PyInstaller是否可用"""
    try:
        import PyInstaller
        print(f"✅ PyInstaller已安裝: {PyInstaller.__version__}")
        return True
    except ImportError:
        print("❌ PyInstaller未安裝")
        return False

def create_portable_package():
    """創建便攜式包（無需PyInstaller）"""
    print("📦 創建便攜式包...")
    
    project_dir = Path(__file__).parent
    portable_dir = project_dir / "portable_rag_system"
    
    # 創建目錄結構
    dirs = ["modules", "config", "logs", "output", "bin"]
    for dir_name in dirs:
        (portable_dir / dir_name).mkdir(parents=True, exist_ok=True)
    
    # 複製必要文件
    files_to_copy = [
        "main_enhanced.py",
        "main.py", 
        "run_enhanced_with_modules.py",
        "run_monitoring_system.py",
        "run_with_incremental_processing.py",
        "requirements.txt"
    ]
    
    for file in files_to_copy:
        src = project_dir / file
        if src.exists():
            shutil.copy2(src, portable_dir / file)
            print(f"  複製: {file}")
    
    # 複製目錄
    dirs_to_copy = ["modules", "config"]
    for dir_name in dirs_to_copy:
        src_dir = project_dir / dir_name
        if src_dir.exists():
            dst_dir = portable_dir / dir_name
            if dst_dir.exists():
                shutil.rmtree(dst_dir)
            shutil.copytree(src_dir, dst_dir)
            print(f"  複製: {dir_name}/")
    
    # 創建啟動腳本
    create_windows_launcher(portable_dir)
    create_linux_launcher(portable_dir)
    
    # 創建ZIP包
    create_zip_package(portable_dir)
    
    print(f"✅ 便攜式包創建完成: {portable_dir}")
    return portable_dir

def create_windows_launcher(portable_dir):
    """創建Windows啟動腳本"""
    bat_content = """@echo off
echo ========================================
echo AutoRAG 便攜式系統 - Windows版本
echo ========================================
echo.

REM 檢查Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未找到Python
    echo 請安裝Python 3.8+ 或使用內置Python
    goto check_embedded
)

echo ✅ 系統Python可用
goto start_system

:check_embedded
REM 檢查內置Python（如果有的話）
if exist "bin\\python\\python.exe" (
    echo 🔧 使用內置Python
    set PYTHONPATH=bin\\python\\python.exe
) else (
    echo ❌ 未找到Python，無法運行
    echo 請下載並安裝Python 3.8+
    echo 下載地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

:start_system
echo.
echo 🚀 啟動AutoRAG系統...
echo.

REM 安裝依賴（如果需要的話）
if not exist "requirements_installed.flag" (
    echo 📦 安裝Python依賴...
    %PYTHONPATH% -m pip install -r requirements.txt --user
    echo. > requirements_installed.flag
)

REM 啟動系統
echo ========================================
echo AutoRAG 系統菜單
echo ========================================
echo.
echo 1. 🚀 增強版RAG分析
echo 2. 📊 監測系統
echo 3. 🔄 增量處理系統
echo 4. 🔍 基礎RAG分析
echo 5. ❌ 退出
echo.
set /p choice="請選擇功能 (1-5): "

if "%choice%"=="1" goto enhanced
if "%choice%"=="2" goto monitor
if "%choice%"=="3" goto incremental
if "%choice%"=="4" goto basic
if "%choice%"=="5" goto exit

echo ❌ 無效選擇
pause
goto start_system

:enhanced
echo.
set /p project_path="請輸入項目路徑: "
if "%project_path%"=="" (
    echo ❌ 未輸入項目路徑
    pause
    goto start_system
)
%PYTHONPATH% main_enhanced.py "%project_path%"
pause
goto start_system

:monitor
echo.
%PYTHONPATH% run_monitoring_system.py
pause
goto start_system

:incremental
echo.
set /p project_path="請輸入項目路徑: "
if "%project_path%"=="" (
    echo ❌ 未輸入項目路徑
    pause
    goto start_system
)
%PYTHONPATH% run_with_incremental_processing.py "%project_path%"
pause
goto start_system

:basic
echo.
set /p project_path="請輸入項目路徑: "
if "%project_path%"=="" (
    echo ❌ 未輸入項目路徑
    pause
    goto start_system
)
%PYTHONPATH% main.py "%project_path%"
pause
goto start_system

:exit
echo.
echo 👋 感謝使用AutoRAG系統！
echo.
pause
"""
    
    bat_path = portable_dir / "start_rag.bat"
    with open(bat_path, 'w', encoding='utf-8') as f:
        f.write(bat_content)
    
    print(f"  創建: start_rag.bat")

def create_linux_launcher(portable_dir):
    """創建Linux啟動腳本"""
    sh_content = """#!/bin/bash
echo "========================================"
echo "AutoRAG 便攜式系統 - Linux版本"
echo "========================================"
echo ""

# 檢查Python
if command -v python3 &> /dev/null; then
    echo "✅ Python3可用"
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    echo "✅ Python可用"
    PYTHON_CMD="python"
else
    echo "❌ 未找到Python"
    echo "請安裝Python 3.8+"
    exit 1
fi

echo ""
echo "🚀 啟動AutoRAG系統..."
echo ""

# 安裝依賴（如果需要的話）
if [ ! -f "requirements_installed.flag" ]; then
    echo "📦 安裝Python依賴..."
    $PYTHON_CMD -m pip install -r requirements.txt --user
    touch requirements_installed.flag
fi

# 顯示菜單
show_menu() {
    echo "========================================"
    echo "AutoRAG 系統菜單"
    echo "========================================"
    echo ""
    echo "1. 🚀 增強版RAG分析"
    echo "2. 📊 監測系統"
    echo "3. 🔄 增量處理系統"
    echo "4. 🔍 基礎RAG分析"
    echo "5. ❌ 退出"
    echo ""
    read -p "請選擇功能 (1-5): " choice
    
    case $choice in
        1)
            read -p "請輸入項目路徑: " project_path
            if [ -z "$project_path" ]; then
                echo "❌ 未輸入項目路徑"
                read -p "按Enter繼續..."
                show_menu
            else
                $PYTHON_CMD main_enhanced.py "$project_path"
                read -p "按Enter繼續..."
                show_menu
            fi
            ;;
        2)
            $PYTHON_CMD run_monitoring_system.py
            read -p "按Enter繼續..."
            show_menu
            ;;
        3)
            read -p "請輸入項目路徑: " project_path
            if [ -z "$project_path" ]; then
                echo "❌ 未輸入項目路徑"
                read -p "按Enter繼續..."
                show_menu
            else
                $PYTHON_CMD run_with_incremental_processing.py "$project_path"
                read -p "按Enter繼續..."
                show_menu
            fi
            ;;
        4)
            read -p "請輸入項目路徑: " project_path
            if [ -z "$project_path" ]; then
                echo "❌ 未輸入項目路徑"
                read -p "按Enter繼續..."
                show_menu
            else
                $PYTHON_CMD main.py "$project_path"
                read -p "按Enter繼續..."
                show_menu
            fi
            ;;
        5)
            echo ""
            echo "👋 感謝使用AutoRAG系統！"
            echo ""
            exit 0
            ;;
        *)
            echo "❌ 無效選擇"
            read -p "按Enter繼續..."
            show_menu
            ;;
    esac
}

show_menu
"""
    
    sh_path = portable_dir / "start_rag.sh"
    with open(sh_path, 'w', encoding='utf-8') as f:
        f.write(sh_content)
    
    # 設置執行權限 (Windows跳過)
    if os.name != 'nt':
        os.chmod(sh_path, 0o755)
    
    print(f"  創建: start_rag.sh")

def create_zip_package(portable_dir):
    """創建ZIP包"""
    import datetime
    
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    zip_filename = f"AutoRAG_Portable_{timestamp}.zip"
    zip_path = portable_dir.parent / zip_filename
    
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(portable_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, portable_dir.parent)
                zipf.write(file_path, arcname)
    
    print(f"✅ 創建ZIP包: {zip_path}")
    return zip_path

def create_self_extracting_exe():
    """創建自解壓EXE（使用現有工具）"""
    print("🔧 創建自解壓EXE...")
    
    # 檢查是否有makeself或類似工具
    if shutil.which("makeself"):
        print("✅ 找到makeself工具")
        
        portable_dir = create_portable_package()
        exe_name = "AutoRAG_Installer.sh"
        
        # 使用makeself創建自解壓腳本
        cmd = [
            "makeself",
            "--gzip",
            "--nox11",
            "--nowait",
            str(portable_dir),
            exe_name,
            "AutoRAG系統安裝程序",
            "./start_rag.sh"
        ]
        
        try:
            subprocess.run(cmd, check=True)
            print(f"✅ 創建自解壓安裝程序: {exe_name}")
            return exe_name
        except Exception as e:
            print(f"❌ 創建失敗: {e}")
    
    print("⚠️ 無法創建自解壓EXE，使用ZIP包替代")
    return None

def main():
    """主函數"""
    print("=" * 60)
    print("🚀 AutoRAG 跨環境部署工具")
    print("=" * 60)
    
    # 檢查PyInstaller
    if check_pyinstaller():
        print("\n✅ 可以直接使用PyInstaller構建EXE")
        print("運行: python cross_env_deployer.py")
    else:
        print("\n⚠️ PyInstaller不可用，創建便攜式解決方案")
        
        # 創建便攜式包
        portable_dir = create_portable_package()
        
        print("\n" + "=" * 60)
        print("🎉 部署完成！")
        print("=" * 60)
        print("\n📦 可用的部署方案：")
        print("1. 便攜式包：", portable_dir)
        print("2. Windows用戶：運行 start_rag.bat")
        print("3. Linux用戶：運行 ./start_rag.sh")
        print("4. 所有用戶：使用ZIP包分發")
        print("\n📋 使用方法：")
        print("1. 將整個文件夾複製到目標電腦")
        print("2. 確保目標電腦安裝了Python 3.8+")
        print("3. 運行對應的啟動腳本")
        print("=" * 60)

if __name__ == "__main__":
    main()