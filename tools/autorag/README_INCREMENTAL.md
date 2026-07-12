# 增量處理模塊

## 概述

增量處理模塊是一個用於追蹤和處理項目中增量變化的Python模塊。它通過文件哈希值追蹤文件變化，只處理新增或修改的文件，從而大幅提高處理效率。

## 主要功能

### 1. 變化檢測
- 自動檢測項目中的新文件、修改的文件和刪除的文件
- 支持按文件擴展名過濾
- 實時統計變化情況

### 2. 增量處理
- 只處理發生變化的文件
- 支持分批處理（batch processing）
- 自動跳過未變化的文件

### 3. 狀態管理
- 自動保存處理狀態
- 支持斷點續傳
- 完整的處理歷史記錄

### 4. 效率優化
- 估計時間節省
- 處理效率統計
- 資源使用優化

## 安裝和使用

### 基本使用

```python
from modules.incremental_processing_module import IncrementalProcessingModule

# 初始化增量處理模塊
incremental_module = IncrementalProcessingModule("/path/to/your/project")

# 定義處理函數
def my_processor(file_path: str) -> dict:
    """自定義處理函數"""
    # 實現你的處理邏輯
    return {"result": "success", "file": file_path}

# 檢測變化
changes = incremental_module.detect_changes([".py", ".js", ".ts"])

# 增量處理
results = incremental_module.process_incrementally(
    processor_func=my_processor,
    extensions=[".py", ".js"],
    batch_size=10
)
```

### 集成到RAG系統

```python
from modules.incremental_processing_module import IncrementalProcessingModule
from modules.rag_analyzer import ProjectAnalyzer

def rag_file_processor(file_path: str) -> dict:
    """RAG文件處理函數"""
    # 實現RAG相關的處理邏輯
    return {
        "file_path": file_path,
        "analysis_result": {
            "code_quality": 85,
            "security_score": 90,
            "recommendations": []
        }
    }

# 初始化
incremental_module = IncrementalProcessingModule(project_path)

# 執行增量RAG分析
changes = incremental_module.detect_changes([".py", ".js", ".ts", ".json"])
results = incremental_module.process_incrementally(
    processor_func=rag_file_processor,
    extensions=[".py", ".js", ".ts"],
    batch_size=5
)

# 執行RAG分析
analyzer = ProjectAnalyzer(project_path)
analysis_report = analyzer.generate_analysis_report()
```

## API參考

### IncrementalProcessingModule類

#### 初始化
```python
__init__(project_path: str, state_dir: str = ".incremental_state")
```

#### 主要方法

1. **detect_changes(extensions: Optional[List[str]] = None) -> Dict[str, Any]**
   - 檢測項目中的變化
   - `extensions`: 要監控的文件擴展名列表

2. **process_incrementally(processor_func, extensions: Optional[List[str]] = None, batch_size: int = 10) -> Dict[str, Any]**
   - 增量處理項目
   - `processor_func`: 處理函數，接受文件路徑參數
   - `extensions`: 要處理的文件擴展名列表
   - `batch_size`: 每批處理的文件數量

3. **resume_processing(processor_func, batch_size: int = 10) -> Dict[str, Any]**
   - 恢復中斷的處理

4. **get_processing_summary() -> Dict[str, Any]**
   - 獲取處理摘要

5. **clear_state(confirm: bool = False) -> bool**
   - 清除處理狀態

6. **estimate_time_savings(avg_processing_time_per_file: float = 0.5) -> Dict[str, Any]**
   - 估計增量處理節省的時間

## 使用示例

### 示例1：基本使用
```python
from modules.incremental_processing_module import IncrementalProcessingModule, example_file_processor

# 初始化
module = IncrementalProcessingModule("/path/to/project")

# 檢測變化
changes = module.detect_changes([".py", ".js", ".ts"])
print(f"新文件: {len(changes['new_files'])}")
print(f"修改的文件: {len(changes['modified_files'])}")

# 增量處理
results = module.process_incrementally(
    processor_func=example_file_processor,
    extensions=[".py", ".js"],
    batch_size=5
)

# 查看結果
print(f"成功處理: {results['results']['successful']} 個文件")
print(f"跳過處理: {len(changes['unchanged_files'])} 個未變化文件")
```

### 示例2：自定義處理函數
```python
def custom_processor(file_path: str) -> dict:
    """自定義文件處理函數"""
    from pathlib import Path
    import datetime
    
    path = Path(file_path)
    
    # 實現你的處理邏輯
    result = {
        "file_path": str(path),
        "file_size": path.stat().st_size,
        "processed_at": datetime.datetime.now().isoformat(),
        "custom_analysis": {
            "lines": count_lines(file_path),
            "complexity": calculate_complexity(file_path),
            "issues": find_issues(file_path)
        }
    }
    
    return result

# 使用自定義處理函數
module = IncrementalProcessingModule("/path/to/project")
results = module.process_incrementally(
    processor_func=custom_processor,
    extensions=[".py"],
    batch_size=3
)
```

