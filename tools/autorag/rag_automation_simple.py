#!/usr/bin/env python3
"""
RAG 自動化集成 - 簡單實用版本
提供最常用的自動化集成功能
"""

import os
import sys
import json
import requests
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional

class SimpleRAGAutomation:
    """簡單的 RAG 自動化集成"""
    
    def __init__(self, config_file: str = ".rag-config.json"):
        self.config = self.load_config(config_file)
        self.project_dir = Path.cwd()
        
    def load_config(self, config_file: str) -> Dict[str, Any]:
        """加載配置"""
        default_config = {
            "enabled": True,
            "integrations": {
                "slack": {
                    "enabled": False,
                    "webhook_url": os.getenv("SLACK_WEBHOOK_URL", "")
                },
                "github": {
                    "enabled": False,
                    "token": os.getenv("GITHUB_TOKEN", ""),
                    "repo": os.getenv("GITHUB_REPOSITORY", "")
                },
                "webhook": {
                    "enabled": False,
                    "url": os.getenv("WEBHOOK_URL", "")
                }
            },
            "analysis": {
                "auto_run": True,
                "output_dir": "rag-reports",
                "create_summary": True
            }
        }
        
        config_path = Path(config_file)
        if config_path.exists():
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    user_config = json.load(f)
                    # 合併配置
                    self.merge_config(default_config, user_config)
            except Exception as e:
                print(f"⚠️  無法讀取配置文件: {e}")
        
        return default_config
    
    def merge_config(self, default: Dict, user: Dict):
        """合併配置"""
        for key in user:
            if key in default:
                if isinstance(default[key], dict) and isinstance(user[key], dict):
                    self.merge_config(default[key], user[key])
                else:
                    default[key] = user[key]
    
    def run(self):
        """運行自動化流程"""
        print("=" * 60)
        print("🚀 RAG 自動化分析")
        print("=" * 60)
        
        if not self.config["enabled"]:
            print("❌ 自動化已禁用")
            return
        
        # 運行分析
        analysis_result = self.run_analysis()
        if not analysis_result:
            print("❌ 分析失敗")
            return
        
        # 觸發集成
        self.trigger_integrations(analysis_result)
        
        print("\n" + "=" * 60)
        print("🎉 自動化完成")
        print("=" * 60)
    
    def run_analysis(self) -> Optional[Dict[str, Any]]:
        """運行 RAG 分析"""
        print("\n🔍 運行分析...")
        
        try:
            # 檢查 RAG 系統
            rag_main = Path(__file__).parent / "main.py"
            if not rag_main.exists():
                print("❌ 找不到 RAG 主程序")
                return None
            
            # 創建輸出目錄
            output_dir = Path(self.config["analysis"]["output_dir"])
            output_dir.mkdir(exist_ok=True)
            
            # 運行分析
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = output_dir / f"analysis_{timestamp}.json"
            
            cmd = [sys.executable, str(rag_main), str(self.project_dir)]
            
            print(f"  命令: {' '.join(cmd)}")
            print(f"  輸出: {output_file}")
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300  # 5分鐘超時
            )
            
            if result.returncode != 0:
                print(f"❌ 分析失敗: {result.stderr[:200]}")
                return None
            
            # 嘗試解析輸出
            try:
                # 假設輸出是 JSON
                analysis_data = json.loads(result.stdout)
            except json.JSONDecodeError:
                # 如果不是 JSON，創建簡單報告
                analysis_data = {
                    "status": "success",
                    "timestamp": timestamp,
                    "project": self.project_dir.name,
                    "output": result.stdout[:1000]  # 限制長度
                }
            
            # 保存報告
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(analysis_data, f, indent=2, ensure_ascii=False)
            
            print(f"✅ 分析完成: {output_file}")
            
            # 創建摘要
            if self.config["analysis"]["create_summary"]:
                self.create_summary(analysis_data, output_dir, timestamp)
            
            return analysis_data
            
        except subprocess.TimeoutExpired:
            print("❌ 分析超時")
            return None
        except Exception as e:
            print(f"❌ 分析錯誤: {e}")
            return None
    
    def create_summary(self, analysis_data: Dict, output_dir: Path, timestamp: str):
        """創建摘要"""
        summary_file = output_dir / f"summary_{timestamp}.md"
        
        summary = f"""# RAG 分析摘要

## 基本信息
- **項目**: {self.project_dir.name}
- **時間**: {timestamp}
- **狀態**: {analysis_data.get('status', 'unknown')}

## 分析結果
"""
        
        # 添加具體分析結果
        if "overall_assessment" in analysis_data:
            assessment = analysis_data["overall_assessment"]
            summary += f"""
### 總體評估
- **分數**: {assessment.get('overall_score', 0)}/100
- **成熟度**: {assessment.get('maturity_level', 'unknown')}
- **生產就緒**: {'✅ 是' if assessment.get('readiness_for_production', False) else '❌ 否'}
"""
        
        if "recommendations" in analysis_data:
            recs = analysis_data["recommendations"]
            if recs:
                summary += "\n### 主要建議\n"
                for i, rec in enumerate(recs[:5], 1):
                    summary += f"{i}. {rec.get('description', '')}\n"
        
        summary += f"""
## 詳細報告
完整報告: {output_dir / f'analysis_{timestamp}.json'}

---
*自動生成於 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*
"""
        
        with open(summary_file, 'w', encoding='utf-8') as f:
            f.write(summary)
        
        print(f"📄 摘要文件: {summary_file}")
    
    def trigger_integrations(self, analysis_data: Dict):
        """觸發集成"""
        print("\n🔌 觸發集成...")
        
        integrations = self.config["integrations"]
        
        # Slack 集成
        if integrations["slack"]["enabled"] and integrations["slack"]["webhook_url"]:
            self.send_slack_notification(analysis_data)
        
        # Webhook 集成
        if integrations["webhook"]["enabled"] and integrations["webhook"]["url"]:
            self.send_webhook(analysis_data)
        
        # GitHub 集成
        if integrations["github"]["enabled"]:
            self.handle_github_integration(analysis_data)
    
    def send_slack_notification(self, analysis_data: Dict):
        """發送 Slack 通知"""
        print("  💬 發送 Slack 通知...")
        
        webhook_url = self.config["integrations"]["slack"]["webhook_url"]
        
        # 創建消息
        project_name = analysis_data.get("project_info", {}).get("name", self.project_dir.name)
        assessment = analysis_data.get("overall_assessment", {})
        score = assessment.get("overall_score", 0)
        level = assessment.get("maturity_level", "unknown")
        
        message = {
            "blocks": [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"📊 *RAG 分析完成: {project_name}*"
                    }
                },
                {
                    "type": "section",
                    "fields": [
                        {
                            "type": "mrkdwn",
                            "text": f"*分數:* {score}/100"
                        },
                        {
                            "type": "mrkdwn",
                            "text": f"*等級:* {level}"
                        }
                    ]
                }
            ]
        }
        
        try:
            response = requests.post(webhook_url, json=message, timeout=10)
            if response.status_code == 200:
                print("  ✅ Slack 通知發送成功")
            else:
                print(f"  ⚠️  Slack 通知失敗: {response.status_code}")
        except Exception as e:
            print(f"  ❌ Slack 通知錯誤: {e}")
    
    def send_webhook(self, analysis_data: Dict):
        """發送 Webhook"""
        print("  🌐 發送 Webhook...")
        
        webhook_url = self.config["integrations"]["webhook"]["url"]
        
        payload = {
            "event": "rag_analysis_complete",
            "timestamp": datetime.now().isoformat(),
            "project": self.project_dir.name,
            "data": {
                "score": analysis_data.get("overall_assessment", {}).get("overall_score", 0),
                "status": analysis_data.get("status", "unknown")
            }
        }
        
        try:
            response = requests.post(webhook_url, json=payload, timeout=10)
            if response.status_code in [200, 201, 204]:
                print("  ✅ Webhook 發送成功")
            else:
                print(f"  ⚠️  Webhook 失敗: {response.status_code}")
        except Exception as e:
            print(f"  ❌ Webhook 錯誤: {e}")
    
    def handle_github_integration(self, analysis_data: Dict):
        """處理 GitHub 集成"""
        print("  🐙 處理 GitHub 集成...")
        
        token = self.config["integrations"]["github"]["token"]
        repo = self.config["integrations"]["github"]["repo"]
        
        if not token or not repo:
            print("  ⚠️  GitHub 配置不完整")
            return
        
        # 檢查是否在 GitHub Actions 環境中
        if os.getenv("GITHUB_ACTIONS") == "true":
            self.create_github_comment(analysis_data, token, repo)
    
    def create_github_comment(self, analysis_data: Dict, token: str, repo: str):
        """創建 GitHub 評論"""
        # 在 GitHub Actions 環境中，可以通過環境變量獲取信息
        pr_number = os.getenv("GITHUB_PR_NUMBER")
        sha = os.getenv("GITHUB_SHA")
        
        if not pr_number and not sha:
            print("  ⚠️  不在 PR 或特定提交上下文中")
            return
        
        # 這裡可以實現 GitHub API 調用
        # 暫時只打印信息
        print(f"  📝 可以為 PR #{pr_number} 或提交 {sha[:8]} 創建評論")
        
        # 示例 API 調用（需要實現）
        # headers = {"Authorization": f"token {token}"}
        # url = f"https://api.github.com/repos/{repo}/issues/{pr_number}/comments"
        # comment = {"body": f"RAG 分析完成，分數: {analysis_data.get('overall_assessment', {}).get('overall_score', 0)}/100"}
        # requests.post(url, json=comment, headers=headers)

