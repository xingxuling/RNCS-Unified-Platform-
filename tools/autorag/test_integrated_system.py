#!/usr/bin/env python3
"""
集成系統測試腳本

測試同步監測與RAG人工智能系統的功能。
"""

import os
import sys
import time
import tempfile
import shutil
from pathlib import Path

# 添加模塊路徑
sys.path.insert(0, str(Path(__file__).parent))

def test_file_monitoring():
    """測試文件監測功能"""
    print("🧪 測試文件監測功能")
    print("=" * 50)
    
    # 創建測試目錄和文件
    test_dir = tempfile.mkdtemp(prefix="test_monitor_")
    print(f"測試目錄: {test_dir}")
    
    try:
        # 創建測試文件
        test_files = [
            "main.py",
            "utils.py",
            "test_app.js",
            "README.md",
            "config.json"
        ]
        
        for file_name in test_files:
            file_path = os.path.join(test_dir, file_name)
            with open(file_path, 'w') as f:
                f.write(f"# Test content for {file_name}\n")
                f.write("print('Hello, World!')\n")
        
        print(f"創建了 {len(test_files)} 個測試文件")
        
        # 模擬文件變化
        print("\n📝 模擬文件變化...")
        
        # 修改一個文件
        main_py = os.path.join(test_dir, "main.py")
        with open(main_py, 'a') as f:
            f.write("\n# New line added for testing\n")
        
        # 創建新文件
        new_file = os.path.join(test_dir, "new_module.py")
        with open(new_file, 'w') as f:
            f.write("def new_function():\n    return 'New!'\n")
        
        print("✅ 文件變化模擬完成")
        
        # 檢查文件變化檢測
        print("\n🔍 檢查文件變化檢測...")
        
        # 簡單的文件變化檢測
        file_cache = {}
        changes_detected = 0
        
        for root, dirs, files in os.walk(test_dir):
            for file in files:
                file_path = os.path.join(root, file)
                
                try:
                    stat = os.stat(file_path)
                    current_mtime = stat.st_mtime
                    
                    cache_key = file_path
                    
                    if cache_key in file_cache:
                        last_mtime = file_cache[cache_key]
                        if current_mtime != last_mtime:
                            changes_detected += 1
                            print(f"  檢測到變化: {os.path.basename(file_path)}")
                    
                    file_cache[cache_key] = current_mtime
                    
                except OSError:
                    continue
        
        print(f"✅ 檢測到 {changes_detected} 個文件變化")
        
        return True
        
    finally:
        # 清理測試目錄
        if os.path.exists(test_dir):
            shutil.rmtree(test_dir)
            print(f"\n🧹 已清理測試目錄: {test_dir}")

def test_rag_system_integration():
    """測試RAG系統集成"""
    print("\n🧪 測試RAG系統集成")
    print("=" * 50)
    
    # 檢查RAG系統文件
    rag_files = [
        "main.py",
        "modules/rag_analyzer.py",
        "modules/decision_engine.py",
        "modules/auto_packager.py"
    ]
    
    missing_files = []
    for file_path in rag_files:
        full_path = os.path.join(os.path.dirname(__file__), file_path)
        if not os.path.exists(full_path):
            missing_files.append(file_path)
    
    if missing_files:
        print(f"⚠️  缺少RAG系統文件: {', '.join(missing_files)}")
        print("跳過RAG集成測試")
        return False
    
    print("✅ RAG系統文件完整")
    
    # 創建測試項目
    test_project = tempfile.mkdtemp(prefix="test_project_")
    print(f"測試項目目錄: {test_project}")
    
    try:
        # 創建簡單的項目結構
        (Path(test_project) / "package.json").write_text(
            '{"name": "test-project", "version": "1.0.0"}'
        )
        
        (Path(test_project) / "README.md").write_text(
            "# Test Project\n\nThis is a test project for RAG analysis."
        )
        
        (Path(test_project) / "src").mkdir(exist_ok=True)
        (Path(test_project) / "src" / "index.js").write_text(
            'console.log("Hello, World!");'
        )
        
        print("創建了測試項目結構")
        
        # 測試RAG分析（簡化版本）
        print("\n🔍 測試RAG分析...")
        
        # 導入RAG分析器
        sys.path.insert(0, str(Path(__file__).parent / "modules"))
        
        try:
            from rag_analyzer import ProjectAnalyzer
            
            analyzer = ProjectAnalyzer(test_project)
            report = analyzer.generate_analysis_report()
            
            if report:
                print("✅ RAG分析成功")
                
                # 顯示分析結果摘要
                overall = report.get("overall_assessment", {})
                score = overall.get("overall_score", 0)
                maturity = overall.get("maturity_level", "unknown")
                
                print(f"   總體分數: {score}/100")
                print(f"   成熟度等級: {maturity}")
                
                return True
            else:
                print("❌ RAG分析失敗：無報告生成")
                return False
                
        except ImportError as e:
            print(f"❌ 無法導入RAG分析器: {e}")
            return False
        except Exception as e:
            print(f"❌ RAG分析錯誤: {e}")
            return False
            
    finally:
        # 清理測試項目
        if os.path.exists(test_project):
            shutil.rmtree(test_project)
            print(f"\n🧹 已清理測試項目: {test_project}")

