#!/usr/bin/env python3
"""
修復版增強系統運行腳本
確保在正確的目錄中執行
"""

import os
import sys
from pathlib import Path

def main():
    # 確保在正確的目錄中運行
    script_dir = Path(__file__).parent.absolute()
    os.chdir(script_dir)
    
    # 設置編碼
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
    
    # 設置模塊路徑
    sys.path.insert(0, str(script_dir))
    sys.path.insert(0, str(script_dir / "modules"))
    
    print("=" * 60)
    print("🚀 RAG 增強版系統 (修復執行路徑)")
    print("=" * 60)
    
    # 檢查參數
    if len(sys.argv) > 1:
        project_path = sys.argv[1]
    else:
        project_path = input("請輸入要分析的項目路徑: ").strip()
    
    if not project_path:
        print("❌ 未提供項目路徑")
        return
    
    project_path = Path(project_path).absolute()
    if not project_path.exists():
        print(f"❌ 路徑不存在: {project_path}")
        return
    
    print(f"📁 分析項目: {project_path}")
    print(f"📂 腳本目錄: {script_dir}")
    
    try:
        # 導入增強版系統
        from main_enhanced import EnhancedRAGSystem
        
        # 創建系統實例
        system = EnhancedRAGSystem(str(project_path))
        
        # 運行分析
        print("\n🔍 開始增強分析...")
        results = system.run_full_analysis()
        
        print("\n" + "=" * 60)
        print("✅ 增強分析完成！")
        print("=" * 60)
        
        if results.get("package_created"):
            print(f"📦 打包文件: {results.get('package_path')}")
        else:
            print("⚠️  未生成打包文件")
            
    except ImportError as e:
        print(f"❌ 導入錯誤: {e}")
        import traceback
        traceback.print_exc()
    except Exception as e:
        print(f"❌ 運行錯誤: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
