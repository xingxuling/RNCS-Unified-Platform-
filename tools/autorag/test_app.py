#!/usr/bin/env python3
"""
RAG 應用程序測試腳本
測試應用程序的基本功能
"""

import os
import sys
import subprocess
from pathlib import Path

def test_imports():
    """測試導入"""
    print("🧪 測試模塊導入...")
    
    modules = [
        ("rag_app", "RAGApp"),
        ("config_manager", "ConfigManager"),
        ("main", "RAGAutomationSystem")
    ]
    
    for module_name, class_name in modules:
        try:
            if module_name == "rag_app":
                import rag_app
                print(f"  ✓ {module_name}.py 導入成功")
            elif module_name == "config_manager":
                import config_manager
                print(f"  ✓ {module_name}.py 導入成功")
            elif module_name == "main":
                import main
                print(f"  ✓ {module_name}.py 導入成功")
        except Exception as e:
            print(f"  ✗ {module_name}.py 導入失敗: {e}")
            
    print()

def test_files():
    """測試文件存在"""
    print("📁 測試必要文件...")
    
    required_files = [
        "rag_app.py",
        "main.py",
        "main_enhanced.py",
        "config_manager.py",
        "install_rag_app.bat",
        "build_app.py",
        "modules/rag_analyzer.py",
        "modules/decision_engine.py",
        "modules/auto_packager.py"
    ]
    
    for file in required_files:
        if os.path.exists(file):
            print(f"  ✓ {file}")
        else:
            print(f"  ✗ {file} (缺失)")
            
    print()

def test_python_version():
    """測試 Python 版本"""
    print("🐍 測試 Python 環境...")
    
    try:
        result = subprocess.run(
            [sys.executable, "--version"],
            capture_output=True,
            text=True
        )
        version = result.stdout.strip()
        print(f"  ✓ {version}")
        
        # 檢查 Python 3.8+
        import platform
        python_version = platform.python_version()
        major, minor, _ = map(int, python_version.split('.'))
        
        if major >= 3 and minor >= 8:
            print(f"  ✓ Python 版本符合要求 ({python_version})")
        else:
            print(f"  ⚠️  Python 版本可能過低 ({python_version})，建議使用 3.8+")
            
    except Exception as e:
        print(f"  ✗ 無法獲取 Python 版本: {e}")
        
    print()

def test_build_script():
    """測試構建腳本"""
    print("🔨 測試構建腳本...")
    
    try:
        # 測試導入構建腳本
        import build_app
        
        # 檢查函數是否存在
        if hasattr(build_app, 'build_app'):
            print("  ✓ build_app.py 函數檢查通過")
        else:
            print("  ✗ build_app.py 缺少 build_app 函數")
            
    except Exception as e:
        print(f"  ✗ 構建腳本測試失敗: {e}")
        
    print()

def test_config():
    """測試配置系統"""
    print("⚙️ 測試配置系統...")
    
    try:
        import config_manager
        
        # 創建配置管理器實例
        manager = config_manager.ConfigManager("test_config.json")
        
        # 測試配置加載
        config = manager.config
        if isinstance(config, dict):
            print("  ✓ 配置加載成功")
            
            # 測試配置獲取
            system_name = manager.get("system.name")
            if system_name:
                print(f"  ✓ 配置獲取成功: {system_name}")
            else:
                print("  ⚠️  配置獲取返回空值")
                
            # 測試配置保存
            if manager.save_config():
                print("  ✓ 配置保存成功")
                
                # 清理測試文件
                if os.path.exists("test_config.json"):
                    os.remove("test_config.json")
                    print("  ✓ 測試文件清理完成")
            else:
                print("  ✗ 配置保存失敗")
                
        else:
            print("  ✗ 配置加載失敗")
            
    except Exception as e:
        print(f"  ✗ 配置系統測試失敗: {e}")
        
    print()

def test_installation_script():
    """測試安裝腳本"""
    print("📦 測試安裝腳本...")
    
    # 檢查安裝腳本內容
    try:
        with open("install_rag_app.bat", "r", encoding="utf-8") as f:
            content = f.read()
            
        required_sections = [
            "@echo off",
            "python --version",
            "powershell",
            "桌面快捷方式",
            "安裝完成"
        ]
        
        for section in required_sections:
            if section in content:
                print(f"  ✓ 包含: {section}")
            else:
                print(f"  ⚠️  缺少: {section}")
                
    except Exception as e:
        print(f"  ✗ 安裝腳本檢查失敗: {e}")
        
    print()

def create_test_project():
    """創建測試項目"""
    print("🧪 創建測試項目...")
    
    test_dir = Path("test_project")
    
    try:
        # 創建測試項目目錄
        test_dir.mkdir(exist_ok=True)
        
        # 創建簡單的 Python 項目
        files = {
            "main.py": '''#!/usr/bin/env python3
"""
測試項目 - 簡單的 Python 應用
"""

def hello():
    """打招呼函數"""
    return "Hello, RAG System!"

def add(a, b):
    """加法函數"""
    return a + b

if __name__ == "__main__":
    print(hello())
    print(f"1 + 2 = {add(1, 2)}")
''',
            
            "README.md": '''# 測試項目

這是一個用於測試 RAG 系統的簡單 Python 項目。

## 功能
- 打招呼功能
- 簡單的數學運算

## 使用方法
```bash
python main.py
```

## 依賴
- Python 3.8+
- 無額外依賴
''',
            
            "requirements.txt": '''# 測試項目依賴
# 此項目使用標準庫，無需額外依賴
'''
        }
        
        for filename, content in files.items():
            filepath = test_dir / filename
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"  ✓ 創建: {filename}")
            
        print(f"  ✓ 測試項目創建完成: {test_dir}")
        
    except Exception as e:
        print(f"  ✗ 創建測試項目失敗: {e}")
        
    print()
    return test_dir

def run_summary():
    """運行測試總結"""
    print("=" * 60)
    print("📊 RAG 應用程序測試總結")
    print("=" * 60)
    print()
    
    tests = [
        ("模塊導入", test_imports),
        ("文件檢查", test_files),
        ("Python 環境", test_python_version),
        ("構建腳本", test_build_script),
        ("配置系統", test_config),
        ("安裝腳本", test_installation_script),
        ("測試項目", lambda: create_test_project())
    ]
    
    for test_name, test_func in tests:
        print(f"🔍 {test_name}")
        print("-" * 40)
        test_func()
        
    print("=" * 60)
    print("🎉 測試完成！")
    print("=" * 60)
    print()
    print("📋 下一步:")
    print("1. 運行構建腳本: python build_app.py")
    print("2. 測試安裝: 運行 install_rag_app.bat")
    print("3. 運行應用程序: python rag_app.py")
    print("4. 使用測試項目進行分析")
    print("=" * 60)

def main():
    """主函數"""
    print("🚀 開始 RAG 應用程序測試")
    print("=" * 60)
    print()
    
    # 切換到腳本所在目錄
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    run_summary()

if __name__ == "__main__":
    main()