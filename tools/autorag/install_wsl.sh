#!/bin/bash

echo "========================================"
echo "    AutoRAG WSL 安裝腳本"
echo "========================================"
echo ""

# 檢查 Python
echo "🔍 檢查 Python 環境..."
if ! command -v python3 &> /dev/null; then
    echo "❌ 未檢測到 Python3"
    echo "請先安裝 Python3: sudo apt update && sudo apt install python3 python3-pip"
    exit 1
fi

python3 --version
echo "✅ Python 已安裝"

# 檢查必要文件
echo ""
echo "🔍 檢查必要文件..."
if [ ! -f "main_enhanced.py" ]; then
    echo "❌ 找不到 main_enhanced.py"
    exit 1
fi

if [ ! -f "requirements.txt" ]; then
    echo "❌ 找不到 requirements.txt"
    exit 1
fi

echo "✅ 所有必要文件都存在"

# 創建虛擬環境
echo ""
echo "========================================"
echo "    [1/3] 創建虛擬環境"
echo "========================================"
echo ""
echo "正在創建虛擬環境..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ 虛擬環境已創建"
else
    echo "✅ 虛擬環境已存在"
fi

# 激活虛擬環境並安裝依賴
echo ""
echo "正在安裝依賴包..."
source venv/bin/activate
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "⚠️  依賴安裝有問題，嘗試繼續..."
fi

deactivate

# 檢查模塊目錄
echo ""
echo "========================================"
echo "    [2/3] 檢查模塊"
echo "========================================"
echo ""
if [ ! -d "modules" ]; then
    echo "❌ 找不到 modules 目錄"
    echo "請確保所有模塊文件都存在"
    exit 1
fi

echo "✅ 模塊目錄存在"

# 創建運行腳本
echo ""
echo "========================================"
echo "    [3/3] 創建運行腳本"
echo "========================================"
echo ""
cat > run_rag_wsl.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
source venv/bin/activate
python3 main_enhanced.py "$@"
deactivate
EOF

chmod +x run_rag_wsl.sh

echo "🎉 安裝完成！"
echo ""
echo "📋 安裝結果:"
echo "✅ Python 依賴已安裝"
echo "✅ 運行腳本已創建: run_rag_wsl.sh"
echo ""
echo "🚀 使用方法:"
echo "1. 運行系統: ./run_rag_wsl.sh /path/to/your/project"
echo "2. 或直接運行: python3 main_enhanced.py /path/to/your/project"
echo ""
echo "📖 文檔:"
echo "   查看 README_ENHANCED.md 獲取詳細信息"
echo ""
echo "========================================"