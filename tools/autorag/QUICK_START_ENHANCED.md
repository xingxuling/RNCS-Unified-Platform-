# RAG 增強版系統快速開始

## 問題修復
已修復 `ModuleNotFoundError: No module named 'rag_analyzer'` 錯誤。

## 使用方法

### 方法1: 使用修復版腳本 (推薦)
```bash
# 在 auto-rag-system 目錄中
cd auto-rag-system
python3 run_enhanced_fixed.py /path/to/project

# 或直接從任何位置
python3 /path/to/auto-rag-system/run_enhanced_fixed.py /path/to/project
```

### 方法2: 使用增強版啟動器
```bash
# 設置環境變量
export PYTHONIOENCODING=utf-8

# 運行啟動器
python3 rag_enhanced_launcher.py /path/to/project
```

### 方法3: 直接運行 main_enhanced.py
```bash
# 必須在 auto-rag-system 目錄中
cd auto-rag-system
python3 main_enhanced.py /path/to/project
```

## 修復原理
1. **路徑問題**: 腳本必須在 `auto-rag-system` 目錄中執行，或正確設置模塊路徑
2. **導入順序**: 在導入模塊前，必須先將 `modules` 目錄添加到 `sys.path`
3. **編碼設置**: 確保使用 UTF-8 編碼處理中文字符

## 測試命令
```bash
# 測試導入
cd auto-rag-system
python3 -c "from rag_analyzer import ProjectAnalyzer; print('✅ 導入成功')"

# 測試增強版
python3 run_enhanced_fixed.py --help
```

## 文件說明
- `run_enhanced_fixed.py` - 修復執行路徑的增強版運行腳本
- `rag_enhanced_launcher.py` - 增強版啟動器
- `main_enhanced.py` - 原始增強版主程序
- `modules/` - 所有功能模塊目錄

## 故障排除
如果仍有導入錯誤：
1. 確保在 `auto-rag-system` 目錄中執行
2. 檢查 `modules/` 目錄是否存在且包含所需文件
3. 運行 `python3 -c "import sys; print(sys.path)"` 檢查路徑
4. 使用 `run_enhanced_fixed.py` 而不是直接運行 `main_enhanced.py`
