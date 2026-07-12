#!/usr/bin/env python3
"""
Windows應用打包腳本
將增強版RAG系統打包成Windows可執行應用
"""

import os
import sys
import shutil
import json
from pathlib import Path
from datetime import datetime

def create_windows_app():
    """創建Windows應用程式"""
    print("=" * 60)
    print("🚀 開始創建Windows應用程式")
    print("=" * 60)
    
    source_dir = Path(__file__).parent
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    build_dir = source_dir / "build" / f"windows_app_{timestamp}"
    dist_dir = source_dir / "dist"
    
    # 創建目錄
    build_dir.mkdir(parents=True, exist_ok=True)
    dist_dir.mkdir(parents=True, exist_ok=True)
    
    # 步驟1: 複製必要文件
    print("\n1️⃣  複製系統文件...")
    copy_system_files(source_dir, build_dir)
    
    # 步驟2: 創建啟動腳本
    print("\n2️⃣  創建啟動腳本...")
    create_launch_scripts(build_dir)
    
    # 步驟3: 創建配置文件
    print("\n3️⃣  創建配置文件...")
    create_config_files(build_dir)
    
    # 步驟4: 創建安裝腳本
    print("\n4️⃣  創建安裝腳本...")
    create_install_scripts(build_dir)
    
    # 步驟5: 打包成ZIP
    print("\n5️⃣  打包成ZIP文件...")
    zip_path = create_zip_package(build_dir, dist_dir, timestamp)
    
    # 步驟6: 創建README
    print("\n6️⃣  創建使用說明...")
    create_readme(build_dir, timestamp)
    
    print("\n" + "=" * 60)
    print("🎉 Windows應用程式創建完成!")
    print("=" * 60)
    print(f"📦 打包文件: {zip_path}")
    print(f"📁 構建目錄: {build_dir}")
    print(f"📄 使用說明: {build_dir}/README_WINDOWS.md")
    print("=" * 60)
    print("\n📋 下一步:")
    print("1. 將ZIP文件複製到Windows電腦")
    print("2. 解壓縮到任意目錄")
    print("3. 運行 install.bat 進行安裝")
    print("4. 使用桌面快捷方式啟動應用")
    print("=" * 60)
    
    return str(zip_path)

def copy_system_files(source_dir, build_dir):
    """複製系統文件"""
    # 複製Python源文件
    python_files = [
        "main.py", "main_enhanced.py",
        "run_enhanced_with_modules.py", "run_monitoring_system.py",
        "run_with_incremental_processing.py"
    ]
    
    for file in python_files:
        src = source_dir / file
        if src.exists():
            dst = build_dir / file
            shutil.copy2(src, dst)
            print(f"   複製: {file}")
    
    # 複製模塊目錄
    modules_dir = source_dir / "modules"
    if modules_dir.exists():
        dst_modules = build_dir / "modules"
        shutil.copytree(modules_dir, dst_modules, dirs_exist_ok=True)
        print(f"   複製: modules/ 目錄")
    
    # 複製配置目錄
    config_dir = source_dir / "config"
    if config_dir.exists():
        dst_config = build_dir / "config"
        shutil.copytree(config_dir, dst_config, dirs_exist_ok=True)
        print(f"   複製: config/ 目錄")
    
    # 複製文檔文件
    docs = [
        "README.md", "README_ENHANCED.md", "QUICK_START_GUIDE.md",
        "HOW_TO_USE_ENHANCED_SYSTEM.md", "INTEGRATED_SYSTEM.md"
    ]
    
    for doc in docs:
        src = source_dir / doc
        if src.exists():
            dst = build_dir / doc
            shutil.copy2(src, dst)
            print(f"   複製: {doc}")