def main():
    """主函數"""
    # 檢查命令行參數
    if len(sys.argv) > 1:
        if sys.argv[1] == "--setup":
            setup_automation()
            return
        elif sys.argv[1] == "--config":
            show_config()
            return
    
    # 運行自動化
    automation = SimpleRAGAutomation()
    automation.run()

def setup_automation():
    """設置自動化"""
    print("🔧 設置 RAG 自動化")
    print("=" * 60)
    
    config = {
        "enabled": True,
        "integrations": {},
        "analysis": {
            "auto_run": True,
            "output_dir": "rag-reports",
            "create_summary": True
        }
    }
    
    print("\n選擇集成 (輸入 y/n):")
    
    # Slack
    if input("  啟用 Slack 集成? (y/N): ").lower() == 'y':
        webhook = input("  Slack Webhook URL: ").strip()
        config["integrations"]["slack"] = {
            "enabled": True,
            "webhook_url": webhook
        }
    
    # Webhook
    if input("\n  啟用通用 Webhook? (y/N): ").lower() == 'y':
        url = input("  Webhook URL: ").strip()
        config["integrations"]["webhook"] = {
            "enabled": True,
            "url": url
        }
    
    # 保存配置
    config_file = ".rag-config.json"
    with open(config_file, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ 配置已保存: {config_file}")
    
    # 創建 GitHub Actions 示例
    create_github_actions_example()
    
    print("\n📋 下一步:")
    print("1. 提交配置到版本控制")
    print("2. 設置環境變量 (如需要)")
    print("3. 運行: python rag_automation_simple.py")
    print("=" * 60)

def show_config():
    """顯示配置"""
    config_file = ".rag-config.json"
    
    if Path(config_file).exists():
        with open(config_file, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        print("📋 當前配置:")
        print(json.dumps(config, indent=2, ensure_ascii=False))
    else:
        print("❌ 配置文件不存在")
        print("運行: python rag_automation_simple.py --setup 創建設置")

def create_github_actions_example():
    """創建 GitHub Actions 示例"""
    workflow_dir = Path(".github/workflows")
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
        
    - name: Run RAG automation
      run: |
        python rag_automation_simple.py
        
    - name: Upload reports
      uses: actions/upload-artifact@v3
      with:
        name: rag-reports
        path: rag-reports/
"""
    
    with open(workflow_file, 'w', encoding='utf-8') as f:
        f.write(workflow_content)
    
    print(f"📦 GitHub Actions 示例: {workflow_file}")

if __name__ == "__main__":
    main()