#!/bin/bash

# 增強版RAG系統 - 立即安裝腳本
# 在當前WSL/Linux環境中直接安裝

echo "========================================"
echo "🚀 增強版RAG系統 - 立即安裝"
echo "========================================"
echo ""

# 1. 檢查Python
echo "1. 檢查Python環境..."
if ! command -v python3 &> /dev/null; then
    echo "❌ 未找到Python3"
    echo "正在安裝Python3..."
    sudo apt update && sudo apt install -y python3 python3-pip
fi

PYTHON_VERSION=$(python3 --version | awk '{print $2}')
echo "✅ Python版本: $PYTHON_VERSION"

# 檢查Python版本
if python3 -c "import sys; exit(0) if sys.version_info >= (3, 8) else exit(1)"; then
    echo "✅ Python版本符合要求 (>=3.8)"
else
    echo "❌ Python版本過低 (需要>=3.8)"
    exit 1
fi

# 2. 檢查pip
echo ""
echo "2. 檢查pip..."
if ! command -v pip3 &> /dev/null; then
    echo "📦 安裝pip..."
    sudo apt install -y python3-pip
fi

# 3. 安裝依賴
echo ""
echo "3. 安裝Python依賴..."
pip3 install --upgrade pip

# 創建requirements.txt
cat > requirements.txt << 'EOF'
# 增強版RAG系統依賴
python>=3.8

# 可選依賴（增強功能）
colorama>=0.4.6    # 彩色終端輸出
tqdm>=4.66.0      # 進度條顯示
psutil>=5.9.0     # 系統監控
EOF

pip3 install -r requirements.txt
echo "✅ 依賴安裝完成"

# 4. 創建目錄
echo ""
echo "4. 創建系統目錄..."
mkdir -p output logs config
echo "✅ 目錄創建完成"

# 5. 創建啟動腳本
echo ""
echo "5. 創建啟動腳本..."

# 主啟動腳本
cat > rag_system.sh << 'EOF'
#!/bin/bash

# 增強版RAG系統 - Linux啟動腳本

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================"
echo "    增強版RAG系統 - Linux版本"
echo "========================================"
echo ""

while true; do
    echo "主菜單"
    echo "========================================"
    echo ""
    echo "  1. 🚀 增強版RAG分析 (完整流程)"
    echo "  2. 📊 監測系統 (實時監測)"
    echo "  3. 🔄 增量處理系統"
    echo "  4. 🔍 基礎RAG分析"
    echo "  5. 📖 查看文檔"
    echo "  6. ❌ 退出系統"
    echo ""
    echo "========================================"
    
    read -p "請選擇功能 (1-6): " choice
    
    case $choice in
        1)
            echo ""
            echo "🚀 增強版RAG分析"
            echo "========================================"
            echo ""
            read -p "請輸入項目路徑: " project_path
            
            if [ -z "$project_path" ]; then
                echo "❌ 未輸入項目路徑"
                read -p "按Enter繼續..."
                continue
            fi
            
            if [ ! -d "$project_path" ] && [ ! -f "$project_path" ]; then
                echo "❌ 項目路徑不存在: $project_path"
                read -p "按Enter繼續..."
                continue
            fi
            
            echo ""
            echo "正在分析項目: $project_path"
            echo "這可能需要幾分鐘時間，請稍候..."
            echo ""
            
            python3 main_enhanced.py "$project_path"
            
            echo ""
            echo "✅ 分析完成！"
            echo "結果已保存到 output/ 目錄"
            echo ""
            read -p "按Enter繼續..."
            ;;
            
        2)
            echo ""
            echo "📊 監測系統"
            echo "========================================"
            echo ""
            echo "注意：按 Ctrl+C 停止監測"
            echo ""
            read -p "按Enter開始監測..."
            
            echo ""
            echo "啟動監測系統..."
            echo ""
            
            python3 run_monitoring_system.py
            
            echo ""
            read -p "按Enter繼續..."
            ;;
            
        3)
            echo ""
            echo "🔄 增量處理系統"
            echo "========================================"
            echo ""
            read -p "請輸入項目路徑: " project_path
            
            if [ -z "$project_path" ]; then
                echo "❌ 未輸入項目路徑"
                read -p "按Enter繼續..."
                continue
            fi
            
            if [ ! -d "$project_path" ] && [ ! -f "$project_path" ]; then
                echo "❌ 項目路徑不存在: $project_path"
                read -p "按Enter繼續..."
                continue
            fi
            
            echo ""
            echo "正在進行增量處理..."
            echo ""
            
            python3 run_with_incremental_processing.py "$project_path"
            
            echo ""
            read -p "按Enter繼續..."
            ;;
            
        4)
            echo ""
            echo "🔍 基礎RAG分析"
            echo "========================================"
            echo ""
            read -p "請輸入項目路徑: " project_path
            
            if [ -z "$project_path" ]; then
                echo "❌ 未輸入項目路徑"
                read -p "按Enter繼續..."
                continue
            fi
            
            if [ ! -d "$project_path" ] && [ ! -f "$project_path" ]; then
                echo "❌ 項目路徑不存在: $project_path"
                read -p "按Enter繼續..."
                continue
            fi
            
            echo ""
            echo "正在進行基礎分析..."
            echo ""
            
            python3 main.py "$project_path"
            
            echo ""
            read -p "按Enter繼續..."
            ;;
            
        5)
            echo ""
            echo "📖 打開文檔..."
            if [ -f "README_ENHANCED.md" ]; then
                if command -v less &> /dev/null; then
                    less README_ENHANCED.md
                else
                    cat README_ENHANCED.md | head -50
                    echo "..."
                    read -p "按Enter繼續..."
                fi
            else
                echo "❌ 文檔文件不存在"
                read -p "按Enter繼續..."
            fi
            ;;
            
        6)
            echo ""
            echo "👋 感謝使用增強版RAG系統！"
            echo ""
            exit 0
            ;;
            
        *)
            echo "❌ 無效選擇，請重新輸入"
            sleep 1
            ;;
    esac
