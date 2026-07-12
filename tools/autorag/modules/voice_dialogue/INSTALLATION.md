# 安裝指南

## 概述

語音對話模塊支持兩種運行模式：
1. **模擬模式**：無需安裝依賴，用於測試和演示
2. **實際語音模式**：需要安裝語音相關庫，提供完整功能

## 快速安裝

### 1. 模擬模式（推薦用於測試）

模擬模式不需要安裝任何額外依賴，可以直接運行：

```bash
cd /path/to/auto-rag-system/modules/voice_dialogue
python run_voice_dialogue.py
```

### 2. 實際語音模式

要啟用實際語音功能，需要安裝以下依賴：

```bash
# 安裝核心語音庫
pip install speechrecognition pyaudio

# 安裝語音合成庫
pip install pyttsx3 gtts playsound

# 安裝配置管理庫
pip install PyYAML

# 或者一次性安裝所有依賴
pip install speechrecognition pyaudio pyttsx3 gtts playsound PyYAML
```

## 系統要求

### 操作系統支持

| 系統 | 語音識別 | 語音合成 | 備註 |
|------|----------|----------|------|
| Windows | ✅ | ✅ | 需要安裝Visual C++ Redistributable |
| macOS | ✅ | ✅ | 需要Homebrew安裝portaudio |
| Linux | ✅ | ✅ | 需要安裝系統音頻庫 |

### Python版本
- Python 3.7 或更高版本
- 推薦使用 Python 3.8+

## 詳細安裝步驟

### Windows 系統

