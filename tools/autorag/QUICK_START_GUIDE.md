# 快速開始指南：同步監測與通用RAG人工智能系統

## 🚀 一分鐘快速開始

### 步驟1：啟動系統
```bash
cd /mnt/c/Users/User/auto-rag-system
python3 run_monitoring_system.py
```

### 步驟2：開始開發
在監測目錄中進行開發：
- `~/projects` - 個人項目
- `~/workspace` - 工作空間
- 當前目錄

### 步驟3：查看結果
系統會自動：
1. 監測文件變化
2. 觸發RAG分析
3. 顯示優化建議

## 📋 系統功能

### 核心功能
- ✅ **實時監測**：同步監測電腦內的開發活動
- ✅ **智能分析**：自動觸發RAG人工智能分析
- ✅ **自動化工作流**：從監測到分析的完整流程
- ✅ **多領域支持**：Web應用、移動應用、API服務等
- ✅ **目標驅動**：根據設定的目標進行優化

### 監測內容
- 📁 **文件變化**：代碼文件的創建、修改、刪除
- 🔄 **進程活動**：開發相關進程的啟動和停止
- 💻 **開發活動**：編輯器、終端、Git操作
- 📊 **系統資源**：CPU、內存、磁盤使用情況

### 分析能力
- 🧠 **項目結構分析**：評估項目組織和架構
- 📊 **代碼質量評估**：檢查代碼規範和最佳實踐
- 🌐 **領域檢測**：識別項目所屬領域
- 🎯 **目標驅動優化**：根據目標提供針對性建議
- 💡 **智能建議**：生成具體的優化建議

## 🛠️ 安裝和配置

### 環境要求
- Python 3.8+
- 無需額外依賴（使用標準庫）

### 目錄設置
系統默認監測以下目錄：
```bash
# 創建監測目錄（如果不存在）
mkdir -p ~/projects ~/workspace
```

### 配置文件
創建 `monitoring_config.json` 自定義配置：
```json
{
  "monitoring": {
    "interval_seconds": 5,
    "watch_directories": [
      "~/projects/my-app",
      "~/workspace/important-project"
    ],
    "exclude_patterns": [
      "node_modules",
      ".git",
      "__pycache__"
    ]
  },
  "rag_integration": {
    "enabled": true,
    "auto_trigger_threshold": 3
  }
}
```

## 📖 使用示例

### 示例1：監測單個項目
```bash
# 監測特定項目
python3 run_monitoring_system.py --watch-dirs ~/projects/my-web-app
```

### 示例2：禁用自動分析
```bash
# 只監測，不自動分析
python3 run_monitoring_system.py --no-rag
```

### 示例3：測試模式
```bash
# 運行10秒測試
python3 run_monitoring_system.py --test
```

### 示例4：使用自定義配置
```bash
# 使用配置文件
python3 run_monitoring_system.py --config my_config.json
```

## 🔧 工作流程

### 正常開發流程
```
1. 開發者修改代碼文件
2. 系統檢測到文件變化
3. 達到觸發閾值（默認3個文件）
4. 自動運行RAG分析
5. 顯示分析結果和建議
6. 開發者根據建議優化代碼
```

### 分析觸發條件
- **文件數量**：短時間內≥3個文件變化
- **時間間隔**：至少60秒冷卻時間
- **手動觸發**：隨時可以手動運行分析

## 📊 分析結果解讀

### 總體分數（0-100分）
- **90+**：優秀 - 生產就緒
- **70-89**：良好 - 需要少量優化
- **50-69**：一般 - 需要中等優化
- **30-49**：較差 - 需要重大改進
- **<30**：很差 - 需要重構

### 成熟度等級
- **beginner**：初學者級別
- **basic**：基礎級別
- **intermediate**：中級級別
- **advanced**：高級級別

### 建議優先級
- **高優先級**：立即處理的關鍵問題
- **中優先級**：計劃處理的重要問題
- **低優先級**：可選處理的改進建議

## 🎯 使用場景

### 場景1：個人項目開發
```bash
# 在個人項目開發中使用
cd ~/projects/my-project
python3 /path/to/auto-rag-system/run_monitoring_system.py

# 系統會：
# 1. 監測你的代碼變化
# 2. 提供實時質量反饋
# 3. 幫助你保持代碼質量
```

