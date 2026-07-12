#!/usr/bin/env python3
"""
增量處理模塊測試腳本
演示增量處理模塊的基本功能
"""

import os
import sys
import json
import tempfile
import shutil
from pathlib import Path

# 添加模塊路徑
sys.path.insert(0, str(Path(__file__).parent / "modules"))

from incremental_processing_module import IncrementalProcessingModule, example_file_processor


def create_test_project():
    """創建測試項目"""
    # 創建臨時目錄
    temp_dir = tempfile.mkdtemp(prefix="test_project_")
    print(f"📁 創建測試項目目錄: {temp_dir}")
    
    # 創建一些測試文件
    test_files = [
        "main.py",
        "utils.py",
        "config.json",
        "README.md",
        "src/__init__.py",
        "src/module1.py",
        "src/module2.py",
        "tests/test_basic.py",
        "docs/index.md"
    ]
    
    for file_path in test_files:
        full_path = Path(temp_dir) / file_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        
        # 根據文件類型創建不同內容
        if file_path.endswith(".py"):
            content = f'''# {file_path}
"""
測試文件: {file_path}
"""

def hello_world():
    """打印Hello World"""
    print("Hello, World!")

class TestClass:
    """測試類"""
    
    def __init__(self, name):
        self.name = name
    
    def greet(self):
        """打招呼"""
        return f"Hello, {{self.name}}!"

if __name__ == "__main__":
    hello_world()
'''
        elif file_path.endswith(".json"):
            content = json.dumps({
                "name": "test_project",
                "version": "1.0.0",
                "description": "測試項目",
                "author": "Test User"
            }, indent=2)
        elif file_path.endswith(".md"):
            content = f"""# {file_path}

這是測試文件 {file_path} 的內容。

## 功能

1. 測試功能1
2. 測試功能2
3. 測試功能3

## 使用說明

這是一個測試文件。
"""
        else:
            content = f"Test content for {file_path}"
        
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
    
    print(f"✅ 創建了 {len(test_files)} 個測試文件")
    return temp_dir


