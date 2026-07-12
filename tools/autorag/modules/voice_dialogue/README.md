# 增強版RAG語音對話模塊

## 概述

語音對話模塊是一個實時語音對話系統，實現「語音輸入 → RAG處理 → 語音輸出」的完整流程。該模塊與現有的增強版RAG系統集成，提供智能語音對話功能。

## 功能特性

### 核心功能
- 🎤 **實時語音識別**：支持中文語音輸入
- 🧠 **智能RAG查詢**：與增強版RAG系統無縫集成
- 🔊 **自然語音合成**：將回復轉換為語音輸出
- 🔄 **實時對話循環**：完整的對話流程管理

### 高級功能
- ⚙️ **可配置系統**：支持YAML/JSON配置文件
- 🛡️ **錯誤恢復**：自動錯誤檢測和恢復機制
- 📊 **性能監控**：實時性能指標跟踪
- 💾 **對話記錄**：自動保存對話歷史
- 🧪 **測試模式**：完整的測試框架

## 系統架構

```
語音對話模塊
├── 語音識別模塊 (Speech Recognition)
│   ├── 麥克風輸入
│   ├── 語音轉文字
│   └── 噪音過濾
├── RAG接口模塊 (RAG Interface)
│   ├── 查詢預處理
│   ├── RAG系統調用
│   └── 結果解析
├── 語音合成模塊 (Speech Synthesis)
│   ├── 文本轉語音
│   ├── 語音參數調整
│   └── 音頻輸出
└── 對話管理模塊 (Dialogue Management)
    ├── 對話狀態機
    ├── 上下文管理
    └── 錯誤處理
```

## 快速開始

### 1. 安裝依賴

```bash
# 安裝Python依賴（可選，模擬模式不需要）
pip install speechrecognition pyaudio pyttsx3 gtts playsound PyYAML
```

### 2. 運行系統

```bash
# 進入模塊目錄
cd /path/to/auto-rag-system/modules/voice_dialogue

# 使用模擬模式運行（推薦用於測試）
python run_voice_dialogue.py

# 使用交互式模式
python run_voice_dialogue.py --interactive

# 運行測試
python run_voice_dialogue.py --test
```

### 3. 基本使用

1. 系統啟動後會播放歡迎語音
2. 對麥克風說話進行語音輸入
3. 系統會自動識別語音並查詢RAG系統
4. 聽取語音回復
5. 按Ctrl+C停止對話

## 配置說明

### 配置文件

系統支持YAML和JSON格式的配置文件：

```yaml
# config.yaml 示例
main:
  simulate_mode: true        # 模擬模式（測試用）
  auto_start: false         # 自動開始對話
  max_conversation_turns: 20 # 最大對話輪次

speech_recognition:
  language: "zh-CN"         # 識別語言
  energy_threshold: 300     # 能量閾值

rag_interface:
  rag_system_path: "."      # RAG系統路徑
  timeout: 30               # 查詢超時

speech_synthesis:
  language: "zh"            # 合成語言
  rate: 150                 # 語速
  volume: 0.9               # 音量
```

### 命令行參數

```bash
# 使用指定配置文件
python run_voice_dialogue.py --config my_config.yaml

# 啟用實際語音模式（需要安裝依賴）
python run_voice_dialogue.py --real-mode

# 設置最大對話輪次
python run_voice_dialogue.py --max-turns 50

# 查看系統狀態
python run_voice_dialogue.py --status
```

## 模塊詳解

### 1. 語音識別模塊 (`speech_recognition_simple.py`)

**功能**：實時語音轉文字
**特性**：
- 支持模擬模式和實際語音識別
- 可配置的語言和識別參數
- 自動環境噪音調整
- 連續聆聽模式

**使用示例**：
```python
from speech_recognition_simple import SpeechRecognitionSimple

recognizer = SpeechRecognitionSimple({
    "language": "zh-CN",
    "simulate_mode": True
})

text = recognizer.recognize_from_microphone()
print(f"識別結果: {text}")
```

### 2. RAG接口模塊 (`rag_interface_simple.py`)

**功能**：與增強版RAG系統交互
**特性**：
- 支持直接模塊調用和腳本調用
- 查詢預處理和結果解析
- 對話上下文管理
- 錯誤重試機制

**使用示例**：
```python
from rag_interface_simple import RAGInterfaceSimple

rag_interface = RAGInterfaceSimple({
    "rag_system_path": ".",
    "simulate_mode": True
})

result = rag_interface.query("請分析這個項目")
print(f"RAG回復: {result['response']}")
```

### 3. 語音合成模塊 (`speech_synthesis_simple.py`)

**功能**：文本轉語音輸出
**特性**：
- 支持多種語音引擎（pyttsx3, gTTS, 系統命令）
- 可調節語速、音量、語音類型
- 音頻文件生成和管理
- 異步語音合成

**使用示例**：
```python
from speech_synthesis_simple import SpeechSynthesisSimple

synthesizer = SpeechSynthesisSimple({
    "language": "zh",
    "rate": 150,
    "simulate_mode": True
})

audio_file = synthesizer.speak("你好，我是語音助手")
print(f"音頻文件: {audio_file}")
```

