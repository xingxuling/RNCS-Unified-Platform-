#!/usr/bin/env python3
"""
Windows應用程式測試腳本
測試增強版RAG系統在Windows環境下的功能
"""

import os
import sys
import shutil
import json
from pathlib import Path

def test_windows_app():
    """測試Windows應用程式"""
    print("=" * 60)
    print("🧪 測試Windows應用程式功能")
    print("=" * 60)
    
    current_dir = Path(__file__).parent
    test_results = {
        "system_check": False,
        "files_check": False,
        "modules_check": False,
        "config_check": False,
        "bat_files_check": False
    }
    
    # 測試1: 檢查系統文件
    print("\n1️⃣  檢查系統文件...")
    required_files = [
        "main.py",
        "main_enhanced.py", 
        "run_monitoring_system.py",
        "run_with_incremental_processing.py",
        "README_ENHANCED.md",
        "QUICK_START_GUIDE.md"
    ]
    
    missing_files = []
    for file in required_files:
        if (current_dir / file).exists():
            print(f"   ✅ {file}")
        else:
            print(f"   ❌ {file} (缺失)")
            missing_files.append(file)
    
    if not missing_files:
        test_results["files_check"] = True
        print(f"   ✅ 所有必需文件存在")
    else:
        print(f"   ❌ 缺失文件: {missing_files}")
    
    # 測試2: 檢查模塊目錄
    print("\n2️⃣  檢查模塊目錄...")
    modules_dir = current_dir / "modules"
    if modules_dir.exists():
        python_files = list(modules_dir.glob("*.py"))
        if python_files:
            test_results["modules_check"] = True
            print(f"   ✅ modules/ 目錄存在")
            print(f"   📁 包含 {len(python_files)} 個Python模塊")
            
            # 檢查關鍵模塊
            key_modules = [
                "rag_analyzer.py",
                "decision_engine.py", 
                "auto_packager.py",
                "advanced_learning_module.py"
            ]
            
            for module in key_modules:
                if (modules_dir / module).exists():
                    print(f"   ✅ {module}")
                else:
                    # 檢查.pyc文件
                    pyc_file = module.replace(".py", ".cpython-312.pyc")
                    if (modules_dir / pyc_file).exists():
                        print(f"   ⚠️  {module} (有編譯版本)")
                    else:
                        print(f"   ❌ {module} (缺失)")
        else:
            print(f"   ❌ modules/ 目錄為空")
    else:
        print(f"   ❌ modules/ 目錄不存在")
    
    # 測試3: 檢查配置目錄
    print("\n3️⃣  檢查配置目錄...")
    config_dir = current_dir / "config"
    if config_dir.exists():
        config_files = list(config_dir.glob("*"))
        if config_files:
            test_results["config_check"] = True
            print(f"   ✅ config/ 目錄存在")
            print(f"   📁 包含 {len(config_files)} 個配置文件")
        else:
            print(f"   ⚠️  config/ 目錄為空")
    else:
        print(f"   ⚠️  config/ 目錄不存在")
    
    # 測試4: 檢查Windows批處理文件
    print("\n4️⃣  檢查Windows批處理文件...")
    bat_files = ["rag_system.bat", "install.bat"]
    
    missing_bat = []
    for bat in bat_files:
        if (current_dir / bat).exists():
            print(f"   ✅ {bat}")
            
            # 檢查文件內容
            try:
                with open(current_dir / bat, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if "python" in content.lower() or "py" in content:
                        print(f"   📄 {bat} 內容有效")
                    else:
                        print(f"   ⚠️  {bat} 內容可能無效")
            except:
                print(f"   ⚠️  {bat} 讀取失敗")
        else:
            print(f"   ❌ {bat} (缺失)")
            missing_bat.append(bat)
    
    if not missing_bat:
        test_results["bat_files_check"] = True
        print(f"   ✅ 所有批處理文件存在")
    else:
        print(f"   ❌ 缺失批處理文件: {missing_bat}")
    
    # 測試5: 檢查配置文件
    print("\n5️⃣  檢查配置文件...")
    config_file = current_dir / "config.json"
    if config_file.exists():
        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            if "system" in config and "defaults" in config:
                test_results["config_check"] = True
                print(f"   ✅ config.json 格式正確")
                print(f"   📊 系統名稱: {config.get('system', {}).get('name', '未知')}")
                print(f"   📊 版本: {config.get('system', {}).get('version', '未知')}")
            else:
                print(f"   ⚠️  config.json 格式不完整")
        except json.JSONDecodeError:
            print(f"   ❌ config.json JSON解析錯誤")
        except Exception as e:
            print(f"   ❌ config.json 讀取錯誤: {e}")
    else:
        print(f"   ⚠️  config.json 不存在")
    
    # 測試6: 系統整體檢查
    print("\n6️⃣  系統整體檢查...")
    
    # 檢查Python環境
    try:
        import platform
        python_version = platform.python_version()
        print(f"   ✅ Python版本: {python_version}")
        
        if tuple(map(int, python_version.split('.')[:2])) >= (3, 8):
            test_results["system_check"] = True
            print(f"   ✅ Python版本符合要求 (>=3.8)")
        else:
            print(f"   ❌ Python版本過低 (需要>=3.8)")
    except:
        print(f"   ❌ 無法獲取Python版本")
    
    # 檢查操作系統
    system = platform.system()
    print(f"   💻 操作系統: {system}")
    
    if system == "Windows":
        print(f"   ✅ 當前在Windows環境")
    elif system == "Linux":
        print(f"   ⚠️  當前在Linux環境 (WSL)")
        print(f"   💡 提示: 應用程式包專為Windows設計")
    else:
        print(f"   ⚠️  當前在 {system} 環境")
    
    # 總結測試結果
    print("\n" + "=" * 60)
    print("📊 測試結果總結")
    print("=" * 60)
    
    passed = 0
    total = len(test_results)
    
    for test, result in test_results.items():
        status = "✅ 通過" if result else "❌ 失敗"
        print(f"{test}: {status}")
        if result:
            passed += 1
    
    print(f"\n📈 通過率: {passed}/{total} ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("\n🎉 所有測試通過！Windows應用程式準備就緒。")
        print("\n📋 下一步:")
        print("1. 將整個目錄複製到Windows電腦")
        print("2. 運行 install.bat 進行安裝")
        print("3. 使用桌面快捷方式啟動應用")
    else:
        print(f"\n⚠️  有 {total-passed} 個測試失敗")
        print("\n🔧 建議:")
        
        if not test_results["files_check"]:
            print("- 檢查缺失的Python文件")
        
        if not test_results["modules_check"]:
            print("- 檢查modules/目錄內容")
        
        if not test_results["bat_files_check"]:
            print("- 重新創建批處理文件")
        
        if not test_results["system_check"]:
            print("- 確保Python 3.8+已安裝")
    
    print("\n" + "=" * 60)
    
    # 創建測試報告
    report = {
        "timestamp": Path(__file__).stat().st_mtime,
        "test_results": test_results,
        "passed": passed,
        "total": total,
        "percentage": passed/total*100,
        "system_info": {
            "python_version": python_version if 'python_version' in locals() else "未知",
            "os": system,
            "current_dir": str(current_dir)
        }
    }
    
    # 保存測試報告
    report_file = current_dir / "windows_app_test_report.json"
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    print(f"📄 測試報告已保存: {report_file}")
    print("=" * 60)
    
    return passed == total

def create_test_project():
    """創建測試項目"""
    print("\n" + "=" * 60)
    print("🛠️  創建測試項目")
    print("=" * 60)
    
    current_dir = Path(__file__).parent
    test_project_dir = current_dir / "test_project"
    
    if test_project_dir.exists():
        shutil.rmtree(test_project_dir)
    
    test_project_dir.mkdir(exist_ok=True)
    
    # 創建簡單的Python項目
    (test_project_dir / "src").mkdir(exist_ok=True)
    (test_project_dir / "tests").mkdir(exist_ok=True)
    
    # 創建README
    readme_content = """# 測試項目
這是一個用於測試增強版RAG系統的示例項目。

## 項目結構
- src/ - 源代碼目錄
- tests/ - 測試目錄
- requirements.txt - 依賴列表
- README.md - 項目說明

## 功能
簡單的Python應用程式示例。
"""
    
    with open(test_project_dir / "README.md", 'w', encoding='utf-8') as f:
        f.write(readme_content)
    
    # 創建Python文件
    main_py = '''#!/usr/bin/env python3
"""
簡單的Python應用程式
"""

def hello_world():
    """打印Hello World"""
    print("Hello, World!")
    return "Hello, World!"

def add_numbers(a, b):
    """兩個數字相加"""
    return a + b

def main():
    """主函數"""
    print("啟動測試應用程式...")
    hello_world()
    result = add_numbers(10, 20)
    print(f"10 + 20 = {result}")
    print("應用程式執行完成！")

if __name__ == "__main__":
    main()
'''
    
    with open(test_project_dir / "src" / "main.py", 'w', encoding='utf-8') as f:
        f.write(main_py)
    
    # 創建測試文件
    test_py = '''#!/usr/bin/env python3
"""
測試文件
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from main import hello_world, add_numbers

def test_hello_world():
    """測試hello_world函數"""
    result = hello_world()
    assert result == "Hello, World!"
    print("✅ test_hello_world 通過")

def test_add_numbers():
    """測試add_numbers函數"""
    assert add_numbers(1, 2) == 3
    assert add_numbers(0, 0) == 0
    assert add_numbers(-1, 1) == 0
    print("✅ test_add_numbers 通過")

if __name__ == "__main__":
    test_hello_world()
    test_add_numbers()
    print("🎉 所有測試通過！")
'''
    
    with open(test_project_dir / "tests" / "test_main.py", 'w', encoding='utf-8') as f:
        f.write(test_py)
    
    # 創建requirements.txt
    requirements = """# 測試項目依賴
python>=3.8

# 測試框架
pytest>=7.0.0

# 代碼質量
flake8>=6.0.0
black>=23.0.0
"""
    
    with open(test_project_dir / "requirements.txt", 'w', encoding='utf-8') as f:
        f.write(requirements)
    
    # 創建.gitignore
    gitignore = """# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# 虛擬環境
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# 編輯器
.vscode/
.idea/
*.swp
*.swo
*~
"""
    
    with open(test_project_dir / ".gitignore", 'w', encoding='utf-8') as f:
        f.write(gitignore)
    
    print(f"✅ 測試項目創建完成: {test_project_dir}")
    print(f"📁 包含文件:")
    print(f"   - README.md")
    print(f"   - src/main.py")
    print(f"   - tests/test_main.py")
    print(f"   - requirements.txt")
    print(f"   - .gitignore")
    
    return test_project_dir

if __name__ == "__main__":
    print("增強版RAG系統 - Windows應用程式測試")
    print("=" * 60)
    
    # 運行系統測試
    system_ok = test_windows_app()
    
    if system_ok:
        # 創建測試項目
        response = input("\n是否創建測試項目？(y/n): ").strip().lower()
        if response == 'y':
            test_project = create_test_project()
            print(f"\n💡 測試項目路徑: {test_project}")
            print("您可以使用此項目測試增強版RAG系統功能。")
    
    print("\n" + "=" * 60)
    print("測試完成！")
    print("=" * 60)