### 場景2：團隊代碼審查
```bash
# 在代碼審查前運行分析
python3 run_monitoring_system.py --watch-dirs ~/team/project-to-review

# 生成：
# - 代碼質量報告
# - 潛在問題列表
# - 優化建議
```

### 場景3：學習和教學
```bash
# 學習最佳實踐
python3 run_monitoring_system.py --watch-dirs ~/learning/projects

# 系統會：
# 1. 指出代碼中的問題
# 2. 提供改進建議
# 3. 幫助學習最佳實踐
```

## ⚡ 性能優化

### 減少資源占用
```json
{
  "monitoring": {
    "interval_seconds": 10,  // 增加掃描間隔
    "max_file_size_mb": 5    // 限制文件大小
  }
}
```

### 排除不需要的目錄
```json
{
  "monitoring": {
    "exclude_patterns": [
      "node_modules",
      ".git",
      "__pycache__",
      ".venv",
      "dist",
      "build",
      "*.log",
      "*.tmp"
    ]
  }
}
```

## 🔍 故障排除

### 常見問題

#### 問題1：監測不到文件變化
**解決方案**：
```bash
# 檢查目錄權限
ls -la ~/projects

# 調整配置文件
"monitor_file_types": [".py", ".js", ".ts", ".txt", ".md", ".json"]
```

#### 問題2：RAG分析失敗
**解決方案**：
```bash
# 檢查RAG系統
ls -la main.py

# 手動測試
python3 main.py ~/projects/test-project
```

#### 問題3：系統占用資源過高
**解決方案**：
```json
{
  "monitoring": {
    "interval_seconds": 15,
    "max_file_size_mb": 2
  }
}
```

### 調試模式
```bash
# 啟用詳細輸出
python3 run_monitoring_system.py --debug

# 查看日誌
tail -f monitoring.log
```

## 📈 高級功能

### 自定義監測規則
```python
# 創建自定義監測器
class CustomMonitor:
    def monitor(self):
        # 實現自定義監測邏輯
        pass
```

### 擴展分析模塊
```python
# 添加新的分析類型
class CustomAnalyzer:
    def analyze(self, project_path):
        # 實現自定義分析
        return {"score": 85, "recommendations": []}
```

### 集成到工作流
```bash
# 作為Git鉤子
ln -s /path/to/run_monitoring_system.py .git/hooks/post-commit

# 作為CI/CD步驟
# 在CI腳本中添加：
python3 /path/to/run_monitoring_system.py --test
```

## 📞 支持和幫助

### 獲取幫助
1. **查看文檔**：閱讀 `INTEGRATED_SYSTEM.md`
2. **運行測試**：`python3 test_integrated_system.py`
3. **檢查日誌**：查看 `monitoring.log`
4. **調試模式**：使用 `--debug` 參數

### 報告問題
遇到問題時，請提供：
1. 操作系統和Python版本
2. 配置文件內容
3. 錯誤信息和日誌
4. 重現步驟

## 🎉 開始使用

### 立即開始
```bash
# 克隆或下載項目
cd /mnt/c/Users/User/auto-rag-system

# 運行測試
python3 test_integrated_system.py

# 啟動系統
python3 run_monitoring_system.py
```

### 下一步
1. **熟悉系統**：運行測試了解功能
2. **配置監測**：設置監測目錄和規則
3. **開始開發**：在監測目錄中進行開發
4. **查看結果**：關注分析結果和建議
5. **優化代碼**：根據建議改進代碼質量

## 📚 相關文檔

- `INTEGRATED_SYSTEM.md` - 完整系統文檔
- `SYSTEM_MONITORING_ARCHITECTURE.md` - 系統架構設計
- `README.md` - 基礎RAG系統文檔
- `README_ENHANCED.md` - 增強版系統文檔
- `HOW_TO_USE_ENHANCED_SYSTEM.md` - 使用指南

---

**提示**：首次使用時，建議先運行測試了解系統功能，然後在測試項目中試用，最後應用到實際項目中。

**享受智能開發體驗！** 🚀