def create_launch_scripts(build_dir):
    """創建啟動腳本"""
    # Windows批處理文件
    bat_content = """@echo off
echo ========================================
echo 增強版RAG系統 - Windows版本
echo ========================================
echo.

REM 檢查Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未找到Python，請先安裝Python 3.8+
    echo 下載地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo ✅ Python已安裝
echo.

:menu
echo ========================================
echo 增強版RAG系統 - 主菜單
echo ========================================
echo.
echo 1. 🚀 增強版RAG分析 (完整流程)
echo 2. 📊 監測系統 (實時監測)
echo 3. 🔄 增量處理系統
echo 4. 🔍 基礎RAG分析
echo 5. 📖 查看文檔
echo 6. ❌ 退出
echo.
set /p choice="請選擇功能 (1-6): "

if "%choice%"=="1" goto enhanced
if "%choice%"=="2" goto monitor
if "%choice%"=="3" goto incremental
if "%choice%"=="4" goto basic
if "%choice%"=="5" goto docs
if "%choice%"=="6" goto exit

echo ❌ 無效選擇，請重新輸入
pause
goto menu

:enhanced
echo.
echo 🚀 啟動增強版RAG分析...
echo.
set /p project_path="請輸入項目路徑: "
if "%project_path%"=="" (
    echo ❌ 未輸入項目路徑
    pause
    goto menu
)
python main_enhanced.py "%project_path%"
pause
goto menu

:monitor
echo.
echo 📊 啟動監測系統...
echo.
python run_monitoring_system.py
pause
goto menu

:incremental
echo.
echo 🔄 啟動增量處理系統...
echo.
set /p project_path="請輸入項目路徑: "
if "%project_path%"=="" (
    echo ❌ 未輸入項目路徑
    pause
    goto menu
)
python run_with_incremental_processing.py "%project_path%"
pause
goto menu

:basic
echo.
echo 🔍 啟動基礎RAG分析...
echo.
set /p project_path="請輸入項目路徑: "
if "%project_path%"=="" (
    echo ❌ 未輸入項目路徑
    pause
    goto menu
)
python main.py "%project_path%"
pause
goto menu

:docs
start README_ENHANCED.md
goto menu

:exit
echo.
echo 👋 感謝使用增強版RAG系統！
echo.
pause
"""
    
    bat_path = build_dir / "rag_system.bat"
    with open(bat_path, 'w', encoding='utf-8') as f:
        f.write(bat_content)
    
    print(f"   創建: rag_system.bat")

def create_config_files(build_dir):
    """創建配置文件"""
    # 創建requirements.txt
    requirements = """# 增強版RAG系統依賴
# 基礎依賴
python>=3.8

# 可選依賴（系統使用標準庫，這些是可選的增強功能）
# colorama>=0.4.6  # 彩色輸出
# tqdm>=4.66.0    # 進度條
# psutil>=5.9.0   # 系統監控
"""
    
    req_path = build_dir / "requirements.txt"
    with open(req_path, 'w', encoding='utf-8') as f:
        f.write(requirements)
    
    print(f"   創建: requirements.txt")
    
    # 創建Windows配置
    windows_config = {
        "windows_settings": {
            "default_project_path": "C:\\Users\\%USERNAME%\\projects",
            "create_desktop_shortcut": True,
            "add_to_path": False,
            "auto_update": False
        },
        "system_settings": {
            "max_file_size_mb": 10,
            "monitor_interval_seconds": 5,
            "enable_notifications": True
        },
        "rag_settings": {
            "auto_analysis": True,
            "analysis_threshold": 3,
            "save_reports_to_desktop": True
        }
    }
    
    config_path = build_dir / "windows_config.json"
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(windows_config, f, indent=2, ensure_ascii=False)
    
    print(f"   創建: windows_config.json")

def create_install_scripts(build_dir):
    """創建安裝腳本"""
    # Windows安裝腳本
    install_bat = """@echo off
echo ========================================
echo 增強版RAG系統 - 安裝程序
echo ========================================
echo.

echo 🚀 開始安裝增強版RAG系統...
echo.

REM 檢查Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未找到Python
    echo 請手動安裝Python 3.8+
    echo 下載地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo ✅ Python已安裝
echo.

REM 創建桌面快捷方式
echo 📋 創建桌面快捷方式...

set SHORTCUT_SCRIPT=%~dp0rag_system.bat
set SHORTCUT_PATH=%USERPROFILE%\\Desktop\\增強版RAG系統.lnk

powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = '%SHORTCUT_SCRIPT%'; $s.WorkingDirectory = '%~dp0'; $s.Save()"

echo ✅ 桌面快捷方式已創建
echo.
echo 🎉 安裝完成！
echo.
echo 📋 使用方法：
echo 1. 雙擊桌面上的「增強版RAG系統」快捷方式
echo 2. 選擇需要的功能
echo 3. 按照提示操作
echo.
pause
"""
    
    install_path = build_dir / "install.bat"
    with open(install_path, 'w', encoding='utf-8') as f:
        f.write(install_bat)
    
    print(f"   創建: install.bat")