done
EOF

chmod +x rag_system.sh
echo "✅ 創建 rag_system.sh"

# 快速啟動腳本
cat > rag_quick.sh << 'EOF'
#!/bin/bash

# 增強版RAG系統 - 快速啟動腳本

if [ $# -eq 0 ]; then
    echo "❌ 錯誤：未指定項目路徑"
    echo ""
    echo "使用方法："
    echo "  $0 <項目路徑>"
    echo ""
    echo "示例："
    echo "  $0 ~/projects/my-app"
    echo "  $0 /path/to/your/project"
    echo ""
    exit 1
fi

PROJECT_PATH="$1"

if [ ! -d "$PROJECT_PATH" ] && [ ! -f "$PROJECT_PATH" ]; then
    echo "❌ 錯誤：項目路徑不存在: $PROJECT_PATH"
    exit 1
fi

echo "🚀 啟動增強版RAG分析..."
echo "項目: $PROJECT_PATH"
echo ""

python3 main_enhanced.py "$PROJECT_PATH"
EOF

chmod +x rag_quick.sh
echo "✅ 創建 rag_quick.sh"

# 6. 創建配置文件
echo ""
echo "6. 創建配置文件..."

cat > config/linux_config.json << 'EOF'
{
  "system": {
    "name": "Enhanced RAG System",
    "version": "1.0.0",
    "linux": true,
    "wsl": true
  },
  "paths": {
    "default_project_dir": "$HOME/projects",
    "output_dir": "./output",
    "logs_dir": "./logs"
  },
  "monitoring": {
    "enabled": true,
    "interval_seconds": 5,
    "watch_directories": [
      "$HOME/projects",
      "$HOME/workspace",
      "."
    ]
  }
}
EOF

echo "✅ 創建 config/linux_config.json"

# 7. 測試系統
echo ""
echo "7. 測試系統..."
if [ -f "test_windows_app.py" ]; then
    echo "運行系統測試..."
    python3 test_windows_app.py
else
    echo "創建簡單測試..."
    
    # 創建測試項目
    mkdir -p test_project
    cat > test_project/test.py << 'EOF'
#!/usr/bin/env python3
print("測試項目 - 增強版RAG系統")
print("這是一個用於測試的簡單項目")
EOF
    
    echo "✅ 創建測試項目: test_project/"
fi

# 8. 完成安裝
echo ""
echo "========================================"
echo "🎉 安裝完成！"
echo "========================================"
echo ""
echo "📋 使用方法："
echo ""
echo "1. 啟動系統（圖形界面）："
echo "   ./rag_system.sh"
echo ""
echo "2. 快速分析項目："
echo "   ./rag_quick.sh /path/to/your/project"
echo ""
echo "3. 直接運行："
echo "   python3 main_enhanced.py /path/to/your/project"
echo ""
echo "4. 監測模式："
echo "   python3 run_monitoring_system.py"
echo ""
echo "📁 系統目錄："
echo "   output/    - 分析結果"
echo "   logs/      - 系統日誌"
echo "   config/    - 配置文件"
echo ""
echo "📖 文檔："
echo "   README_ENHANCED.md    - 詳細系統文檔"
echo "   QUICK_START_GUIDE.md  - 快速開始指南"
echo ""
echo "========================================"
echo "🚀 立即試用："
echo "   ./rag_system.sh"
echo "========================================"