### 4. 對話管理模塊 (`voice_dialogue_module.py`)

**功能**：管理完整對話流程
**特性**：
- 對話狀態機管理
- 輸入輸出隊列處理
- 對話歷史記錄
- 系統狀態監控

**使用示例**：
```python
from voice_dialogue_module import VoiceDialogueModule

dialogue = VoiceDialogueModule(config)
dialogue.start_conversation()

# 發送文本輸入
dialogue.send_text_input("請幫助我")

# 獲取對話歷史
history = dialogue.get_conversation_history()
```

### 5. 配置加載器 (`config_loader.py`)

**功能**：加載和管理配置
**特性**：
- 支持YAML和JSON格式
- 配置驗證和合併
- 示例配置生成
- 配置熱加載

### 6. 錯誤處理模塊 (`error_handler.py`)

**功能**：處理系統錯誤
**特性**：
- 錯誤分類和嚴重性評估
- 自動恢復策略
- 錯誤統計和報告
- 降級處理機制

## 測試框架

### 運行測試

```bash
# 運行完整測試套件
python test_voice_dialogue.py

# 運行特定測試
python -m pytest test_voice_dialogue.py::test_individual_modules
```

### 測試內容

1. **單元測試**：測試各個子模塊
2. **集成測試**：測試模塊間協作
3. **性能測試**：測試系統性能
4. **錯誤恢復測試**：測試錯誤處理能力

## 與RAG系統集成

### 集成方式

語音對話模塊通過以下方式與增強版RAG系統集成：

1. **直接模塊導入**：導入現有的RAG分析模塊
2. **進程調用**：通過子進程調用RAG腳本
3. **API調用**：通過HTTP API調用RAG服務（未來擴展）

### 配置RAG系統路徑

在配置文件中設置RAG系統路徑：

```yaml
rag_interface:
  rag_system_path: "/path/to/auto-rag-system"
```

## 錯誤處理

### 錯誤類型

系統能夠處理以下類型的錯誤：

1. **語音識別錯誤**：麥克風問題、識別失敗
2. **RAG處理錯誤**：查詢超時、系統未響應
3. **語音合成錯誤**：語音引擎錯誤、音頻輸出問題
4. **系統錯誤**：資源不足、配置錯誤

### 恢復策略

- **自動重試**：對可恢復錯誤進行重試
- **降級處理**：切換到備用方案
- **用戶通知**：向用戶顯示錯誤信息
- **系統恢復**：自動恢復系統狀態

## 性能優化

### 性能指標

- **響應時間**：端到端響應時間 < 10秒
- **資源使用**：內存 < 500MB，CPU < 30%
- **並發能力**：支持多輪對話並發處理

### 優化建議

1. **啟用緩存**：緩存RAG查詢結果
2. **調整超時**：根據網絡狀況調整超時時間
3. **清理資源**：定期清理音頻文件和日誌
4. **監控性能**：使用性能監控功能

## 擴展開發

### 添加新功能

1. **新語音引擎**：在`speech_synthesis_simple.py`中添加新引擎
2. **新RAG接口**：在`rag_interface_simple.py`中添加新接口
3. **新對話策略**：擴展`voice_dialogue_module.py`中的對話邏輯

### 插件系統

系統支持通過插件擴展功能：

```python
# 示例插件結構
class MyPlugin:
    def __init__(self, config):
        self.config = config
    
    def process_input(self, text):
        # 處理輸入
        return processed_text
    
    def process_output(self, text):
        # 處理輸出
        return processed_text
```

## 故障排除

### 常見問題

1. **語音識別不工作**
   - 檢查麥克風權限
   - 檢查語音識別庫是否安裝
   - 調整環境噪音閾值

2. **RAG查詢失敗**
   - 檢查RAG系統路徑
   - 檢查網絡連接
   - 查看錯誤日誌

3. **語音合成無聲音**
   - 檢查音頻輸出設備
   - 檢查語音合成庫是否安裝
   - 調整音量和語速

### 調試模式

啟用調試模式獲取詳細日誌：

```yaml
main:
  log_level: "DEBUG"
  enable_console_log: true
```

## 未來規劃

### 短期目標
- [ ] 支持多語言語音識別
- [ ] 添加語音喚醒詞功能
- [ ] 實現離線語音識別
- [ ] 添加情感分析功能

### 長期目標
- [ ] 支持多輪對話上下文
- [ ] 實現個性化語音合成
- [ ] 添加視覺反饋界面
- [ ] 支持多設備同步

## 貢獻指南

1. Fork項目
2. 創建功能分支
3. 提交更改
4. 創建Pull Request

## 許可證

MIT License

## 支持

如有問題或建議，請：
1. 查看文檔和示例
2. 運行測試腳本
3. 提交Issue
4. 聯繫維護者

---

**增強版RAG語音對話模塊** - 讓智能對話變得簡單自然！