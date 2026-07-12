#!/usr/bin/env python3
"""
增量處理模塊
負責追蹤和處理項目中的增量變化
支持斷點續傳和狀態管理
"""

import os
import json
import hashlib
import pickle
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
import shutil


class IncrementalProcessingModule:
    """增量處理模塊"""
    
    def __init__(self, project_path: str, state_dir: str = ".incremental_state"):
        """
        初始化增量處理模塊
        
        Args:
            project_path: 項目路徑
            state_dir: 狀態文件存儲目錄
        """
        self.project_path = Path(project_path)
        self.state_dir = self.project_path / state_dir
        self.state_dir.mkdir(parents=True, exist_ok=True)
        
        # 狀態文件路徑
        self.state_file = self.state_dir / "processing_state.pkl"
        self.file_hashes_file = self.state_dir / "file_hashes.json"
        self.processing_history_file = self.state_dir / "processing_history.json"
        
        # 加載狀態
        self.state = self._load_state()
        self.file_hashes = self._load_file_hashes()
        self.processing_history = self._load_processing_history()
        
        # 統計信息
        self.stats = {
            "total_files_processed": 0,
            "new_files_processed": 0,
            "modified_files_processed": 0,
            "unchanged_files_skipped": 0,
            "processing_time_saved": 0.0
        }
    
    def _load_state(self) -> Dict[str, Any]:
        """加載處理狀態"""
        if self.state_file.exists():
            try:
                with open(self.state_file, 'rb') as f:
                    return pickle.load(f)
            except Exception as e:
                print(f"⚠️  無法加載狀態文件: {e}")
        
        # 默認狀態
        return {
            "last_processed_time": None,
            "current_phase": None,
            "completed_phases": [],
            "pending_files": [],
            "processed_files": [],
            "errors": []
        }
    
    def _save_state(self):
        """保存處理狀態"""
        try:
            with open(self.state_file, 'wb') as f:
                pickle.dump(self.state, f)
        except Exception as e:
            print(f"⚠️  無法保存狀態文件: {e}")
    
    def _load_file_hashes(self) -> Dict[str, str]:
        """加載文件哈希值"""
        if self.file_hashes_file.exists():
            try:
                with open(self.file_hashes_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"⚠️  無法加載文件哈希: {e}")
        
        return {}
    
    def _save_file_hashes(self):
        """保存文件哈希值"""
        try:
            with open(self.file_hashes_file, 'w', encoding='utf-8') as f:
                json.dump(self.file_hashes, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"⚠️  無法保存文件哈希: {e}")
    
    def _load_processing_history(self) -> List[Dict[str, Any]]:
        """加載處理歷史"""
        if self.processing_history_file.exists():
            try:
                with open(self.processing_history_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"⚠️  無法加載處理歷史: {e}")
        
        return []
    
    def _save_processing_history(self):
        """保存處理歷史"""
        try:
            with open(self.processing_history_file, 'w', encoding='utf-8') as f:
                json.dump(self.processing_history, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"⚠️  無法保存處理歷史: {e}")
    
    def _calculate_file_hash(self, file_path: Path) -> str:
        """計算文件哈希值"""
        try:
            with open(file_path, 'rb') as f:
                file_content = f.read()
                return hashlib.md5(file_content).hexdigest()
        except Exception as e:
            print(f"⚠️  無法計算文件哈希 {file_path}: {e}")
            return ""
    
    def _get_all_project_files(self, extensions: Optional[List[str]] = None) -> List[Path]:
        """獲取項目中所有文件"""
        files = []
        
        for root, dirs, filenames in os.walk(self.project_path):
            # 跳過狀態目錄
            if self.state_dir in Path(root).parents:
                continue
            
            for filename in filenames:
                file_path = Path(root) / filename
                
                # 過濾擴展名
                if extensions:
                    if file_path.suffix.lower() not in extensions:
                        continue
                
                files.append(file_path)
        
        return files
    def detect_changes(self, extensions: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        檢測項目中的變化
        
        Args:
            extensions: 要監控的文件擴展名列表
            
        Returns:
            變化檢測結果
        """
        print("🔍 檢測項目變化...")
        
        current_files = self._get_all_project_files(extensions)
        changes = {
            "new_files": [],
            "modified_files": [],
            "deleted_files": [],
            "unchanged_files": []
        }
        
        # 計算當前文件哈希
        current_hashes = {}
        for file_path in current_files:
            rel_path = str(file_path.relative_to(self.project_path))
            file_hash = self._calculate_file_hash(file_path)
            if file_hash:
                current_hashes[rel_path] = file_hash
        
        # 檢測新文件和修改的文件
        for rel_path, current_hash in current_hashes.items():
            old_hash = self.file_hashes.get(rel_path)
            
            if old_hash is None:
                changes["new_files"].append(rel_path)
            elif old_hash != current_hash:
                changes["modified_files"].append(rel_path)
            else:
                changes["unchanged_files"].append(rel_path)
        
        # 檢測刪除的文件
        for rel_path in self.file_hashes.keys():
            if rel_path not in current_hashes:
                changes["deleted_files"].append(rel_path)
        
        # 更新統計
        self.stats["total_files_processed"] = len(current_files)
        
        print(f"✅ 變化檢測完成:")
        print(f"   新文件: {len(changes['new_files'])} 個")
        print(f"   修改的文件: {len(changes['modified_files'])} 個")
        print(f"   刪除的文件: {len(changes['deleted_files'])} 個")
        print(f"   未變化的文件: {len(changes['unchanged_files'])} 個")
        
        return changes
    
    def process_incrementally(self, 
                             processor_func, 
                             extensions: Optional[List[str]] = None,
                             batch_size: int = 10) -> Dict[str, Any]:
        """
        增量處理項目
        
        Args:
            processor_func: 處理函數，接受文件路徑參數
            extensions: 要處理的文件擴展名列表
            batch_size: 每批處理的文件數量
            
        Returns:
            處理結果
        """
        print("🔄 開始增量處理...")
        
        # 檢測變化
        changes = self.detect_changes(extensions)
        
        # 準備要處理的文件
        files_to_process = changes["new_files"] + changes["modified_files"]
        
        if not files_to_process:
            print("✅ 沒有需要處理的文件，跳過處理")
            return {
                "status": "skipped",
                "reason": "no_changes",
                "changes": changes
            }
        
        print(f"📋 需要處理 {len(files_to_process)} 個文件")
        
        # 分批處理
        results = {
            "processed_files": [],
            "successful": 0,
            "failed": 0,
            "errors": [],
            "batch_results": []
        }
        
        for i in range(0, len(files_to_process), batch_size):
            batch = files_to_process[i:i + batch_size]
            batch_num = i // batch_size + 1
            total_batches = (len(files_to_process) + batch_size - 1) // batch_size
            
            print(f"\n📦 處理批次 {batch_num}/{total_batches} ({len(batch)} 個文件)")
            
            batch_result = {
                "batch_number": batch_num,
                "files": [],
                "successful": 0,
                "failed": 0
            }
            
            for rel_path in batch:
                file_path = self.project_path / rel_path
                
                try:
                    print(f"  📄 處理: {rel_path}")
                    
                    # 調用處理函數
                    file_result = processor_func(str(file_path))
                    
                    # 更新文件哈希
                    self.file_hashes[rel_path] = self._calculate_file_hash(file_path)
                    
                    batch_result["files"].append({
                        "path": rel_path,
                        "status": "success",
                        "result": file_result
                    })
                    batch_result["successful"] += 1
                    
                    # 更新統計
                    if rel_path in changes["new_files"]:
                        self.stats["new_files_processed"] += 1
                    else:
                        self.stats["modified_files_processed"] += 1
                    
                except Exception as e:
                    print(f"  ❌ 處理失敗 {rel_path}: {e}")
                    
                    batch_result["files"].append({
                        "path": rel_path,
                        "status": "failed",
                        "error": str(e)
                    })
                    batch_result["failed"] += 1
                    
                    results["errors"].append({
                        "file": rel_path,
                        "error": str(e)
                    })
            
            results["batch_results"].append(batch_result)
            results["successful"] += batch_result["successful"]
            results["failed"] += batch_result["failed"]
            
            # 保存狀態（斷點續傳）
            self._save_state()
            self._save_file_hashes()
        
        # 更新處理歷史
        history_entry = {
            "timestamp": datetime.now().isoformat(),
            "changes_detected": {
                "new_files": len(changes["new_files"]),
                "modified_files": len(changes["modified_files"]),
                "deleted_files": len(changes["deleted_files"])
            },
            "processing_results": {
                "total_processed": len(files_to_process),
                "successful": results["successful"],
                "failed": results["failed"]
            },
            "stats": self.stats.copy()
        }
        
        self.processing_history.append(history_entry)
        
        # 保存所有狀態
        self._save_state()
        self._save_file_hashes()
        self._save_processing_history()
        
        # 更新最後處理時間
        self.state["last_processed_time"] = datetime.now().isoformat()
        
        print(f"\n✅ 增量處理完成:")
        print(f"   成功處理: {results['successful']} 個文件")
        print(f"   處理失敗: {results['failed']} 個文件")
        print(f"   跳過處理: {len(changes['unchanged_files'])} 個未變化文件")
        
        return {
            "status": "completed",
            "results": results,
            "changes": changes,
            "stats": self.stats
        }
    def resume_processing(self, processor_func, batch_size: int = 10) -> Dict[str, Any]:
        """
        恢復中斷的處理
        
        Args:
            processor_func: 處理函數
            batch_size: 每批處理的文件數量
            
        Returns:
            恢復處理結果
        """
        print("🔄 恢復中斷的處理...")
        
        if not self.state.get("pending_files"):
            print("✅ 沒有待處理的文件")
            return {
                "status": "no_pending_files",
                "message": "沒有待處理的文件"
            }
        
        pending_files = self.state["pending_files"]
        print(f"📋 恢復 {len(pending_files)} 個待處理文件")
        
        results = self.process_incrementally(
            processor_func=processor_func,
            batch_size=batch_size
        )
        
        # 清空待處理文件列表
        self.state["pending_files"] = []
        self._save_state()
        
        return results
    
    def get_processing_summary(self) -> Dict[str, Any]:
        """獲取處理摘要"""
        return {
            "project_info": {
                "path": str(self.project_path),
                "state_directory": str(self.state_dir)
            },
            "current_state": self.state,
            "file_tracking": {
                "tracked_files": len(self.file_hashes),
                "last_updated": self.state.get("last_processed_time")
            },
            "processing_history": {
                "total_runs": len(self.processing_history),
                "last_run": self.processing_history[-1] if self.processing_history else None
            },
            "statistics": self.stats
        }
    
    def clear_state(self, confirm: bool = False) -> bool:
        """
        清除處理狀態
        
        Args:
            confirm: 確認清除
            
        Returns:
            是否成功清除
        """
        if not confirm:
            print("⚠️  請設置 confirm=True 來確認清除狀態")
            return False
        
        try:
            # 刪除狀態目錄
            if self.state_dir.exists():
                shutil.rmtree(self.state_dir)
                print(f"✅ 已清除狀態目錄: {self.state_dir}")
            
            # 重置狀態
            self.state_dir.mkdir(parents=True, exist_ok=True)
            self.state = self._load_state()
            self.file_hashes = self._load_file_hashes()
            self.processing_history = self._load_processing_history()
            self.stats = {
                "total_files_processed": 0,
                "new_files_processed": 0,
                "modified_files_processed": 0,
                "unchanged_files_skipped": 0,
                "processing_time_saved": 0.0
            }
            
            return True
            
        except Exception as e:
            print(f"❌ 清除狀態失敗: {e}")
            return False
    
    def estimate_time_savings(self, avg_processing_time_per_file: float = 0.5) -> Dict[str, Any]:
        """
        估計增量處理節省的時間
        
        Args:
            avg_processing_time_per_file: 平均每個文件的處理時間（秒）
            
        Returns:
            時間節省估計
        """
        unchanged_files = self.stats["unchanged_files_skipped"]
        time_saved = unchanged_files * avg_processing_time_per_file
        
        self.stats["processing_time_saved"] = time_saved
        
        return {
            "unchanged_files_skipped": unchanged_files,
            "avg_processing_time_per_file": avg_processing_time_per_file,
            "estimated_time_saved_seconds": time_saved,
            "estimated_time_saved_minutes": time_saved / 60,
            "estimated_time_saved_hours": time_saved / 3600
        }

# 示例處理函數
def example_file_processor(file_path: str) -> Dict[str, Any]:
    """
    示例文件處理函數
    
    Args:
        file_path: 文件路徑
        
    Returns:
        處理結果
    """
    path = Path(file_path)
    
    # 這裡可以實現具體的處理邏輯
    # 例如：代碼分析、文檔生成、質量檢查等
    
    result = {
        "file_path": str(path),
        "file_size": path.stat().st_size if path.exists() else 0,
        "file_type": path.suffix,
        "processed_at": datetime.now().isoformat(),
        "analysis_result": {
            "lines_of_code": 0,
            "complexity_score": 0,
            "issues_found": []
        }
    }
    
    return result


def main():
    """主函數 - 測試增量處理模塊"""
    import sys
    
    if len(sys.argv) < 2:
        print("用法: python incremental_processing_module.py <項目路徑>")
        print("示例: python incremental_processing_module.py /path/to/your/project")
        sys.exit(1)
    
    project_path = sys.argv[1]
    
    if not os.path.exists(project_path):
        print(f"錯誤: 項目路徑不存在: {project_path}")
        sys.exit(1)
    
    print("=" * 70)
    print("🚀 增量處理模塊測試")
    print("=" * 70)
    
    # 創建增量處理模塊
    incremental_module = IncrementalProcessingModule(project_path)
    
    # 獲取處理摘要
    print("\n📊 當前處理摘要:")
    summary = incremental_module.get_processing_summary()
    print(f"   項目路徑: {summary['project_info']['path']}")
    print(f"   追蹤文件數: {summary['file_tracking']['tracked_files']}")
    print(f"   處理歷史次數: {summary['processing_history']['total_runs']}")
    
    # 檢測變化
    print("\n🔍 檢測項目變化:")
    changes = incremental_module.detect_changes([".py", ".js", ".ts", ".java", ".go"])
    
    # 執行增量處理
    print("\n🔄 執行增量處理:")
    results = incremental_module.process_incrementally(
        processor_func=example_file_processor,
        extensions=[".py", ".js", ".ts"],
        batch_size=5
    )
    
    # 顯示結果
    print("\n📈 處理結果:")
    print(f"   狀態: {results['status']}")
    print(f"   成功處理: {results['results']['successful']} 個文件")
    print(f"   處理失敗: {results['results']['failed']} 個文件")
    
    # 估計時間節省
    print("\n⏱️  時間節省估計:")
    time_savings = incremental_module.estimate_time_savings()
    print(f"   跳過未變化文件: {time_savings['unchanged_files_skipped']} 個")
    print(f"   估計節省時間: {time_savings['estimated_time_saved_minutes']:.2f} 分鐘")
    
    print("\n" + "=" * 70)
    print("✅ 增量處理模塊測試完成")
    print("=" * 70)


if __name__ == "__main__":
    main()
