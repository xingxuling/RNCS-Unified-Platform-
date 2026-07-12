#!/usr/bin/env python3
"""
測試新模塊：領域抽象模塊和目標自驅模塊
"""

import os
import sys
import json
from pathlib import Path

# 添加模塊路徑
sys.path.insert(0, str(Path(__file__).parent / "modules"))

from domain_abstraction_module import DomainAbstractionModule
from goal_driven_module import GoalDrivenModule

def test_domain_abstraction_module():
    """測試領域抽象模塊"""
    print("🧪 測試領域抽象模塊")
    print("=" * 50)
    
    # 使用測試項目
    test_project = Path(__file__).parent / "test-project"
    
    if not test_project.exists():
        print(f"❌ 測試項目不存在: {test_project}")
        return
    
    # 創建領域抽象模塊
    domain_module = DomainAbstractionModule(str(test_project))
    
    # 創建測試分析報告
    test_report = {
        "project_info": {
            "name": test_project.name,
            "path": str(test_project)
        },
        "overall_assessment": {
            "overall_score": 75,
            "maturity_level": "intermediate"
        },
        "recommendations": [
            {"description": "添加單元測試"},
            {"description": "優化性能"}
        ]
    }
    
    # 檢測領域
    domains = domain_module.detect_domains(test_report)
    print(f"檢測到的領域: {domains}")
    
    # 生成領域報告
    domain_report = domain_module.generate_domain_report(test_report)
    
    print(f"主要領域: {domain_report.get('domain_analysis', {}).get('primary_domain', '未知')}")
    print(f"領域置信度: {domain_report.get('domain_analysis', {}).get('domain_confidence', 0)}%")
    print(f"洞察數量: {domain_report.get('insights', {}).get('total_insights', 0)}")
    print(f"建議數量: {domain_report.get('recommendations', {}).get('total_recommendations', 0)}")
    
    # 保存報告
    output_dir = Path(__file__).parent / "output" / "test_domain"
    output_dir.mkdir(parents=True, exist_ok=True)
    report_path = output_dir / "domain_test_report.json"
    domain_module.save_report(domain_report, str(report_path))
    
    print(f"✅ 領域分析報告已保存: {report_path}")
    print()

def test_goal_driven_module():
    """測試目標自驅模塊"""
    print("🧪 測試目標自驅模塊")
    print("=" * 50)
    
    # 使用測試項目
    test_project = Path(__file__).parent / "test-project"
    
    if not test_project.exists():
        print(f"❌ 測試項目不存在: {test_project}")
        return
    
    # 創建目標自驅模塊
    goal_module = GoalDrivenModule(str(test_project))
    
    # 創建測試分析報告
    test_report = {
        "project_info": {
            "name": test_project.name,
            "path": str(test_project)
        },
        "issues": [
            {"description": "應用程序加載速度慢，需要性能優化"},
            {"description": "存在安全漏洞需要修復"},
            {"description": "代碼質量較差，需要重構"}
        ],
        "recommendations": [
            {"description": "實施代碼分割以提高性能"},
            {"description": "修復安全漏洞"}
        ],
        "overall_assessment": {
            "overall_score": 65,
            "maturity_level": "intermediate"
        }
    }
    
    # 設置目標
    goals = ["improve_performance", "enhance_security", "improve_code_quality"]
    goal_analysis = goal_module.set_goals(goals, test_report)
    
    # 生成目標報告
    goal_report = goal_module.generate_goal_report(goal_analysis)
    
    print(f"總目標數: {goal_report['summary']['total_goals']}")
    print(f"高優先級目標: {goal_report['summary']['high_priority_goals']}")
    print(f"平均相關性: {goal_report['summary']['average_relevance']:.1f}%")
    print(f"推薦焦點: {', '.join(goal_report['summary']['recommended_focus'])}")
    
    # 保存報告
    output_dir = Path(__file__).parent / "output" / "test_goal"
    output_dir.mkdir(parents=True, exist_ok=True)
    report_path = output_dir / "goal_test_report.json"
    goal_module.save_report(goal_report, str(report_path))
    
    print(f"✅ 目標分析報告已保存: {report_path}")
    print()

def test_integration():
    """測試模塊集成"""
    print("🧪 測試模塊集成")
    print("=" * 50)
    
    # 使用測試項目
    test_project = Path(__file__).parent / "test-project"
    
    if not test_project.exists():
        print(f"❌ 測試項目不存在: {test_project}")
        return
    
    # 創建測試分析報告
    test_report = {
        "project_info": {
            "name": test_project.name,
            "path": str(test_project)
        },
        "issues": [
            {"description": "性能問題需要優化"},
            {"description": "安全漏洞需要修復"}
        ],
        "recommendations": [
            {"description": "性能優化建議"},
            {"description": "安全加固建議"}
        ],
        "overall_assessment": {
            "overall_score": 70,
            "maturity_level": "intermediate"
        }
    }
    
    # 測試領域抽象模塊
    print("1. 領域抽象模塊:")
    domain_module = DomainAbstractionModule(str(test_project))
    domains = domain_module.detect_domains(test_report)
    print(f"   檢測到的領域: {domains}")
    
    # 測試目標自驅模塊
    print("2. 目標自驅模塊:")
    goal_module = GoalDrivenModule(str(test_project))
    goals = ["improve_performance", "enhance_security"]
    goal_analysis = goal_module.set_goals(goals, test_report)
    print(f"   設置目標: {list(goal_analysis.keys())}")
    
    # 測試集成效果
    print("3. 集成分析:")
    if domains and "web_application" in domains:
        print("   ✅ 檢測到Web應用程序領域")
        print("   📋 推薦優化重點: 前端性能、用戶體驗、安全性")
    
    if goal_analysis:
        high_priority = [k for k, v in goal_analysis.items() if v.get("priority") in ["high", "critical"]]
        if high_priority:
            print(f"   🎯 高優先級目標: {high_priority}")
            print("   📋 推薦實施計劃: 優先處理高優先級目標")
    
    print()

def main():
    """主函數"""
    print("🚀 開始測試新模塊")
    print("=" * 60)
    
    # 創建輸出目錄
    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    
    # 運行測試
    test_domain_abstraction_module()
    test_goal_driven_module()
    test_integration()
    
    print("✅ 所有測試完成")
    print("📊 測試結果保存在 output/ 目錄")

if __name__ == "__main__":
    main()