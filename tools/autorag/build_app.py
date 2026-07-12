#!/usr/bin/env python3
"""
RAG 應用程序構建腳本
創建可部署的應用程序包
"""

import os
import shutil
import zipfile
from pathlib import Path
from datetime import datetime

def build_app():
    """構建應用程序"""
    print("=" * 60)
    print("🚀 構建 RAG 應用程序")
    print("=" * 60)
    
    source = Path(__file__).parent
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    build_dir = source / "build" / f"rag_app_{timestamp}"
    dist_dir = source / "dist"
    
    # 創建目錄
    build_dir.mkdir(parents=True, exist_ok=True)
    dist_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"源目錄: {source}")
    print(f"構建目錄: {build_dir}")
    print(f"輸出目錄: {dist_dir}")
    print()
    
    # 複製文件
    print("📦 複製文件...")
    
    # 核心文件
    core_files = [
        "rag_app.py",
        "main.py",
        "main_enhanced.py",
        "config_manager.py",
        "tray_app.py",
        "run_monitoring_system.py",
        "run_with_incremental_processing.py",
        "install_rag_app.bat",
        "create_icon.py",
        "README.md"
    ]
    
    for file in core_files:
        src = source / file
        if src.exists():
            shutil.copy2(src, build_dir / file)
            print(f"  ✓ {file}")
    
    # 模塊目錄
    modules = source / "modules"
    if modules.exists():
        shutil.copytree(modules, build_dir / "modules", dirs_exist_ok=True)
        print("  ✓ modules/")
    
    # 配置目錄
    config = source / "config"
    if config.exists():
        shutil.copytree(config, build_dir / "config", dirs_exist_ok=True)
        print("  ✓ config/")
    
    # 創建啟動腳本
    print("\n📜 創建啟動腳本...")
    
    # Windows 啟動腳本
    start_bat = """@echo off
chcp 65001 >nul
echo 正在啟動 RAG 自動化系統...
echo.
python rag_app.py
pause
"""
    
    with open(build_dir / "start.bat", "w", encoding="utf-8") as f:
        f.write(start_bat)
    print("  ✓ start.bat")
    
    # Linux/macOS 啟動腳本
    start_sh = """#!/bin/bash
echo "正在啟動 RAG 自動化系統..."
echo
python3 rag_app.py
"""
    
    with open(build_dir / "start.sh", "w", encoding="utf-8") as f:
        f.write(start_sh)
    print("  ✓ start.sh")
    
    # 創建 README
    print("\n📄 創建使用說明...")
    
    readme = f"""# RAG 自動化系統 - 應用程序包

版本: {timestamp}
構建時間: {datetime.now()}

## 🚀 快速開始

### Windows
1. 解壓縮此文件夾
2. 運行 `install_rag_app.bat` 進行安裝
3. 使用桌面快捷方式啟動
4. 或運行 `start.bat`

### Linux/macOS
1. 解壓縮此文件夾
2. 運行 `chmod +x start.sh`
3. 運行 `./start.sh`

## 📋 包含文件

### 核心應用
- `rag_app.py` - 主應用程序 (GUI)
- `main.py` - 基礎 RAG 分析
- `main_enhanced.py` - 增強版分析
- `config_manager.py` - 配置管理
- `tray_app.py` - 系統托盤應用

### 功能模塊
- `modules/` - 所有分析模塊
- `config/` - 配置文件

### 工具腳本
- `install_rag_app.bat` - Windows 安裝程序
- `start.bat` - Windows 啟動腳本
- `start.sh` - Linux/macOS 啟動腳本
- `create_icon.py` - 圖標生成工具

## 🎯 主要功能

1. **圖形用戶界面**
   - 項目選擇和瀏覽
   - 一鍵分析功能
   - 實時輸出顯示
   - 進度監控

2. **完整 RAG 系統**
   - 項目結構分析
   - 代碼質量評估
   - 智能優化建議
   - 自動打包功能

3. **監測系統**
   - 實時文件監測
   - 自動觸發分析
   - 變化檢測

4. **配置管理**
   - 圖形化設置界面
   - 自定義分析參數
   - 系統偏好設置

## ⚙️ 系統要求

- Python 3.8+
- 50MB 可用空間
- 讀取項目目錄的權限

## 🔧 安裝說明

### Windows 完整安裝
1. 運行 `install_rag_app.bat`
2. 按照提示操作
3. 安裝程序會：
   - 檢查 Python 環境
   - 創建桌面快捷方式
   - 創建開始菜單快捷方式

### 快速啟動（無安裝）
1. 確保已安裝 Python 3.8+
2. 運行 `start.bat` (Windows) 或 `./start.sh` (Linux/macOS)
3. 或直接運行: `python rag_app.py`

## 📊 使用流程

1. **選擇項目**
   - 點擊「瀏覽...」按鈕
   - 選擇要分析的項目目錄

2. **執行分析**
   - 選擇分析類型（基礎/增強）
   - 點擊對應按鈕開始分析
   - 查看實時輸出

3. **查看結果**
   - 分析完成後查看桌面報告
   - 查看輸出日誌中的詳細信息
   - 根據建議優化項目

## 🆘 常見問題

### 1. Python 未找到
**解決**：安裝 Python 3.8+，安裝時勾選「Add Python to PATH」

### 2. 權限不足
**解決**：以管理員身份運行安裝腳本

### 3. 分析失敗
**解決**：
- 檢查項目路徑是否正確
- 確保對項目目錄有讀取權限
- 查看錯誤日誌了解詳細信息

### 4. 中文顯示問題
**解決**：確保系統語言設置正確，使用支持 UTF-8 的終端

## 📞 支持

### 獲取幫助
1. 查看 `README.md` 文件
2. 運行應用程序中的幫助功能
3. 檢查輸出日誌中的錯誤信息

### 報告問題
遇到問題時請提供：
1. 操作系統版本
2. Python 版本 (`python --version`)
3. 錯誤信息和日誌
4. 重現步驟

## 🔄 更新

### 檢查更新
系統會自動檢查更新，或手動：
1. 訪問項目倉庫
2. 下載最新版本
3. 重新安裝

### 備份配置
建議備份：
1. 配置文件 (`config/` 目錄)
2. 自定義設置
3. 分析報告

---
**RAG 自動化系統** - 讓項目分析和優化變得簡單高效！

**版本**: 應用程序版 {timestamp}
**系統要求**: Python 3.8+
**許可證**: MIT
"""
    
    with open(build_dir / "README_APP.md", "w", encoding="utf-8") as f:
        f.write(readme)
    print("  ✓ README_APP.md")
    
    # 創建 ZIP 包
    print("\n📦 創建 ZIP 包...")
    
    zip_name = f"RAG_Automation_System_{timestamp}.zip"
    zip_path = dist_dir / zip_name
    
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(build_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, build_dir)
                zipf.write(file_path, arcname)
    
    print(f"  ✓ {zip_name}")
    print(f"  大小: {zip_path.stat().st_size / 1024 / 1024:.2f} MB")
    
    print("\n" + "=" * 60)
    print("🎉 構建完成！")
    print("=" * 60)
    print(f"📦 應用程序包: {zip_path}")
    print(f"📁 構建目錄: {build_dir}")
    print("=" * 60)
    print("\n📋 部署說明:")
    print("1. 將 ZIP 文件發送到目標電腦")
    print("2. 解壓縮到任意目錄")
    print("3. 運行 install_rag_app.bat (Windows)")
    print("4. 或直接運行 start.bat / start.sh")
    print("=" * 60)
    
    return str(zip_path)

if __name__ == "__main__":
    build_app()