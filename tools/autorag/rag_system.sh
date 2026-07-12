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