### 示例3：集成到CI/CD流程
```python
import sys
from modules.incremental_processing_module import IncrementalProcessingModule

def ci_processor(file_path: str) -> dict:
    """CI/CD處理函數"""
    # 執行代碼檢查
    # 運行測試
    # 生成文檔
    # ...
    return {"status": "success", "checks_passed": True}

def main():
    project_path = sys.argv[1] if len(sys.argv) > 1 else "."
    
    module = IncrementalProcessingModule(project_path)
    
    # 只處理Python文件
    changes = module.detect_changes([".py"])
    
    if changes["new_files"] or changes["modified_files"]:
        print(f"檢測到 {len(changes['new_files'] + changes['modified_files'])} 個文件需要處理")
        
        results = module.process_incrementally(
            processor_func=ci_processor,
            extensions=[".py"],
            batch_size=5
        )
        
        if results["results"]["failed"] > 0:
            print(f"❌ {results['results']['failed']} 個文件處理失敗")
            sys.exit(1)
        else:
            print("✅ 所有文件處理成功")
            sys.exit(0)
    else:
        print("✅ 沒有需要處理的文件")
        sys.exit(0)

if __name__ == "__main__":
    main()
```

## 性能優勢

### 時間節省
假設一個項目有1000個文件，其中：
- 50個新文件
- 30個修改的文件
- 920個未變化的文件

如果每個文件平均處理時間為0.5秒：
- **全量處理**: 1000 × 0.5 = 500秒 ≈ 8.3分鐘
- **增量處理**: 80 × 0.5 = 40秒 ≈ 0.7分鐘
- **時間節省**: 460秒 ≈ 7.6分鐘（節省92%的時間）

### 資源節省
- 減少CPU使用
- 減少內存佔用
- 減少磁盤I/O
- 減少網絡傳輸（如果涉及）

## 最佳實踐

### 1. 選擇合適的批處理大小
- 小項目：batch_size = 5-10
- 中項目：batch_size = 10-20
- 大項目：batch_size = 20-50

### 2. 合理設置文件擴展名
```python
# 代碼文件
code_extensions = [".py", ".js", ".ts", ".java", ".go", ".cpp", ".c"]

# 配置文件
config_extensions = [".json", ".yaml", ".yml", ".toml", ".ini"]

# 文檔文件
doc_extensions = [".md", ".txt", ".rst", ".adoc"]

# 根據需要組合
all_extensions = code_extensions + config_extensions
```

### 3. 錯誤處理
```python
try:
    results = module.process_incrementally(
        processor_func=my_processor,
        extensions=[".py"],
        batch_size=10
    )
    
    if results["results"]["failed"] > 0:
        print("處理失敗的文件:")
        for error in results["errors"]:
            print(f"  - {error['file']}: {error['error']}")
            
except Exception as e:
    print(f"增量處理失敗: {e}")
    # 可以選擇恢復處理
    module.resume_processing(my_processor)
```

### 4. 狀態管理
```python
# 定期清理舊狀態
if module.get_processing_summary()["processing_history"]["total_runs"] > 100:
    module.clear_state(confirm=True)

# 備份狀態文件
import shutil
shutil.copytree(module.state_dir, f"{module.state_dir}_backup")
```

## 故障排除

### 常見問題

1. **文件哈希計算失敗**
   - 檢查文件權限
   - 確保文件存在且可讀
   - 檢查文件是否為二進制文件

2. **狀態文件損壞**
   - 使用`clear_state(confirm=True)`清除狀態
   - 手動刪除`.incremental_state`目錄

3. **處理函數異常**
   - 在處理函數中添加異常處理
   - 使用try-catch包裝處理邏輯
   - 記錄詳細錯誤信息

4. **性能問題**
   - 減少監控的文件類型
   - 增加批處理大小
   - 優化處理函數邏輯

### 調試技巧

```python
# 啟用詳細日誌
import logging
logging.basicConfig(level=logging.DEBUG)

# 檢查狀態
summary = module.get_processing_summary()
print(json.dumps(summary, indent=2))

# 手動計算文件哈希
hash_value = module._calculate_file_hash(Path("/path/to/file"))
print(f"文件哈希: {hash_value}")
```

## 擴展功能

### 自定義狀態存儲
```python
class CustomIncrementalModule(IncrementalProcessingModule):
    def _save_state(self):
        # 自定義狀態保存邏輯
        # 例如：保存到數據庫、雲存儲等
        pass
    
    def _load_state(self):
        # 自定義狀態加載邏輯
        pass
```

### 分布式處理
```python
class DistributedIncrementalModule(IncrementalProcessingModule):
    def process_incrementally(self, processor_func, extensions=None, batch_size=10):
        # 實現分布式處理邏輯
        # 例如：使用Redis隊列、Celery任務等
        pass
```

### 實時監控
```python
class MonitoringIncrementalModule(IncrementalProcessingModule):
    def process_incrementally(self, processor_func, extensions=None, batch_size=10):
        # 添加監控指標
        start_time = time.time()
        
        results = super().process_incrementally(
            processor_func, extensions, batch_size
        )
        
        end_time = time.time()
        duration = end_time - start_time
        
        # 發送監控數據
        send_metrics({
            "duration": duration,
            "files_processed": results["results"]["successful"],
            "files_skipped": len(results["changes"]["unchanged_files"])
        })
        
        return results
```

## 版本歷史

### v1.0.0 (2024-01-24)
- 初始版本發布
- 基本增量處理功能
- 狀態管理和斷點續傳
- 時間節省估計

## 貢獻指南

歡迎貢獻代碼、報告問題或提出建議！

1. Fork項目
2. 創建功能分支
3. 提交更改
4. 推送到分支
5. 創建Pull Request

## 許可證

MIT License