1. **安裝Python**
   - 從 [python.org](https://www.python.org/) 下載並安裝Python 3.8+
   - 確保勾選 "Add Python to PATH"

2. **安裝依賴**
   ```cmd
   pip install speechrecognition pyaudio pyttsx3 gtts playsound PyYAML
   ```

3. **解決常見問題**
   - 如果 `pyaudio` 安裝失敗，嘗試：
     ```cmd
     pip install pipwin
     pipwin install pyaudio
     ```

### macOS 系統

1. **安裝Homebrew（如果未安裝）**
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **安裝portaudio**
   ```bash
   brew install portaudio
   ```

3. **安裝Python依賴**
   ```bash
   pip3 install speechrecognition pyaudio pyttsx3 gtts playsound PyYAML
   ```

### Linux 系統（Ubuntu/Debian）

1. **安裝系統依賴**
   ```bash
   sudo apt update
   sudo apt install python3-pip python3-dev portaudio19-dev
   sudo apt install espeak ffmpeg  # 可選，用於語音合成
   ```

2. **安裝Python依賴**
   ```bash
   pip3 install speechrecognition pyaudio pyttsx3 gtts playsound PyYAML
   ```

## 驗證安裝

### 1. 檢查依賴安裝

```bash
# 檢查Python包
python -c "import speech_recognition, pyaudio, pyttsx3, gtts, yaml; print('所有依賴已安裝')"
```

### 2. 測試語音識別

```python
# test_speech.py
import speech_recognition as sr

r = sr.Recognizer()
with sr.Microphone() as source:
    print("請說話...")
    audio = r.listen(source)
    print("語音錄製完成")
```

### 3. 測試語音合成

```python
# test_tts.py
import pyttsx3

engine = pyttsx3.init()
engine.say("語音合成測試")
engine.runAndWait()
print("語音合成測試完成")
```

## 配置實際語音模式

### 1. 修改配置文件

編輯 `config.yaml`：

```yaml
main:
  simulate_mode: false  # 關閉模擬模式

speech_recognition:
  simulate_mode: false  # 啟用實際語音識別

speech_synthesis:
  simulate_mode: false  # 啟用實際語音合成
```

### 2. 運行實際語音模式

```bash
# 使用配置文件
python run_voice_dialogue.py --config config.yaml

# 或使用命令行參數
python run_voice_dialogue.py --real-mode
```

## 故障排除

### 常見問題

#### 1. `pyaudio` 安裝失敗

**錯誤信息**：
```
error: command 'x86_64-linux-gnu-gcc' failed with exit status 1
```

**解決方案**：
```bash
# Ubuntu/Debian
sudo apt install portaudio19-dev python3-dev

# macOS
brew install portaudio

# Windows
pip install pipwin
pipwin install pyaudio
```

#### 2. 麥克風無法識別

**錯誤信息**：
```
Could not find PyAudio; check installation
```

**解決方案**：
1. 檢查麥克風是否連接
2. 檢查系統音頻設置
3. 嘗試指定麥克風設備索引：

```yaml
speech_recognition:
  device_index: 0  # 嘗試不同的索引值
```

#### 3. 語音合成無聲音

**解決方案**：
1. 檢查系統音量
2. 檢查默認音頻輸出設備
3. 嘗試不同的語音引擎：

```yaml
speech_synthesis:
  engine_priority: ["gtts", "pyttsx3", "system"]
```

#### 4. 網絡依賴問題

**解決方案**：
- `gTTS` 需要網絡連接
- 如果沒有網絡，使用 `pyttsx3` 作為備用：

```yaml
speech_synthesis:
  engine_priority: ["pyttsx3", "system"]  # 移除gtts
```

## 性能優化

### 1. 調整音頻參數

```yaml
speech_recognition:
  sample_rate: 16000  # 降低採樣率以提高性能
  chunk_size: 512     # 減小塊大小
  
speech_synthesis:
  rate: 150           # 調整語速
  volume: 0.8         # 調整音量
```

### 2. 啟用緩存

```yaml
rag_interface:
  enable_cache: true
  cache_size: 100
  cache_ttl: 3600
```

### 3. 限制資源使用

```yaml
main:
  max_conversation_turns: 20  # 限制對話輪次
  audio_cache_size: 10        # 限制音頻緩存
```

## 高級配置

### 1. 使用自定義語音引擎

```python
# custom_engine.py
class CustomTTSEngine:
    def __init__(self, config):
        self.config = config
    
    def speak(self, text):
        # 實現自定義語音合成
        pass
```

### 2. 配置多語言支持

```yaml
speech_recognition:
  language: "zh-CN"  # 中文
  # language: "en-US"  # 英文
  # language: "ja-JP"  # 日文

speech_synthesis:
  language: "zh"     # 中文
  # language: "en"     # 英文
  # language: "ja"     # 日文
```

### 3. 配置音頻輸出

```yaml
speech_synthesis:
  output_dir: "audio_output"  # 音頻輸出目錄
  audio_format: "mp3"         # 音頻格式
  keep_audio_files: false     # 是否保留音頻文件
```

## 開發環境設置

### 1. 虛擬環境

```bash
# 創建虛擬環境
python -m venv venv

# 激活虛擬環境
# Windows
venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

# 安裝依賴
pip install -r requirements.txt
```

### 2. 開發依賴

```bash
# 安裝開發工具
pip install pytest pylint black

# 運行測試
pytest test_voice_dialogue.py

# 代碼格式化
black *.py
```

### 3. 調試配置

```yaml
main:
  log_level: "DEBUG"          # 調試日誌
  enable_console_log: true    # 控制台輸出
  
error_handling:
  log_errors: true           # 記錄錯誤
  show_user_errors: true     # 顯示錯誤信息
```

## 更新和維護

### 1. 更新依賴

```bash
# 更新所有包
pip install --upgrade speechrecognition pyaudio pyttsx3 gtts playsound PyYAML

# 或使用requirements.txt
pip install --upgrade -r requirements.txt
```

### 2. 清理緩存

```bash
# 清理Python緩存
pip cache purge

# 清理音頻文件
python -c "from speech_synthesis_simple import SpeechSynthesisSimple; s = SpeechSynthesisSimple(); s.cleanup_old_files(max_age_hours=0)"
```

### 3. 備份配置

```bash
# 備份配置文件
cp config.yaml config.yaml.backup

# 恢復配置
cp config.yaml.backup config.yaml
```

## 獲取幫助

### 1. 查看文檔
- 閱讀 `README.md` 獲取使用指南
- 查看 `ARCHITECTURE.md` 了解系統架構

### 2. 運行測試
```bash
# 運行完整測試
python test_voice_dialogue.py

# 運行演示
python demo.py
```

### 3. 尋求社區幫助
- 檢查項目Issue
- 提交新的Issue
- 聯繫維護者

---

**安裝完成後**，您可以：
1. 運行 `python run_voice_dialogue.py --real-mode` 啟用實際語音
2. 運行 `python demo.py` 查看功能演示
3. 閱讀 `README.md` 了解詳細使用方法

祝您使用愉快！ 🎉