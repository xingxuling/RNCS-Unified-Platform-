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
