#!/bin/bash

# RAG 自動化系統啟動腳本
# 用法: ./run_system.sh <項目路徑>

set -e

echo "========================================"
echo "🚀 RAG 自動化系統啟動"
echo "========================================"

# 檢查參數
if [ $# -lt 1 ]; then
    echo "用法: $0 <項目路徑>"
    echo "示例: $0 /path/to/your/project"
    exit 1
fi

PROJECT_PATH="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "📁 項目路徑: $PROJECT_PATH"
echo "📊 腳本目錄: $SCRIPT_DIR"
echo "⏰ 開始時間: $(date)"

# 檢查項目是否存在
if [ ! -d "$PROJECT_PATH" ]; then
    echo "❌ 錯誤: 項目路徑不存在: $PROJECT_PATH"
    exit 1
fi

# 檢查 Python 環境
echo "🔍 檢查 Python 環境..."
if ! command -v python3 &> /dev/null; then
    echo "❌ 錯誤: Python3 未安裝"
    echo "請安裝 Python3:"
    echo "  Ubuntu/Debian: sudo apt install python3 python3-pip"
    echo "  macOS: brew install python"
    echo "  Windows: 從 https://python.org 下載"
    exit 1
fi

PYTHON_VERSION=$(python3 --version)
echo "✅ Python 版本: $PYTHON_VERSION"

# 檢查必要庫
echo "🔍 檢查 Python 庫..."
REQUIRED_LIBS=("json" "pathlib" "datetime" "shutil" "zipfile" "tarfile")

for lib in "${REQUIRED_LIBS[@]}"; do
    if python3 -c "import $lib" 2>/dev/null; then
        echo "  ✅ $lib"
    else
        echo "  ⚠️  $lib (可能需要安裝)"
    fi
done

# 創建日誌目錄
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/execution_$TIMESTAMP.log"

echo "📝 日誌文件: $LOG_FILE"

# 運行系統
echo "========================================"
echo "🎯 開始執行 RAG 自動化系統"
echo "========================================"

# 記錄開始時間
START_TIME=$(date +%s)

# 執行主程序
cd "$SCRIPT_DIR"
python3 main.py "$PROJECT_PATH" 2>&1 | tee "$LOG_FILE"

# 記錄結束時間
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "========================================"
echo "📊 執行統計"
echo "========================================"
echo "開始時間: $(date -d @$START_TIME '+%Y-%m-%d %H:%M:%S')"
echo "結束時間: $(date -d @$END_TIME '+%Y-%m-%d %H:%M:%S')"
echo "持續時間: $DURATION 秒 ($(($DURATION / 60)) 分 $(($DURATION % 60)) 秒)"

# 檢查執行結果
if grep -q "RAG 自動化系統執行完成" "$LOG_FILE"; then
    echo "✅ 系統執行成功"
    
    # 提取關鍵信息
    echo "========================================"
    echo "📋 執行摘要"
    echo "========================================"
    
    # 提取項目名稱
    PROJECT_NAME=$(basename "$PROJECT_PATH")
    echo "項目名稱: $PROJECT_NAME"
    
    # 提取分數
    SCORE=$(grep -o "總體分數: [0-9.]*" "$LOG_FILE" | tail -1 | cut -d' ' -f2 || echo "N/A")
    echo "總體分數: $SCORE/100"
    
    # 提取打包文件
    PACKAGE_FILE=$(grep -o "打包文件: .*" "$LOG_FILE" | tail -1 | cut -d' ' -f2- || echo "無")
    echo "打包文件: $PACKAGE_FILE"
    
    # 檢查桌面文件
    DESKTOP_PATH="$HOME/Desktop"
    echo "========================================"
    echo "📁 桌面文件檢查"
    echo "========================================"
    
    if [ -d "$DESKTOP_PATH" ]; then
        DESKTOP_FILES=$(find "$DESKTOP_PATH" -name "*RAG*" -o -name "*optimized*" -o -name "*packaging_report*" 2>/dev/null | head -5)
        
        if [ -n "$DESKTOP_FILES" ]; then
            echo "找到的相關文件:"
            echo "$DESKTOP_FILES" | while read -r file; do
                echo "  📄 $(basename "$file")"
            done
        else
            echo "未找到相關桌面文件"
        fi
    else
        echo "桌面目錄不存在: $DESKTOP_PATH"
    fi
    
else
    echo "❌ 系統執行可能失敗"
    echo "請查看日誌文件: $LOG_FILE"
fi

echo "========================================"
echo "📄 重要文件"
echo "========================================"
echo "日誌文件: $LOG_FILE"
echo "輸出目錄: $SCRIPT_DIR/output/$TIMESTAMP/"

# 創建完成標記
COMPLETION_FILE="$SCRIPT_DIR/completion_$TIMESTAMP.txt"
cat > "$COMPLETION_FILE" << EOF
RAG 自動化系統執行完成
=======================

執行時間: $(date)
項目路徑: $PROJECT_PATH
持續時間: $DURATION 秒
狀態: $(if [ -n "$PACKAGE_FILE" ] && [ "$PACKAGE_FILE" != "無" ]; then echo "成功"; else echo "部分成功"; fi)

重要文件:
- 日誌: $LOG_FILE
- 輸出: $SCRIPT_DIR/output/$TIMESTAMP/
$(if [ -n "$PACKAGE_FILE" ] && [ "$PACKAGE_FILE" != "無" ]; then echo "- 打包: $PACKAGE_FILE"; fi)

下一步:
1. 查看桌面上的打包文件和報告
2. 檢查輸出目錄的分析結果
3. 根據建議進行項目優化
EOF

echo "完成標記: $COMPLETION_FILE"
echo "========================================"
echo "🎉 腳本執行完成!"
echo "========================================"