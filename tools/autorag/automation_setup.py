#!/usr/bin/env python3
"""
RAG 自動化設置工具
一鍵設置各種自動化集成
"""

import os
import json
import sys
from pathlib import Path
from typing import Dict, Any

class AutomationSetup:
    """自動化設置工具"""
    
    def __init__(self):
        self.project_dir = Path.cwd()
        self.rag_dir = Path(__file__).parent
        self.config = {}
        
    def setup_all(self):
        """設置所有自動化"""
        print("=" * 60)
        print("🚀 RAG 自動化設置工具")
        print("=" * 60)
        
        # 創建配置目錄
        config_dir = self.project_dir / ".rag"
        config_dir.mkdir(exist_ok=True)
        
        # 交互式配置
        self.interactive_setup()
        
        # 保存配置
        self.save_config()
        
        # 設置集成
        self.setup_integrations()
        
        print("\n" + "=" * 60)
        print("🎉 自動化設置完成！")
        print("=" * 60)
        print("\n已設置的集成:")
        for integration, settings in self.config.get("integrations", {}).items():
            for tool, config in settings.items():
                if config.get("enabled", False):
                    print(f"  ✅ {integration}.{tool}")
        
        print("\n📋 下一步:")
        print("1. 提交配置到版本控制")
        print("2. 觸發首次分析: python automation_setup.py --run")
        print("3. 查看報告: cat .rag/reports/latest.json")
        print("=" * 60)
    
    def interactive_setup(self):
        """交互式設置"""
        print("\n🔧 選擇要設置的自動化集成:\n")
        
        self.config = {
            "enabled": True,
            "integrations": {},
            "triggers": {
                "on_push": True,
                "on_pr": True,
                "schedule": "0 0 * * *",
                "manual": True
            },
            "output": {
                "reports_dir": ".rag/reports",
                "create_issues": False,
                "send_notifications": False,
                "upload_artifacts": True
            }
        }
        
        # CI/CD 集成
        print("1. CI/CD 平台集成")
        self.config["integrations"]["ci_cd"] = {}
        
        if self.ask_yes_no("  設置 GitHub Actions?"):
            self.config["integrations"]["ci_cd"]["github_actions"] = {
                "enabled": True,
                "workflow_name": "rag-analysis.yml"
            }
        
        if self.ask_yes_no("  設置 GitLab CI?"):
            self.config["integrations"]["ci_cd"]["gitlab_ci"] = {
                "enabled": True,
                "config_file": ".gitlab-ci.yml"
            }
        
        # 通知集成
        print("\n2. 通知集成")
        self.config["integrations"]["notifications"] = {}
        
        if self.ask_yes_no("  設置 Slack 通知?"):
            webhook = input("  Slack Webhook URL (留空跳過): ").strip()
            if webhook:
                self.config["integrations"]["notifications"]["slack"] = {
                    "enabled": True,
                    "webhook_url": webhook
                }
                self.config["output"]["send_notifications"] = True
        
        if self.ask_yes_no("  設置 Discord 通知?"):
            webhook = input("  Discord Webhook URL (留空跳過): ").strip()
            if webhook:
                self.config["integrations"]["notifications"]["discord"] = {
                    "enabled": True,
                    "webhook_url": webhook
                }
                self.config["output"]["send_notifications"] = True
        
        # 項目管理集成
        print("\n3. 項目管理集成")
        self.config["integrations"]["project_management"] = {}
        
        if self.ask_yes_no("  設置 Jira 集成?"):
            url = input("  Jira URL (留空跳過): ").strip()
            if url:
                project_key = input("  Jira Project Key: ").strip()
                self.config["integrations"]["project_management"]["jira"] = {
                    "enabled": True,
                    "url": url,
                    "project_key": project_key
                }
                self.config["output"]["create_issues"] = True
        
        # 代碼質量集成
        print("\n4. 代碼質量平台集成")
        self.config["integrations"]["code_quality"] = {}
        
        if self.ask_yes_no("  設置 SonarQube 集成?"):
            url = input("  SonarQube URL (留空跳過): ").strip()
            if url:
                token = input("  SonarQube Token: ").strip()
                self.config["integrations"]["code_quality"]["sonarqube"] = {
                    "enabled": True,
                    "url": url,
                    "token": token
                }
    
    def ask_yes_no(self, question: str) -> bool:
        """詢問是/否問題"""
        response = input(f"{question} (y/N): ").strip().lower()
        return response in ['y', 'yes', '1']
    
    def save_config(self):
        """保存配置"""
        config_file = self.project_dir / ".rag" / "automation.json"
        
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(self.config, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ 配置已保存: {config_file}")
    
    def setup_integrations(self):
        """設置集成"""
        print("\n🔌 設置集成...")
        
        integrations = self.config.get("integrations", {})
        
        # GitHub Actions
        if integrations.get("ci_cd", {}).get("github_actions", {}).get("enabled", False):
            self.setup_github_actions()
        
        # GitLab CI
        if integrations.get("ci_cd", {}).get("gitlab_ci", {}).get("enabled", False):
            self.setup_gitlab_ci()
        
        # 創建報告目錄
        reports_dir = self.project_dir / self.config["output"]["reports_dir"]
        reports_dir.mkdir(parents=True, exist_ok=True)
        
        # 創建 README
        self.create_readme()
    
    def setup_github_actions(self):
        """設置 GitHub Actions"""
        print("  📦 設置 GitHub Actions...")
        
        workflow_dir = self.project_dir / ".github" / "workflows"
        workflow_dir.mkdir(parents=True, exist_ok=True)
        
        workflow_file = workflow_dir / "rag-analysis.yml"
        
        workflow_content = """name: RAG Analysis

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 0 * * *'  # 每天午夜
  workflow_dispatch:  # 手動觸發

jobs:
  rag-analysis:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
      
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
        
    - name: Install RAG system
      run: |
        python -m pip install --upgrade pip
        # 這裡可以安裝 RAG 系統
        
    - name: Run RAG analysis
      run: |
        python -m rag_automation
        
    - name: Upload reports
      uses: actions/upload-artifact@v3
      with:
        name: rag-reports
        path: .rag/reports/
        
    - name: Create summary
      if: always()
      run: |
        echo "## RAG Analysis Complete" >> $GITHUB_STEP_SUMMARY
        echo "Reports available as artifacts" >> $GITHUB_STEP_SUMMARY
"""
        
        with open(workflow_file, 'w', encoding='utf-8') as f:
            f.write(workflow_content)
        
        print(f"  ✅ GitHub Actions 工作流: {workflow_file}")
    
    def setup_gitlab_ci(self):
        """設置 GitLab CI"""
        print("  🚢 設置 GitLab CI...")
        
        gitlab_ci_file = self.project_dir / ".gitlab-ci.yml"
        
        # 檢查是否已存在 GitLab CI 配置
        existing_content = ""
        if gitlab_ci_file.exists():
            with open(gitlab_ci_file, 'r', encoding='utf-8') as f:
                existing_content = f.read()
        
        rag_section = """
# RAG Analysis
rag-analysis:
  stage: test
  image: python:3.9-slim
  script:
    - pip install --upgrade pip
    - python -m rag_automation
  artifacts:
    paths:
      - .rag/reports/
    expire_in: 1 week
  only:
    - main
    - develop
    - merge_requests
"""
        
        if "rag-analysis:" not in existing_content:
            with open(gitlab_ci_file, 'a', encoding='utf-8') as f:
                f.write(rag_section)
            print(f"  ✅ GitLab CI 配置已更新: {gitlab_ci_file}")
        else:
            print(f"  ⚠️  GitLab CI 配置已包含 RAG 分析")
    
    def create_readme(self):
        """創建 README"""
        print("  📄 創建 README...")
        
        readme_file = self.project_dir / "RAG-AUTOMATION.md"
        
        readme_content = """# RAG 自動化集成

## 概述
此項目已配置 RAG（檢索增強生成）自動化分析系統，用於持續監控和改進項目質量。

## 功能
- 自動項目結構分析
- 代碼質量評估
- 改進建議生成
- 自動化報告

## 配置
配置位於 `.rag/automation.json`，包含以下集成：

### 已啟用的集成
"""

        # 添加集成列表
        integrations = self.config.get("integrations", {})
        for category, tools in integrations.items():
            for tool, config in tools.items():
                if config.get("enabled", False):
                    readme_content += f"- **{category}.{tool}**: 已啟用\n"
        
        readme_content += """
## 使用方法

### 手動運行
```bash
# 運行 RAG 分析
python -m rag_automation

# 或使用提供的腳本
./scripts/rag-analysis.sh
```

### 自動觸發
- **GitHub Actions**: 在 push、PR 或定時觸發
- **GitLab CI**: 在流水線中自動運行

### 查看報告
報告位於 `.rag/reports/` 目錄：
```bash
# 查看最新報告
cat .rag/reports/latest.json | jq .

# 或直接查看
ls -la .rag/reports/
```

## 輸出
每次分析生成：
1. **分析報告** (`analysis_*.json`): 詳細項目分析
2. **決策報告** (`decisions_*.json`): 改進建議和計劃
3. **摘要報告** (`summary_*.md`): 人類可讀摘要

## 集成詳情

### GitHub Actions
工作流文件: `.github/workflows/rag-analysis.yml`
觸發條件: push、PR、定時、手動

### GitLab CI
階段: `rag-analysis`
觸發條件: 主分支、開發分支、合併請求

### 通知
- Slack: 分析完成時發送通知
- Discord: 分析完成時發送通知

## 自定義配置
編輯 `.rag/automation.json` 自定義：
- 觸發條件
- 輸出格式
- 集成設置

## 故障排除

### 常見問題
1. **分析失敗**: 檢查 Python 環境和依賴
2. **報告未生成**: 檢查文件權限和路徑
3. **集成無效**: 驗證配置參數

### 獲取幫助
查看詳細文檔或聯繫維護者。
"""
        
        with open(readme_file, 'w', encoding='utf-8') as f:
            f.write(readme_content)
        
        print(f"  ✅ README 文件: {readme_file}")
    
    def run_analysis(self):
        """運行分析"""
        print("\n🔍 運行 RAG 分析...")
        
        # 這裡可以調用 RAG 系統
        # 暫時創建示例報告
        reports_dir = self.project_dir / self.config["output"]["reports_dir"]
        reports_dir.mkdir(parents=True, exist_ok=True)
        
        example_report = {
            "status": "success",
            "timestamp": "2024-01-24T07:30:00",
            "project": self.project_dir.name,
            "message": "RAG 分析已設置完成，請配置具體的 RAG 系統以獲取詳細分析。"
        }
        
        report_file = reports_dir / "setup_complete.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(example_report, f, indent=2, ensure_ascii=False)
        
        print(f"✅ 示例報告: {report_file}")
        print("💡 提示: 需要配置具體的 RAG 系統以獲取詳細分析")

def main():
    """主函數"""
    if len(sys.argv) > 1 and sys.argv[1] == "--run":
        # 運行分析模式
        setup = AutomationSetup()
        setup.config = {
            "output": {
                "reports_dir": ".rag/reports"
            }
        }
        setup.run_analysis()
    else:
        # 設置模式
        setup = AutomationSetup()
        setup.setup_all()

if __name__ == "__main__":
    main()