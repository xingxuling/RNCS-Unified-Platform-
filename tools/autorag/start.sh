#!/bin/bash

# auto-rag-system 啟動腳本
# 版本: 1.0.0

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 進入項目目錄
cd "$(dirname "$0")"

echo "========================================"
echo "🚀 啟動 RAG 自動化系統"
echo "========================================"
echo ""

# 檢查 Python 環境
print_info "檢查 Python 環境..."
if ! command -v python3 &> /dev/null; then
    print_error "Python3 未安裝"
    echo "請安裝 Python3: https://www.python.org/downloads/"
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
print_success "Python 版本: $PYTHON_VERSION"

# 檢查依賴
print_info "檢查依賴..."
if [ -f "requirements.txt" ]; then
    print_info "安裝 Python 依賴..."
    pip3 install -r requirements.txt --quiet
    print_success "依賴安裝完成"
else
    print_warning "未找到 requirements.txt"
fi

# 檢查虛擬環境
if [ -d "venv" ]; then
    print_info "激活虛擬環境..."
    source venv/bin/activate
fi

# 選擇啟動模式
echo ""
echo "請選擇啟動模式:"
echo "1. 基礎分析 (main.py)"
echo "2. 增強分析 (main_enhanced.py)"
echo "3. RAG 應用 (rag_app.py)"
echo "4. 自動化簡單版 (rag_automation_simple.py)"
echo "5. 監控系統 (run_monitoring_system.py)"
echo ""
read -p "請輸入選擇 (1-5, 默認 1): " choice

case ${choice:-1} in
    1)
        ENTRY_FILE="main.py"
        print_info "啟動基礎分析模式..."
        ;;
    2)
        ENTRY_FILE="main_enhanced.py"
        print_info "啟動增強分析模式..."
        ;;
    3)
        ENTRY_FILE="rag_app.py"
        print_info "啟動 RAG 應用模式..."
        ;;
    4)
        ENTRY_FILE="rag_automation_simple.py"
        print_info "啟動自動化簡單版..."
        ;;
    5)
        ENTRY_FILE="run_monitoring_system.py"
        print_info "啟動監控系統..."
        ;;
    *)
        ENTRY_FILE="main.py"
        print_info "使用默認模式: 基礎分析"
        ;;
esac

# 檢查入口文件
if [ ! -f "$ENTRY_FILE" ]; then
    print_error "未找到入口文件: $ENTRY_FILE"
    echo "可用文件:"
    ls *.py | grep -E "(main|rag|run)" || echo "無可用文件"
    exit 1
fi

print_success "使用入口文件: $ENTRY_FILE"

# 運行參數
echo ""
print_info "輸入項目路徑進行分析 (按 Enter 使用測試項目):"
read -p "項目路徑: " project_path

if [ -z "$project_path" ]; then
    project_path="test-project"
    print_info "使用測試項目: $project_path"
fi

# 啟動應用
echo ""
echo "========================================"
print_info "開始運行 RAG 自動化系統"
echo "========================================"
echo ""

if [ "$ENTRY_FILE" = "rag_app.py" ]; then
    # RAG 應用可能需要不同參數
    python3 "$ENTRY_FILE"
else
    python3 "$ENTRY_FILE" "$project_path"
fi

EXIT_CODE=$?

echo ""
echo "========================================"
if [ $EXIT_CODE -eq 0 ]; then
    print_success "RAG 系統運行完成"
else
    print_error "RAG 系統運行失敗 (退出碼: $EXIT_CODE)"
fi
echo "========================================"

# 顯示結果目錄
if [ -d "output" ]; then
    LATEST_OUTPUT=$(ls -td output/*/ 2>/dev/null | head -1)
    if [ -n "$LATEST_OUTPUT" ]; then
        echo ""
        print_info "最新分析結果:"
        echo "  $LATEST_OUTPUT"
        echo ""
        echo "📋 生成的文件:"
        find "$LATEST_OUTPUT" -type f -name "*.json" -o -name "*.txt" -o -name "*.md" | head -5
    fi
fi

echo ""
echo "💡 提示:"
echo "  - 查看詳細文檔: cat README.md"
echo "  - 使用增強功能: python main_enhanced.py <項目路徑>"
echo "  - 監控系統: python run_monitoring_system.py"
echo ""
