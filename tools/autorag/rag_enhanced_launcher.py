#!/usr/bin/env python3
"""
RAG 增強版系統啟動器
修復模塊導入問題
"""

import os
import sys
from pathlib import Path

# 設置正確的編碼
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

# 設置模塊路徑
rag_dir = Path(__file__).parent
sys.path.insert(0, str(rag_dir))
sys.path.insert(0, str(rag_dir / "modules"))

def main():
    """主函數"""
    print("=" * 60)
    print("🚀 RAG 增強版自動化系統")
    print("=" * 60)
    
    # 檢查項目路徑
    if len(sys.argv) > 1:
        project_path = sys.argv[1]
    else:
        project_path = input("請輸入要分析的項目路徑: ").strip()
    
    if not project_path:
        print("❌ 未提供項目路徑")
        return
    
    project_path = Path(project_path)
    if not project_path.exists():
        print(f"❌ 路徑不存在: {project_path}")
        return
    
    print(f"📁 分析項目: {project_path}")
    
    try:
        # 嘗試導入增強版模塊
        from main_enhanced import EnhancedRAGSystem
        
        # 創建系統實例
        system = EnhancedRAGSystem(str(project_path))
        
        # 運行分析
        print("
🔍 開始增強分析...")
        results = system.run_full_analysis()
        
        print("
" + "=" * 60)
        print("✅ 增強分析完成！")
        print("=" * 60)
        
        if results.get("package_created"):
            print(f"📦 打包文件: {results.get('package_path')}")
        else:
            print("⚠️  未生成打包文件")
            
    except ImportError as e:
        print(f"❌ 導入錯誤: {e}")
        print("嘗試使用基本版本...")
        
        # 回退到基本版本
        try:
            from main import RAGAutomationSystem
            system = RAGAutomationSystem(str(project_path))
            results = system.run_full_analysis()
            print("
✅ 基本版本分析完成！")
        except ImportError as e2:
            print(f"❌ 基本版本也失敗: {e2}")
            print("請檢查模塊安裝和路徑設置")
            
    except Exception as e:
        print(f"❌ 運行錯誤: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
