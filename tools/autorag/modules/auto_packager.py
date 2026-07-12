#!/usr/bin/env python3
"""
自動化打包模塊
根據決策結果自動優化項目並打包
"""

import os
import json
import shutil
import sys
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime
import zipfile
import tarfile

class AutoPackager:
    """自動化打包器"""
    
    def __init__(self, project_path: str, decisions: Dict[str, Any]):
        self.project_path = Path(project_path)
        self.decisions = decisions
        self.optimized_path = None
        self.package_path = None
        
    def optimize_project(self) -> str:
        """優化項目結構"""
        print("🔧 優化項目結構...")
        
        # 創建優化副本
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        optimized_name = f"{self.project_path.name}_optimized_{timestamp}"
        self.optimized_path = self.project_path.parent / optimized_name
        
        # 複製項目
        shutil.copytree(self.project_path, self.optimized_path)
        print(f"✅ 創建優化副本: {self.optimized_path}")
        
        # 根據決策應用優化
        self._apply_optimizations()
        
        return str(self.optimized_path)
    
    def _apply_optimizations(self):
        """應用優化措施"""
        priorities = self.decisions.get("priorities", {})
        
        # 應用基礎優化
        self._apply_basic_optimizations()
        
        # 應用關鍵和高優先級優化
        for priority_level in ["critical", "high"]:
            for item in priorities.get(priority_level, []):
                self._apply_optimization_item(item)
    
    def _apply_optimization_item(self, item: Dict[str, Any]):
        """應用單個優化項目"""
        description = item.get("description", "")
        print(f"  📝 應用優化: {description}")
        
        try:
            if "測試" in description:
                self._add_testing_infrastructure()
            elif "ESLint" in description or "代碼風格" in description:
                self._add_linting_config()
            elif "GitHub Actions" in description or "自動化" in description:
                self._enhance_automation()
            elif "文檔" in description:
                self._improve_documentation()
        except Exception as e:
            print(f"  ⚠️  優化失敗: {e}")
    
    def _apply_basic_optimizations(self):
        """應用基礎優化"""
        print("  🛠️  應用基礎優化...")
        
        # 1. 更新 package.json
        self._update_package_json()
        
        # 2. 添加基礎配置文件
        self._add_basic_configs()
        
        # 3. 清理不必要的文件
        self._cleanup_unnecessary_files()
        
        # 4. 添加 README 更新
        self._update_readme()
    
    def _update_package_json(self):
        """更新 package.json"""
        package_path = self.optimized_path / "package.json"
        if not package_path.exists():
            return
        
        try:
            with open(package_path, 'r', encoding='utf-8') as f:
                package_data = json.load(f)
            
            # 添加缺失的腳本
            scripts = package_data.get("scripts", {})
            
            if "test" not in scripts:
                scripts["test"] = "jest"
            
            if "lint" not in scripts:
                scripts["lint"] = "eslint ."
            
            package_data["scripts"] = scripts
            
            # 寫回文件
            with open(package_path, 'w', encoding='utf-8') as f:
                json.dump(package_data, f, indent=2)
            
            print("  ✅ 更新 package.json")
            
        except Exception as e:
            print(f"  ⚠️  更新 package.json 失敗: {e}")
    
    def _add_basic_configs(self):
        """添加基礎配置文件"""
        configs_dir = self.optimized_path
        
        # Babel 配置（如果不存在）
        babel_path = configs_dir / "babel.config.js"
        if not babel_path.exists():
            babel_config = """module.exports = {
  presets: ['module:@react-native/babel-preset'],
};"""
            with open(babel_path, 'w', encoding='utf-8') as f:
                f.write(babel_config)
            print("  ✅ 添加 babel.config.js")
    
    def _cleanup_unnecessary_files(self):
        """清理不必要的文件"""
        patterns = [
            "*.log",
            "*.tmp",
            ".DS_Store",
        ]
        
        for pattern in patterns:
            for file in self.optimized_path.rglob(pattern):
                try:
                    file.unlink()
                except:
                    pass
        
        print("  ✅ 清理不必要的文件")
    
    def _update_readme(self):
        """更新 README"""
        readme_path = self.optimized_path / "README.md"
        
        if readme_path.exists():
            try:
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                optimization_note = f"\n\n## 🔧 自動化優化\n\n- 優化時間: {timestamp}\n- 優化依據: RAG 分析和決策引擎\n"
                
                with open(readme_path, 'a', encoding='utf-8') as f:
                    f.write(optimization_note)
                
                print("  ✅ 更新 README.md")
                
            except Exception as e:
                print(f"  ⚠️  更新 README 失敗: {e}")
    
    def _add_testing_infrastructure(self):
        """添加測試基礎設施"""
        tests_dir = self.optimized_path / "__tests__"
        tests_dir.mkdir(exist_ok=True)
        
        # 創建示例測試文件
        example_test = tests_dir / "App.test.js"
        if not example_test.exists():
            test_content = """test('example test', () => {
  expect(1 + 1).toBe(2);
});"""
            
            with open(example_test, 'w', encoding='utf-8') as f:
                f.write(test_content)
            
            print("  ✅ 添加測試基礎設施")
    
    def _add_linting_config(self):
        """添加代碼檢查配置"""
        eslint_path = self.optimized_path / ".eslintrc.js"
        
        if not eslint_path.exists():
            eslint_config = """module.exports = {
  root: true,
  extends: '@react-native',
};"""
            
            with open(eslint_path, 'w', encoding='utf-8') as f:
                f.write(eslint_config)
            
            print("  ✅ 添加 ESLint 配置")
    
    def _enhance_automation(self):
        """增強自動化配置"""
        workflows_dir = self.optimized_path / ".github" / "workflows"
        workflows_dir.mkdir(parents=True, exist_ok=True)
        
        # 添加基礎工作流
        base_workflow = workflows_dir / "ci.yml"
        if not base_workflow.exists():
            workflow_content = """name: CI

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test"""
            
            with open(base_workflow, 'w', encoding='utf-8') as f:
                f.write(workflow_content)
            
            print("  ✅ 增強自動化配置")
    
    def _improve_documentation(self):
        """改進文檔"""
        docs_dir = self.optimized_path / "docs"
        docs_dir.mkdir(exist_ok=True)
        
        # 創建基礎文檔
        api_docs = docs_dir / "API.md"
        if not api_docs.exists():
            api_content = """# API 文檔

## 概述
自動生成的 API 文檔。"""
            
            with open(api_docs, 'w', encoding='utf-8') as f:
                f.write(api_content)
            
            print("  ✅ 改進文檔")
    
    def create_package(self, output_dir: str = None) -> str:
        """創建打包文件"""
        print("📦 創建打包文件...")
        
        if self.optimized_path is None:
            print("❌ 請先運行 optimize_project()")
            return ""
        
        # 確定輸出目錄
        if output_dir is None:
            output_dir = Path.home() / "Desktop"
        else:
            output_dir = Path(output_dir)
        
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # 創建壓縮包
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        package_name = f"{self.project_path.name}_optimized_{timestamp}"
        
        # 創建 ZIP 文件
        zip_path = output_dir / f"{package_name}.zip"
        self._create_zip_package(zip_path)
        
        self.package_path = str(zip_path)
        
        print(f"✅ 打包完成: {zip_path}")
        
        return str(zip_path)
    
    def _create_zip_package(self, output_path: Path):
        """創建 ZIP 包"""
        with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(self.optimized_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, self.optimized_path)
                    zipf.write(file_path, arcname)
    
    def generate_report(self) -> Dict[str, Any]:
        """生成打包報告"""
        report = {
            "project_info": {
                "original_path": str(self.project_path),
                "optimized_path": str(self.optimized_path) if self.optimized_path else None,
                "package_path": self.package_path,
                "package_time": datetime.now().isoformat()
            },
            "optimizations_applied": self._get_applied_optimizations(),
            "next_steps": [
                "解壓縮包並查看優化後的項目",
                "運行 npm install 安裝依賴",
                "查看更新的文檔"
            ]
        }
        
        return report
    
    def _get_applied_optimizations(self) -> List[str]:
        """獲取應用的優化列表"""
        optimizations = [
            "項目結構優化",
            "package.json 更新",
            "基礎配置文件添加",
            "不必要的文件清理",
            "README 更新"
        ]
        
        return optimizations
    
    def save_report(self, report: Dict[str, Any], output_path: str = None) -> str:
        """保存報告"""
        if output_path is None:
            output_path = Path.home() / "Desktop" / "packaging_report.json"
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"✅ 打包報告已保存: {output_path}")
        return str(output_path)


