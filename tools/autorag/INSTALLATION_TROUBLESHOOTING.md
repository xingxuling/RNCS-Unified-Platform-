# 🛠️ AutoRAG 一鍵安裝腳本閃退問題解決指南

## 問題描述
當以系統管理員權限運行 `one_click_install.bat` 時，腳本閃退（立即關閉）。

## 🔍 可能的原因

### 1. **Python 環境問題**
- Python 未安裝或未添加到 PATH
- Python 版本過低 (< 3.8)
- Python 安裝損壞

### 2. **權限問題**
- 雖然以管理員運行，但某些操作需要更高權限
- 用戶帳戶控制 (UAC) 設置過高
- 防毒軟體攔截

### 3. **文件缺失或損壞**
- `build_exe.py` 文件缺失
- `post_install.py` 文件缺失
- `main_enhanced.py` 文件缺失

### 4. **路徑問題**
- 腳本在包含空格或特殊字符的路徑中
- 當前目錄不正確
- 系統變量問題

### 5. **依賴安裝失敗**
- PyInstaller 安裝失敗
- pywin32 安裝失敗
- 網絡連接問題

## 🚀 解決方案

### 方案一：使用診斷工具（推薦）
1. 進入 `auto-rag-system` 目錄
2. 右鍵點擊 `diagnose_install.bat`
3. 選擇「以管理員身份運行」
4. 查看診斷報告，根據提示修復問題

### 方案二：使用修復版安裝腳本
1. 進入 `auto-rag-system` 目錄
2. 右鍵點擊 `one_click_install_fixed.bat`
3. 選擇「以管理員身份運行」
4. 這個版本有更好的錯誤處理和日誌

### 方案三：手動安裝

#### 步驟 1：檢查 Python
```cmd
python --version
```
如果顯示版本號且 >= 3.8，繼續下一步。
否則，安裝 Python 3.8+ 並確保勾選「Add Python to PATH」。

#### 步驟 2：安裝依賴
```cmd
pip install pyinstaller pywin32
```

#### 步驟 3：生成 EXE
```cmd
python build_exe.py
```

#### 步驟 4：系統集成
```cmd
python post_install.py
```

### 方案四：分步測試

#### 測試 1：基本 Python 功能
```cmd
test_install_simple.bat
```

#### 測試 2：檢查文件
```cmd
dir /b *.py *.bat
```
應該看到：
- `build_exe.py`
- `post_install.py` 
- `main_enhanced.py`
- `one_click_install.bat`

#### 測試 3：單獨運行每個步驟
```cmd
python build_exe.py
```
```cmd
python post_install.py
```

## ⚠️ 常見錯誤及解決方法

### 錯誤 1：`python is not recognized`
**解決**：
1. 重新安裝 Python
2. 安裝時勾選「Add Python to PATH」
3. 重啟電腦

### 錯誤 2：`Permission denied`
**解決**：
1. 確保以管理員身份運行
2. 暫時關閉防毒軟體
3. 檢查文件權限

### 錯誤 3：腳本立即關閉
**解決**：
1. 在命令提示字元中手動運行：
   ```cmd
   cd "C:\Users\您的用戶名\auto-rag-system"
   one_click_install.bat
   ```
2. 這樣可以看到錯誤信息

### 錯誤 4：`ModuleNotFoundError`
**解決**：
```cmd
pip install 缺失的模塊名稱
```

## 🔧 高級故障排除

### 1. 啟用日誌記錄
修改 `one_click_install.bat`，在第一行添加：
```bat
@echo off
chcp 65001 >nul
echo 安裝日誌 > install.log
```

在每個命令後添加：
```bat
>> install.log 2>&1
```

### 2. 檢查事件查看器
1. 按 `Win + R`，輸入 `eventvwr.msc`
2. 查看「Windows 日誌」→「應用程式」
3. 查找相關錯誤

### 3. 使用 Process Monitor
1. 下載 Process Monitor: https://docs.microsoft.com/en-us/sysinternals/downloads/procmon
2. 過濾 `one_click_install.bat`
3. 查看進程創建和文件訪問錯誤

## 📞 獲取幫助

如果以上方法都無效，請提供以下信息：

1. **操作系統版本**：`Win + R` → `winver`
2. **Python 版本**：`python --version`
3. **錯誤截圖**：如果有的話
4. **診斷報告**：`diagnose_install.bat` 的輸出

## 🎯 快速檢查清單

- [ ] Python 3.8+ 已安裝並添加到 PATH
- [ ] 以管理員身份運行
- [ ] 防毒軟體已暫時關閉
- [ ] 所有必要文件都存在
- [ ] 網絡連接正常
- [ ] 磁盤空間充足

## 💡 預防措施

1. **使用虛擬環境**：
   ```cmd
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **備份重要文件**
3. **在測試環境中先試用**
4. **閱讀錯誤信息**：不要立即關閉錯誤窗口

---

**最後更新**：2025年1月24日  
**適用版本**：AutoRAG 系統 v1.0.0

> 提示：如果問題仍然存在，可以考慮使用 WSL2 或 Docker 容器環境，避免 Windows 特有的權限和路徑問題。