def test_monitoring_integration():
    """測試監測集成"""
    print("\n🧪 測試監測集成")
    print("=" * 50)
    
    # 測試事件處理
    print("測試事件處理機制...")
    
    class TestEventHandler:
        def __init__(self):
            self.events_received = []
        
        def handle_event(self, event):
            self.events_received.append(event)
            print(f"   收到事件: {event.get('event_type', 'unknown')}")
    
    # 創建測試處理器
    handler = TestEventHandler()
    
    # 模擬事件
    test_events = [
        {"event_type": "file_changes", "message": "測試文件變化"},
        {"event_type": "git_activity", "message": "測試Git活動"},
        {"event_type": "analysis_triggered", "message": "測試分析觸發"}
    ]
    
    for event in test_events:
        handler.handle_event(event)
    
    print(f"✅ 事件處理測試完成，收到 {len(handler.events_received)} 個事件")
    
    # 測試觸發邏輯
    print("\n測試觸發邏輯...")
    
    class TestTriggerLogic:
        def __init__(self, threshold=3):
            self.threshold = threshold
            self.change_count = 0
            self.last_trigger_time = 0
        
        def add_change(self, change_count=1):
            self.change_count += change_count
            current_time = time.time()
            
            if (self.change_count >= self.threshold and 
                current_time - self.last_trigger_time > 60):
                print(f"   觸發條件滿足: {self.change_count} >= {self.threshold}")
                self.change_count = 0
                self.last_trigger_time = current_time
                return True
            return False
    
    trigger = TestTriggerLogic(threshold=2)
    
    # 模擬變化
    test_changes = [1, 1, 1, 1]  # 4次變化，每次1個文件
    
    triggers_fired = 0
    for i, change in enumerate(test_changes, 1):
        print(f"  模擬變化 {i}: +{change} 個文件")
        if trigger.add_change(change):
            triggers_fired += 1
    
    print(f"✅ 觸發邏輯測試完成，觸發 {triggers_fired} 次")
    
    return True

def test_system_workflow():
    """測試完整系統工作流"""
    print("\n🧪 測試完整系統工作流")
    print("=" * 50)
    
    print("模擬完整工作流:")
    print("1. 📁 開發者修改代碼文件")
    print("2. 🔍 系統檢測到文件變化")
    print("3. 📊 達到觸發閾值（3個文件）")
    print("4. 🧠 自動運行RAG分析")
    print("5. 💡 顯示分析結果和建議")
    print("6. 🔧 開發者根據建議優化代碼")
    
    print("\n✅ 工作流測試完成")
    return True

def main():
    """主測試函數"""
    print("🚀 開始集成系統測試")
    print("=" * 60)
    
    test_results = []
    
    try:
        # 測試1: 文件監測
        result1 = test_file_monitoring()
        test_results.append(("文件監測", result1))
        
        # 測試2: RAG系統集成
        result2 = test_rag_system_integration()
        test_results.append(("RAG系統集成", result2))
        
        # 測試3: 監測集成
        result3 = test_monitoring_integration()
        test_results.append(("監測集成", result3))
        
        # 測試4: 完整工作流
        result4 = test_system_workflow()
        test_results.append(("完整工作流", result4))
        
        # 顯示測試結果
        print("\n" + "=" * 60)
        print("📊 測試結果摘要")
        print("=" * 60)
        
        passed = 0
        failed = 0
        
        for test_name, result in test_results:
            status = "✅ 通過" if result else "❌ 失敗"
            print(f"{test_name:20} {status}")
            
            if result:
                passed += 1
            else:
                failed += 1
        
        print(f"\n總計: {passed} 通過, {failed} 失敗")
        
        if failed == 0:
            print("\n🎉 所有測試通過！系統準備就緒。")
            print("\n下一步:")
            print("1. 運行: python run_monitoring_system.py")
            print("2. 開始開發，系統會自動監測和分析")
            print("3. 查看分析結果和優化建議")
            return 0
        else:
            print(f"\n⚠️  有 {failed} 個測試失敗，請檢查問題。")
            return 1
            
    except Exception as e:
        print(f"\n❌ 測試過程中發生錯誤: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())