def main():
    """主函數"""
    if len(sys.argv) < 3:
        print("用法: python auto_packager.py <項目路徑> <決策文件路徑>")
        sys.exit(1)
    
    project_path = sys.argv[1]
    decisions_path = sys.argv[2]
    
    if not os.path.exists(project_path):
        print(f"錯誤: 項目路徑不存在: {project_path}")
        sys.exit(1)
    
    if not os.path.exists(decisions_path):
        print(f"錯誤: 決策文件不存在: {decisions_path}")
        sys.exit(1)
    
    # 加載決策
    with open(decisions_path, 'r', encoding='utf-8') as f:
        decisions = json.load(f)
    
    print(f"🎯 開始自動化打包")
    print("=" * 50)
    
    packager = AutoPackager(project_path, decisions)
    
    # 優化項目
    optimized_path = packager.optimize_project()
    
    # 創建包
    package_path = packager.create_package()
    
    # 生成報告
    report = packager.generate_report()
    report_path = packager.save_report(report)
    
    print("\n" + "=" * 50)
    print("📋 打包摘要:")
    print(f"原始項目: {project_path}")
    print(f"優化項目: {optimized_path}")
    print(f"打包文件: {package_path}")
    print(f"打包報告: {report_path}")
    print("=" * 50)


if __name__ == "__main__":
    main()