def test_basic_functionality():
    """測試基本功能"""
    print("=" * 70)
    print("🧪 測試增量處理模塊基本功能")
    print("=" * 70)
    
    # 創建測試項目
    test_dir = create_test_project()
    
    try:
        # 測試1: 初始化模塊
        print("\n1️⃣  測試初始化")
        print("-" * 45)
        incremental_module = IncrementalProcessingModule(test_dir)
        print(f"✅ 增量處理模塊初始化成功")
        print(f"   項目路徑: {test_dir}")
        print(f"   狀態目錄: {incremental_module.state_dir}")
        
        # 測試2: 獲取處理摘要
        print("\n2️⃣  測試處理摘要")
        print("-" * 45)
        summary = incremental_module.get_processing_summary()
        print(f"✅ 處理摘要獲取成功:")
        print(f"   追蹤文件數: {summary['file_tracking']['tracked_files']}")
        print(f"   處理歷史次數: {summary['processing_history']['total_runs']}")
        
        # 測試3: 檢測變化（第一次運行）
        print("\n3️⃣  測試變化檢測（第一次運行）")
        print("-" * 45)
        changes = incremental_module.detect_changes([".py", ".json", ".md"])
        print(f"✅ 變化檢測完成:")
        print(f"   新文件: {len(changes['new_files'])} 個")
        print(f"   修改的文件: {len(changes['modified_files'])} 個")
        
        # 測試4: 增量處理（第一次運行）
        print("\n4️⃣  測試增量處理（第一次運行）")
        print("-" * 45)
        results = incremental_module.process_incrementally(
            processor_func=example_file_processor,
            extensions=[".py", ".json"],
            batch_size=3
        )
        print(f"✅ 增量處理完成:")
        print(f"   狀態: {results['status']}")
        print(f"   成功處理: {results['results']['successful']} 個文件")
        print(f"   處理失敗: {results['results']['failed']} 個文件")
        
        # 測試5: 修改一些文件
        print("\n5️⃣  修改測試文件")
        print("-" * 45)
        
        # 修改一個Python文件
        py_file = Path(test_dir) / "main.py"
        with open(py_file, 'a', encoding='utf-8') as f:
            f.write("\n# 新增的測試內容\nprint('This is a new line!')\n")
        print(f"✅ 修改文件: {py_file}")
        
        # 創建一個新文件
        new_file = Path(test_dir) / "new_module.py"
        with open(new_file, 'w', encoding='utf-8') as f:
            f.write("# 新創建的模塊\nprint('New module created!')\n")
        print(f"✅ 創建新文件: {new_file}")
        
        # 測試6: 再次檢測變化
        print("\n6️⃣  測試變化檢測（第二次運行）")
        print("-" * 45)
        changes2 = incremental_module.detect_changes([".py", ".json", ".md"])
        print(f"✅ 變化檢測完成:")
        print(f"   新文件: {len(changes2['new_files'])} 個")
        print(f"   修改的文件: {len(changes2['modified_files'])} 個")
        print(f"   未變化的文件: {len(changes2['unchanged_files'])} 個")
        
        # 測試7: 再次增量處理
        print("\n7️⃣  測試增量處理（第二次運行）")
        print("-" * 45)
        results2 = incremental_module.process_incrementally(
            processor_func=example_file_processor,
            extensions=[".py"],
            batch_size=2
        )
        print(f"✅ 增量處理完成:")
        print(f"   狀態: {results2['status']}")
        print(f"   成功處理: {results2['results']['successful']} 個文件")
        print(f"   處理失敗: {results2['results']['failed']} 個文件")
        
        # 測試8: 估計時間節省
        print("\n8️⃣  測試時間節省估計")
        print("-" * 45)
        time_savings = incremental_module.estimate_time_savings(avg_processing_time_per_file=1.0)
        print(f"✅ 時間節省估計:")
        print(f"   跳過未變化文件: {time_savings['unchanged_files_skipped']} 個")
        print(f"   估計節省時間: {time_savings['estimated_time_saved_seconds']:.2f} 秒")
        print(f"   估計節省時間: {time_savings['estimated_time_saved_minutes']:.2f} 分鐘")
        
        # 測試9: 獲取最終摘要
        print("\n9️⃣  測試最終處理摘要")
        print("-" * 45)
        final_summary = incremental_module.get_processing_summary()
        print(f"✅ 最終處理摘要:")
        print(f"   追蹤文件數: {final_summary['file_tracking']['tracked_files']}")
        print(f"   處理歷史次數: {final_summary['processing_history']['total_runs']}")
        print(f"   新文件處理數: {final_summary['statistics']['new_files_processed']}")
        print(f"   修改文件處理數: {final_summary['statistics']['modified_files_processed']}")
        print(f"   跳過文件數: {final_summary['statistics']['unchanged_files_skipped']}")
        
        # 測試10: 清除狀態
        print("\n🔟  測試清除狀態")
        print("-" * 45)
        success = incremental_module.clear_state(confirm=True)
        if success:
            print("✅ 狀態清除成功")
        else:
            print("❌ 狀態清除失敗")
        
        print("\n" + "=" * 70)
        print("🎉 所有測試完成!")
        print("=" * 70)
        
    finally:
        # 清理測試目錄
        print(f"\n🧹 清理測試目錄: {test_dir}")
        shutil.rmtree(test_dir)
        print("✅ 測試目錄已清理")


def test_resume_functionality():
    """測試恢復功能"""
    print("\n" + "=" * 70)
    print("🧪 測試恢復處理功能")
    print("=" * 70)
    
    # 創建測試項目
    test_dir = create_test_project()
    
    try:
        # 初始化模塊
        incremental_module = IncrementalProcessingModule(test_dir)
        
        # 第一次處理
        print("\n1️⃣  第一次處理")
        print("-" * 45)
        results1 = incremental_module.process_incrementally(
            processor_func=example_file_processor,
            extensions=[".py"],
            batch_size=2
        )
        print(f"✅ 第一次處理完成")
        
        # 模擬中斷：手動設置待處理文件
        print("\n2️⃣  模擬處理中斷")
        print("-" * 45)
        incremental_module.state["pending_files"] = ["main.py", "utils.py", "src/module1.py"]
        incremental_module._save_state()
        print(f"✅ 設置了 {len(incremental_module.state['pending_files'])} 個待處理文件")
        
        # 測試恢復處理
        print("\n3️⃣  測試恢復處理")
        print("-" * 45)
        resume_results = incremental_module.resume_processing(
            processor_func=example_file_processor,
            batch_size=2
        )
        print(f"✅ 恢復處理完成:")
        print(f"   狀態: {resume_results.get('status', 'unknown')}")
        
        print("\n" + "=" * 70)
        print("🎉 恢復功能測試完成!")
        print("=" * 70)
        
    finally:
        # 清理測試目錄
        shutil.rmtree(test_dir)
        print("✅ 測試目錄已清理")


def main():
    """主函數"""
    print("🚀 增量處理模塊綜合測試")
    print("=" * 70)
    
    # 測試基本功能
    test_basic_functionality()
    
    # 測試恢復功能
    test_resume_functionality()
    
    print("\n" + "=" * 70)
    print("✅ 所有測試完成!")
    print("=" * 70)


if __name__ == "__main__":
    main()