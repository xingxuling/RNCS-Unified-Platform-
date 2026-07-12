# 📝 AutoRAG 手動安裝指南（無需批處理文件）

## 為什麼要手動安裝？
如果一鍵安裝腳本閃退，手動安裝可以：
1. 避免批處理文件的權限問題
2. 逐步檢查每個步驟
3. 更容易發現和解決問題

## 🛠️ 準備工作

### 1. 打開命令提示字元（管理員）
1. 按 `Win + X`
2. 選擇「Windows PowerShell（管理員）」或「命令提示字元（管理員）」
3. 點擊「是」確認 UAC 提示

### 2. 導航到 AutoRAG 目錄
```cmd
cd "C:\Users\%USERNAME%\auto-rag-system"
```
或根據您的實際路徑調整。

## 📦 安裝步驟

### 步驟 1：檢查 Python
```cmd
python --version
```
**預期輸出**：`Python 3.x.x`
**如果失敗**：安裝 Python 3.8+ 並確保勾選「Add Python to PATH」

### 步驟 2：升級 pip
```cmd
python -m pip install --upgrade pip
```

### 步驟 3：安裝 PyInstaller
```cmd
pip install pyinstaller
```

### 步驟 4：安裝 pywin32
```cmd
pip install pywin32
```

### 步驟 5：生成 EXE 文件
```cmd
python build_exe.py
```
**預期輸出**：
```
>> python -m pip install --upgrade pyinstaller
>> pyinstaller "main_enhanced.py" --onefile --windowed --name AutoRAG
[OK] EXE 已生成: C:\...\dist\AutoRAG.exe
```

### 步驟 6：創建快捷方式
```cmd
python post_install.py
```
**預期輸出**：
```
[OK] 桌面快捷方式已創建
[OK] 已設置開機自啟動
```

## ✅ 驗證安裝

### 1. 檢查 EXE 文件
```cmd
dir dist\
```
應該看到 `AutoRAG.exe`

### 2. 檢查桌面快捷方式
```cmd
dir "%USERPROFILE%\Desktop\AutoRAG.lnk"
```

### 3. 測試運行
```cmd
dist\AutoRAG.exe
```
或雙擊桌面上的「AutoRAG」快捷方式。

## 🔧 故障排除

### 問題 1：`python` 命令無效
**解決**：
1. 重新安裝 Python
2. 安裝時務必勾選「Add Python to PATH」
3. 重啟命令提示字元

### 問題 2：`pip` 命令無效
**解決**：
```cmd
python -m ensurepip
python -m pip install --upgrade pip
```

### 問題 3：PyInstaller 安裝失敗
**解決**：
```cmd
pip install pyinstaller --user
```
或使用國內鏡像：
```cmd
pip install pyinstaller -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 問題 4：pywin32 安裝失敗
**解決**：
```cmd
pip install pywin32 --user
```
或下載離線安裝包。

### 問題 5：EXE 生成失敗
**解決**：
1. 檢查 `main_enhanced.py` 是否存在
2. 檢查 Python 版本
3. 檢查磁盤空間

## 🎯 快速命令集合

複製並粘貼到管理員命令提示字元：

```cmd
cd "C:\Users\%USERNAME%\auto-rag-system"
python --version
python -m pip install --upgrade pip
pip install pyinstaller pywin32
python build_exe.py
python post_install.py
```

## 📞 獲取幫助

如果手動安裝仍然失敗，請提供：

1. **完整的錯誤信息**
2. **Python 版本**
3. **操作系統版本**

可以運行以下命令收集信息：
```cmd
python --version
pip list
systeminfo | findstr /B /C:"OS Name" /C:"OS Version"
```

## 💡 替代方案

如果 Windows 安裝問題無法解決，可以考慮：

### 方案 A：使用 WSL2（推薦）
```bash
# 在 WSL2 中
cd /mnt/c/Users/User/auto-rag-system
python3 main_enhanced.py test_project
```

### 方案 B：使用 Docker
```bash
docker build -t autoreg .
docker run -v $(pwd):/app autoreg
```

### 方案 C：使用虛擬機
安裝 VirtualBox 和 Ubuntu，在 Linux 環境中運行。

---

**注意**：手動安裝雖然步驟較多，但成功率更高，且更容易發現問題所在。

**最後檢查**：
- [ ] Python 3.8+ ✓
- [ ] 管理員權限 ✓
- [ ] 網絡連接 ✓
- [ ] 文件完整 ✓
- [ ] 逐步執行 ✓