def create_zip_package(build_dir, dist_dir, timestamp):
    """創建ZIP包"""
    import zipfile
    
    zip_filename = f"enhanced_rag_system_windows_{timestamp}.zip"
    zip_path = dist_dir / zip_filename
    
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(build_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, build_dir)
                zipf.write(file_path, arcname)
    
    print(f"   創建: {zip_filename}")
    return zip_path

def create_readme(build_dir, timestamp):
    """創建使用說明"""
    readme_content = f"""# 增強版RAG系統 - Windows版本

## 🚀 快速開始

### 安裝步驟
1. 解壓縮 `enhanced_rag_system_windows_{timestamp}.zip` 到任意目錄
2. 雙擊運行 `install.bat`
3. 按照提示完成安裝

### 系統要求
- Windows 7/8/10/11
- Python 3.8+ (如果沒有安裝，安裝程序會提示)
- 管理員權限（用於創建桌面快捷方式）

## 📋 功能介紹

### 1. 增強版RAG分析
- 完整項目分析流程
- 智能學習和優化
- 自動生成改進建議
- 項目打包功能

### 2. 監測系統
- 實時監測開發活動
- 自動觸發分析
- 提供實時建議
- 支持多項目監測

### 3. 增量處理系統
- 增量式項目處理
- 智能緩存管理
- 高效資源利用
- 持續改進支持

### 4. 基礎RAG分析
- 快速項目評估
- 代碼質量檢查
- 結構分析
- 建議生成

## 🛠️ 使用方法

### 啟動系統
1. 雙擊桌面上的「增強版RAG系統」快捷方式
2. 或者運行解壓目錄中的 `rag_system.bat`

### 分析項目
1. 選擇「增強版RAG分析」
2. 輸入項目路徑（例如：C:\\Users\\YourName\\projects\\my-app）
3. 等待分析完成
4. 查看桌面上的分析報告

### 監測模式
1. 選擇「監測系統」
2. 系統開始監測開發活動
3. 按 Ctrl+C 停止監測

## 📊 輸出文件

### 分析結果
- 桌面上的文本摘要文件
- 項目目錄中的詳細JSON報告
- 優化建議列表

### 監測日誌
- 實時顯示監測結果
- 自動保存分析報告
- 系統狀態記錄

## 🔧 配置選項

### 修改配置文件
編輯 `windows_config.json` 文件：

```json
{{
  "windows_settings": {{
    "default_project_path": "C:\\\\Users\\\\YourName\\\\projects",
    "create_desktop_shortcut": true
  }},
  "system_settings": {{
    "max_file_size_mb": 10,
    "monitor_interval_seconds": 5
  }}
}}
```

## ⚡ 性能優化

### 減少資源占用
- 增加監測間隔時間
- 限制監測文件大小
- 排除不需要的目錄

## 🔍 故障排除

### 常見問題

#### 1. Python未安裝
**解決方案**：
- 下載並安裝 Python 3.8+
- 下載地址：https://www.python.org/downloads/
- 安裝時勾選「Add Python to PATH」

#### 2. 權限不足
**解決方案**：
- 以管理員身份運行 install.bat
- 或者手動創建桌面快捷方式

#### 3. 分析失敗
**解決方案**：
- 檢查項目路徑是否正確
- 確保對項目目錄有讀取權限
- 查看錯誤信息進行調試

## 📚 相關文檔

### 系統文檔
- `README_ENHANCED.md` - 增強版系統詳細說明
- `QUICK_START_GUIDE.md` - 快速開始指南
- `INTEGRATED_SYSTEM.md` - 完整系統文檔

## 🆘 支持與幫助

### 獲取幫助
1. 查看文檔文件
2. 運行測試了解功能
3. 檢查錯誤日誌

---

**增強版RAG系統** - 讓項目分析和優化變得智能而簡單！

**版本**: Windows專用版
**更新時間**: {timestamp}
**系統要求**: Windows 7+ with Python 3.8+
"""
    
    readme_path = build_dir / "README_WINDOWS.md"
    with open(readme_path, 'w', encoding='utf-8') as f:
        f.write(readme_content)
    
    print(f"   創建: README_WINDOWS.md")

if __name__ == "__main__":
    create_windows_app()