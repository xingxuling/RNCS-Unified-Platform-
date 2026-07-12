# 增強版 RAG 自動化系統

## 概述

增強版 RAG 自動化系統是一個智能項目分析和優化工具，具備自動判斷、學習、執行和修復能力。系統通過六個階段對項目進行全面分析、處理和優化。

## 系統架構

### 核心模塊

1. **RAG 分析模塊** (`rag_analyzer.py`)
   - 項目結構分析
   - 代碼質量評估
   - 權限管理分析
   - 構建自動化檢查

2. **處理模塊** (`processing_module_simple.py`)
   - 數據清理和標準化
   - 代碼質量處理
   - 結構優化處理

3. **高級學習模塊** (`advanced_learning_module.py`)
   - 自動判斷項目狀態
   - 深度學習項目模式
   - 智能執行改進
   - 自動修復問題
   - 驗證和學習

4. **基礎學習模塊** (`learning_module.py`)
   - 項目結構學習
   - 代碼模式提取
   - 最佳實踐應用

5. **判斷引擎** (`decision_engine.py`)
   - 優先級評估
   - 迭代重點確定
   - 實施計劃生成

6. **自動打包模塊** (`auto_packager.py`)
   - 項目優化
   - 打包創建
   - 報告生成

## 安裝和運行

### 環境要求
- Python 3.8+
- 項目目錄讀寫權限

### 快速開始

```bash
# 克隆或下載項目
cd /path/to/auto-rag-system

# 運行增強版系統
python3 main_enhanced.py /path/to/your/project
```

### 測試系統

```bash
# 運行完整測試
python3 test_enhanced_system.py

# 測試特定模塊
python3 modules/processing_module_simple.py /path/to/test/project
python3 modules/advanced_learning_module.py /path/to/test/project
```

## 使用示例

### 1. 完整分析流程

```bash
python3 main_enhanced.py ~/projects/my-react-app
```

系統將執行以下六個階段：

```
🚀 啟動增強版 RAG 自動化系統
================================================

1️⃣  RAG 分析階段
----------------------------------------
🔍 執行 RAG 分析...
✅ 分析完成: 總體分數: 75.0/100

2️⃣  數據處理階段
----------------------------------------
⚙️  執行數據處理...
✅ 處理完成: 質量分數: 70/100

3️⃣  智能學習階段
----------------------------------------
🧠 執行智能學習...
✅ 學習完成: 總改進: 4 個

4️⃣  判斷決策階段
----------------------------------------
⚖️  執行增強版判斷決策...
✅ 決策完成: 是否繼續: ✅ 是

5️⃣  自動化打包階段
----------------------------------------
📦 執行增強版自動化打包...
✅ 打包完成: 優化項目完成

6️⃣  生成最終報告
----------------------------------------
📄 生成增強版最終報告...
✅ 最終報告已生成
```

### 2. 單獨使用學習模塊

```bash
# 使用高級學習模塊
python3 modules/advanced_learning_module.py ~/projects/my-project

# 使用基礎學習模塊
python3 modules/learning_module.py ~/projects/my-project
```

## 輸出文件

系統運行後會生成以下文件：

### 1. 輸出目錄 (`output/<timestamp>/`)
- `analysis_report.json` - RAG 分析報告
- `processed_data.json` - 數據處理結果
- `learning_results.json` - 學習結果
- `enhanced_decisions.json` - 增強版決策
- `enhanced_final_report.json` - 最終報告

### 2. 項目目錄
- `processing_report.json` - 處理報告
- `learning_results_*.json` - 學習結果
- `learned_knowledge.json` - 學習到的知識

### 3. 桌面文件
- `增強版_RAG_系統結果_<timestamp>.txt` - 桌面摘要
- `enhanced_packaging_report.json` - 增強版打包報告
- `<project>_optimized_<timestamp>.tar.gz` - 優化後的項目包

## 功能特性

### 自動判斷能力
- 項目類型檢測 (React, Vue, Angular, Python, Go, Java)
- 技術棧分析
- 成熟度評估 (initial, intermediate, advanced)
- 關鍵問題檢測

### 智能學習能力
- 組件模式學習
- API 模式學習
- 狀態管理模式學習
- 樣式模式學習

### 自動修復能力
- 安全問題修復
- 性能問題優化
- 代碼質量改進
- 依賴問題處理

### 優化建議
- 項目結構優化
- 配置文件添加
- 最佳實踐應用
- 持續改進建議

## 配置選項

### 處理模塊配置
可以在 `processing_module_simple.py` 中修改：
- 標準目錄列表
- 配置文件模板
- 優化優先級

### 學習模塊配置
可以在 `advanced_learning_module.py` 中修改：
- 知識庫內容
- 學習參數
- 修復策略

## 故障排除

### 常見問題

1. **模塊導入錯誤**
   ```
   ModuleNotFoundError: No module named 'rag_analyzer'
   ```
   解決方案：確保在項目根目錄運行，或添加正確的 Python 路徑。

2. **權限錯誤**
   ```
   PermissionError: [Errno 13] Permission denied
   ```
   解決方案：確保對項目目錄有讀寫權限。

3. **語法錯誤**
   ```
   SyntaxError: invalid syntax
   ```
   解決方案：確保使用 Python 3.8+，檢查代碼語法。

### 調試模式

可以修改模塊中的打印語句來啟用詳細輸出：

```python
# 在模塊中添加調試輸出
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 擴展開發

### 添加新模塊

1. 在 `modules/` 目錄創建新模塊
2. 實現核心功能類
3. 在 `main_enhanced.py` 中導入並集成
4. 更新測試腳本

### 自定義分析規則

修改 `rag_analyzer.py` 中的分析規則：
- 添加新的檢查項目
- 調整評分標準
- 自定義建議生成

### 擴展學習能力

修改 `advanced_learning_module.py`：
- 添加新的模式識別
- 擴展修復策略
- 增強知識庫

## 性能優化

### 大型項目處理
對於大型項目，可以：
1. 限制分析文件數量
2. 啟用緩存機制
3. 並行處理

### 內存管理
- 使用生成器處理大文件
- 及時釋放資源
- 分批處理數據

## 貢獻指南

1. Fork 項目
2. 創建功能分支
3. 提交更改
4. 創建 Pull Request

## 許可證

MIT License

## 支持

如有問題或建議，請：
1. 查看文檔
2. 運行測試
3. 提交 Issue
4. 聯繫維護者

---

**增強版 RAG 自動化系統** - 讓項目分析和優化變得智能而簡單！