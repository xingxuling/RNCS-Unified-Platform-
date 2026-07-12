#!/usr/bin/env python3
"""
增強版RAG系統 - 設置腳本
在當前環境中設置系統
"""

import os
import sys
import subprocess
import json
from pathlib import Path

def setup_system():
    """設置增強版RAG系統"""
    print("=" * 60)
    print("🚀 增強版RAG系統 - 環境設置")
    print("=" * 60)
    
    current_dir = Path(__file__).parent
    
    # 1. 檢查Python
    print("\n1. 檢查Python環境...")
    python_version = sys.version_info
    print(f"   Python版本: {sys.version.split()[0]}")
    
    if python_version.major == 3 and python_version.minor >= 8:
        print("   ✅ Python版本符合要求 (>=3.8)")
    else:
        print("   ❌ Python版本過低 (需要>=3.8)")
        return False
    
    # 2. 檢查pip
    print("\n2. 檢查pip...")
    try:
        import pip
        pip_version = pip.__version__
        print(f"   pip版本: {pip_version}")
        print("   ✅ pip已安裝")
    except ImportError:
        print("   ❌ pip未安裝")
        print("   請安裝pip: python3 -m ensurepip --upgrade")
        return False
    
    # 3. 安裝依賴
    print("\n3. 安裝Python依賴...")
    
    # 創建requirements.txt
    requirements = """# 增強版RAG系統依賴
# 基礎要求
python>=3.8

# 可選依賴（增強功能）
# colorama>=0.4.6    # 彩色終端輸出
# tqdm>=4.66.0      # 進度條顯示
# psutil>=5.9.0     # 系統監控
"""
    
    req_file = current_dir / "requirements.txt"
    with open(req_file, 'w', encoding='utf-8') as f:
        f.write(requirements)
    print("   📄 創建 requirements.txt")
    
    # 安裝依賴
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "--upgrade", "pip"], 
                      check=True, capture_output=True)
        print("   ✅ pip已更新")
    except:
        print("   ⚠️  pip更新失敗，繼續安裝...")
    
    # 4. 創建目錄
    print("\n4. 創建系統目錄...")
    directories = ["output", "logs", "config", "temp"]
    
    for dir_name in directories:
        dir_path = current_dir / dir_name
        dir_path.mkdir(exist_ok=True)
        print(f"   📁 創建 {dir_name}/")
    
    # 5. 創建配置文件
    print("\n5. 創建配置文件...")
    
    config = {
        "system": {
            "name": "Enhanced RAG System",
            "version": "1.0.0",
            "environment": "linux" if os.name == "posix" else "windows"
        },
        "paths": {
            "default_project_dir": str(Path.home() / "projects"),
            "output_dir": "./output",
            "logs_dir": "./logs",
            "temp_dir": "./temp"
        },
        "monitoring": {
            "enabled": True,
            "interval_seconds": 5,
            "watch_directories": [
                str(Path.home() / "projects"),
                str(Path.home() / "workspace"),
                str(current_dir)
            ],
            "exclude_patterns": [
                "node_modules",
                ".git",
                "__pycache__",
                ".venv",
                "env",
                "venv",
                "*.pyc",
                "*.log"
            ]
        },
        "analysis": {
            "auto_trigger": True,
            "file_change_threshold": 3,
            "max_file_size_mb": 10,
            "timeout_seconds": 300
        }
    }
    
    config_file = current_dir / "config" / "system_config.json"
    with open(config_file, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    print(f"   📄 創建 config/system_config.json")
    
    # 6. 創建啟動腳本
    print("\n6. 創建啟動腳本...")
    
    # Linux啟動腳本
    if os.name == "posix":
        # 主啟動腳本
        launch_script = current_dir / "launch_rag.sh"
        launch_content = """#!/bin/bash
# 增強版RAG系統 - 啟動腳本

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================"
echo "    增強版RAG系統"
echo "========================================"
echo ""

# 檢查Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 錯誤：未找到Python3"
    exit 1
fi

# 顯示菜單
while true; do
    echo "主菜單"
    echo "========================================"
    echo ""
    echo "  1. 🚀 增強版RAG分析"
    echo "  2. 📊 監測系統"
    echo "  3. 🔄 增量處理"
    echo "  4. 🔍 基礎分析"
    echo "  5. 📖 查看文檔"
    echo "  6. ❌ 退出"
    echo ""
    echo "========================================"
    
    read -p "請選擇 (1-6): " choice
    
    case $choice in
        1)
            echo ""
            read -p "請輸入項目路徑: " project_path
            if [ -z "$project_path" ]; then
                echo "❌ 未輸入項目路徑"
                read -p "按Enter繼續..."
                continue
            fi
            python3 main_enhanced.py "$project_path"
            read -p "按Enter繼續..."
            ;;
        2)
            echo ""
            echo "啟動監測系統..."
            echo "按 Ctrl+C 停止"
            python3 run_monitoring_system.py
            read -p "按Enter繼續..."
            ;;
        3)
            echo ""
            read -p "請輸入項目路徑: " project_path
            if [ -z "$project_path" ]; then
                echo "❌ 未輸入項目路徑"
                read -p "按Enter繼續..."
                continue
            fi
            python3 run_with_incremental_processing.py "$project_path"
            read -p "按Enter繼續..."
            ;;
        4)
            echo ""
            read -p "請輸入項目路徑: " project_path
            if [ -z "$project_path" ]; then
                echo "❌ 未輸入項目路徑"
                read -p "按Enter繼續..."
                continue
            fi
            python3 main.py "$project_path"
            read -p "按Enter繼續..."
            ;;
        5)
            if [ -f "README_ENHANCED.md" ]; then
                if command -v less &> /dev/null; then
                    less README_ENHANCED.md
                else
                    cat README_ENHANCED.md | head -30
                    echo "..."
                    read -p "按Enter繼續..."
                fi
            else
                echo "❌ 文檔不存在"
                read -p "按Enter繼續..."
            fi
            ;;
        6)
            echo ""
            echo "👋 感謝使用！"
            echo ""
            exit 0
            ;;
        *)
            echo "❌ 無效選擇"
            sleep 1
            ;;
    esac
done
"""
        
        with open(launch_script, 'w', encoding='utf-8') as f:
            f.write(launch_content)
        
        # Skip chmod on Windows
        if os.name != 'nt':
            os.chmod(launch_script, 0o755)
        print(f"   🚀 創建 launch_rag.sh")
        
        # 快速啟動腳本
        quick_script = current_dir / "rag_quick.sh"
        quick_content = """#!/bin/bash
# 增強版RAG系統 - 快速啟動

if [ $# -eq 0 ]; then
    echo "使用方法: $0 <項目路徑>"
    echo "示例: $0 ~/projects/my-app"
    exit 1
fi

python3 main_enhanced.py "$1"
"""
        
        with open(quick_script, 'w', encoding='utf-8') as f:
            f.write(quick_content)
        
        # Skip chmod on Windows
        if os.name != 'nt':
            os.chmod(quick_script, 0o755)
        print(f"   ⚡ 創建 rag_quick.sh")
    
    # 7. 創建測試項目
    print("\n7. 創建測試項目...")
    test_project = current_dir / "test_project"
    test_project.mkdir(exist_ok=True)
    
    # 創建簡單的測試文件
    test_file = test_project / "test.py"
    with open(test_file, 'w', encoding='utf-8') as f:
        f.write('''#!/usr/bin/env python3
"""
測試項目 - 增強版RAG系統
"""

def main():
    """主函數"""
    print("測試項目運行正常！")
    print("這是一個用於測試增強版RAG系統的簡單項目。")
    return "測試成功"

if __name__ == "__main__":
    main()
''')
    
    print(f"   🧪 創建測試項目: test_project/")
    
    # 8. 完成設置
    print("\n" + "=" * 60)
    print("🎉 系統設置完成！")
    print("=" * 60)
    
    print("\n📋 使用方法：")
    print("")
    
    if os.name == "posix":
        print("1. 啟動系統（圖形界面）：")
        print("   ./launch_rag.sh")
        print("")
        print("2. 快速分析項目：")
        print("   ./rag_quick.sh /path/to/your/project")
        print("")
    
    print("3. 直接運行：")
    print("   python3 main_enhanced.py /path/to/your/project")
    print("")
    print("4. 監測模式：")
    print("   python3 run_monitoring_system.py")
    print("")
    print("5. 測試系統：")
    print("   python3 test_windows_app.py")
    print("")
    
    print("📁 系統目錄：")
    print("   output/    - 分析結果")
    print("   logs/      - 系統日誌")
    print("   config/    - 配置文件")
    print("   temp/      - 臨時文件")
    print("")
    
    print("📖 文檔：")
    print("   README_ENHANCED.md    - 詳細系統文檔")
    print("   QUICK_START_GUIDE.md  - 快速開始指南")
    print("   WINDOWS_APPLICATION_GUIDE.md - Windows應用指南")
    print("")
    
    print("🧪 測試：")
    print("   測試項目: test_project/")
    print("   測試腳本: test_windows_app.py")
    print("")
    
    print("=" * 60)
    print("🚀 立即試用：")
    
    if os.name == "posix":
        print("   ./launch_rag.sh")
    else:
        print("   python3 main_enhanced.py test_project/")
    
    print("=" * 60)
    
    return True

if __name__ == "__main__":
    try:
        success = setup_system()
        if success:
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"❌ 設置過程中發生錯誤: {e}")
        sys.exit(1)