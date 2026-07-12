# ⚡ AutoRAG 一鍵安裝腳本閃退快速修復指南

## 問題現象
雙擊或以管理員身份運行 `one_click_install.bat` 時，命令窗口閃現後立即關閉。

## 🔥 5分鐘快速解決方案

### 方案一：在命令提示字元中運行（最有效）
1. 按 `Win + R`，輸入 `cmd`，按 `Ctrl + Shift + Enter`（以管理員運行）
2. 輸入以下命令：
   ```cmd
   cd "C:\Users\User\auto-rag-system"
   one_click_install.bat
   ```
3. 這樣可以看到錯誤信息，不會閃退

### 方案二：使用修復版腳本
1. 右鍵點擊 `one_click_install_fixed.bat`
2. 選擇「以管理員身份運行」
3. 這個版本有更好的錯誤處理

### 方案三：逐步測試
1. 運行 `test_basic.bat` - 檢查基本功能
2. 運行 `diagnose_install.bat` - 全面診斷
3. 根據診斷結果修復

## 🐛 常見原因及解決方法

### 原因1：Python 未安裝或 PATH 錯誤
**症狀**：腳本立即關閉，無任何輸出
**解決**：
```cmd
python --version
```
如果顯示「不是內部或外部命令」：
1. 下載 Python 3.8+：https://www.python.org/downloads/
2. 安裝時**務必勾選**「Add Python to PATH」
3. 重啟電腦

### 原因2：防毒軟體攔截
**症狀**：腳本開始運行但突然關閉
**解決**：
1. 暫時關閉 Windows Defender 或第三方防毒軟體
2. 將 `auto-rag-system` 目錄添加到排除列表
3. 重新運行腳本

### 原因3：路徑問題
**症狀**：在某些目錄下正常，在某些目錄下閃退
**解決**：
1. 將 `auto-rag-system` 移動到簡單路徑：`C:\AutoRAG`
2. 避免中文、空格、特殊字符路徑
3. 使用短路徑：`C:\Users\User\autoreg`

### 原因4：權限不足
**症狀**：需要管理員權限的操作失敗
**解決**：
1. 右鍵點擊 → 「以管理員身份運行」
2. 關閉 UAC（用戶帳戶控制）：
   - `Win + R` → `msconfig`
   - 工具 → 更改 UAC 設置 → 拉到最低

### 原因5：文件損壞或缺失
**症狀**：腳本運行到一半退出
**解決**：
1. 檢查必要文件：
   ```cmd
   dir build_exe.py post_install.py main_enhanced.py
   ```
2. 如果缺失，重新下載或複製

## 🛠️ 分步診斷流程

### 第1步：基本檢查
```cmd
test_basic.bat
```

### 第2步：全面診斷
```cmd
diagnose_install.bat
```

### 第3步：手動測試
```cmd
python --version
python build_exe.py
python post_install.py
```

### 第4步：查看日誌
檢查是否有生成的日誌文件：
```cmd
dir *.log
type diagnose.log
```

## 🚨 緊急解決方案

如果急需使用，跳過安裝腳本：

### 直接使用 Python 版本
```cmd
cd C:\Users\User\auto-rag-system
python main_enhanced.py test_project
```

### 手動生成 EXE
```cmd
pip install pyinstaller
python build_exe.py
dist\AutoRAG.exe
```

## 📋 檢查清單

- [ ] Python 3.8+ 已安裝並在 PATH 中
- [ ] 以管理員身份運行
- [ ] 防毒軟體已暫時關閉
- [ ] 路徑無中文/空格
- [ ] 所有文件完整
- [ ] 磁盤空間充足（>1GB）
- [ ] 網絡連接正常

## 💡 專業技巧

### 1. 創建日誌版本
複製 `one_click_install.bat`，在第一行後添加：
```bat
echo 開始安裝 > install.log
call :step >> install.log 2>&1
```

### 2. 使用 Process Monitor 追蹤
1. 下載 Process Monitor
2. 過濾 `cmd.exe` 和 `python.exe`
3. 查看進程退出原因

### 3. 檢查事件查看器
1. `Win + R` → `eventvwr.msc`
2. Windows 日誌 → 應用程式
3. 查找錯誤事件

## 🆘 如果所有方法都失敗

### 備選方案1：使用 WSL2
```bash
# 在 WSL2 中
cd /mnt/c/Users/User/auto-rag-system
python3 main_enhanced.py test_project
```

### 備選方案2：使用虛擬環境
```cmd
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main_enhanced.py test_project
```

### 備選方案3：聯繫支持
提供以下信息：
1. Windows 版本：`winver`
2. Python 版本：`python --version`
3. 錯誤截圖或日誌
4. 具體操作步驟

## ✅ 成功標誌

安裝成功後應該有：
1. `dist\AutoRAG.exe` 文件
2. 桌面上的 AutoRAG 快捷方式
3. 可以雙擊運行

## 📞 最後手段

如果問題仍然存在，可以：
1. 使用系統還原點恢復
2. 在乾淨的 Windows 安裝中測試
3. 使用虛擬機（VirtualBox + Windows）

---

**記住**：最可靠的解決方法是在命令提示字元中手動運行，這樣可以看到所有錯誤信息，不會閃退。