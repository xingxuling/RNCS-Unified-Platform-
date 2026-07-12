#!/usr/bin/env python3
"""
增強版 RAG 自動化系統集成新模塊運行腳本
簡化版本，展示如何集成領域抽象和目標自驅模塊
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime

# 添加模塊路徑
sys.path.insert(0, str(Path(__file__).parent / "modules"))

from rag_analyzer import ProjectAnalyzer
from domain_abstraction_module import DomainAbstractionModule
from goal_driven_module import GoalDrivenModule

def run_enhanced_analysis_with_modules(project_path: str):
    """運行增強版分析（集成新模塊）"""
    print("=" * 70)
    print("🚀 增強版 RAG 自動化系統（集成領域抽象和目標自驅模塊）")
    print("=" * 70)
    print(f"📁 分析項目: {project_path}")
    
    # 創建結果目錄
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_dir = Path(__file__).parent / "output" / f"enhanced_{timestamp}"
    results_dir.mkdir(parents=True, exist_ok=True)
    print(f"📊 結果目錄: {results_dir}")
    print("=" * 70)
    
    # 步驟 1: RAG 分析
    print("\n1️⃣  RAG 分析階段")
    print("-" * 45)
    print("🔍 執行 RAG 分析...")
    
    analyzer = ProjectAnalyzer(project_path)
    analysis_report = analyzer.generate_analysis_report()
    
    # 保存分析報告
    analysis_path = results_dir / "analysis_report.json"
    analyzer.save_report(analysis_report, str(analysis_path))
    
    assessment = analysis_report.get("overall_assessment", {})
    print(f"✅ 分析完成:")
    print(f"   總體分數: {assessment.get('overall_score', 0):.1f}/100")
    print(f"   成熟度等級: {assessment.get('maturity_level', 'unknown')}")
    print(f"   建議數量: {len(analysis_report.get('recommendations', []))}")
    
    # 步驟 2: 領域分析
    print("\n2️⃣  領域分析階段")
    print("-" * 45)
    print("🏢 執行領域分析...")
    
    domain_module = DomainAbstractionModule(project_path)
    domains = domain_module.detect_domains(analysis_report)
    domain_report = domain_module.generate_domain_report(analysis_report)
    
    # 保存領域報告
    domain_path = results_dir / "domain_analysis.json"
    domain_module.save_report(domain_report, str(domain_path))
    
    print(f"✅ 領域分析完成:")
    print(f"   檢測到的領域: {', '.join(domains) if domains else '無'}")
    print(f"   主要領域: {domain_report.get('domain_analysis', {}).get('primary_domain', '未知')}")
    print(f"   領域置信度: {domain_report.get('domain_analysis', {}).get('domain_confidence', 0)}%")
    
    # 步驟 3: 目標驅動優化
    print("\n3️⃣  目標驅動優化階段")
    print("-" * 45)
    print("🎯 執行目標驅動優化...")
    
    goal_module = GoalDrivenModule(project_path)
    
    # 根據領域選擇目標
    default_goals = ["improve_performance", "enhance_security", "improve_code_quality"]
    
    # 如果檢測到特定領域，調整目標
    primary_domain = domain_report.get('domain_analysis', {}).get('primary_domain')
    if primary_domain == "web_application":
        default_goals = ["improve_performance", "optimize_user_experience", "enhance_security"]
    elif primary_domain == "api_service":
        default_goals = ["enhance_security", "improve_performance", "increase_reliability"]
    
    goal_analysis = goal_module.set_goals(default_goals, analysis_report)
    goal_report = goal_module.generate_goal_report(goal_analysis)
    
    # 保存目標報告
    goal_path = results_dir / "goal_analysis.json"
    goal_module.save_report(goal_report, str(goal_path))
    
    print(f"✅ 目標分析完成:")
    print(f"   設置目標: {len(goal_analysis)} 個")
    print(f"   高優先級目標: {goal_report.get('summary', {}).get('high_priority_goals', 0)} 個")
    print(f"   推薦焦點: {', '.join(goal_report.get('summary', {}).get('recommended_focus', []))}")
    
    # 步驟 4: 生成綜合報告
    print("\n4️⃣  生成綜合報告")
    print("-" * 45)
    print("📄 生成增強版綜合報告...")
    
    # 創建綜合報告
    comprehensive_report = {
        "system_info": {
            "name": "增強版 RAG 自動化系統（集成新模塊）",
            "version": "1.0.0",
            "execution_time": timestamp,
            "project_path": project_path
        },
        "project_info": {
            "name": Path(project_path).name,
            "path": project_path,
            "overall_score": assessment.get('overall_score', 0),
            "maturity_level": assessment.get('maturity_level', 'unknown')
        },
        "domain_analysis": {
            "detected_domains": domains,
            "primary_domain": domain_report.get('domain_analysis', {}).get('primary_domain'),
            "domain_confidence": domain_report.get('domain_analysis', {}).get('domain_confidence', 0),
            "key_insights": domain_report.get('insights', {}).get('domain_specific_insights', [])
        },
        "goal_analysis": {
            "active_goals": list(goal_analysis.keys()),
            "goal_details": goal_analysis,
            "recommended_focus": goal_report.get('summary', {}).get('recommended_focus', [])
        },
        "integration_insights": generate_integration_insights(domain_report, goal_report),
        "optimization_recommendations": generate_optimization_recommendations(domain_report, goal_report),
        "next_steps": generate_next_steps(domain_report, goal_report)
    }
    
    # 保存綜合報告
    comprehensive_path = results_dir / "comprehensive_report.json"
    with open(comprehensive_path, 'w', encoding='utf-8') as f:
        json.dump(comprehensive_report, f, indent=2, ensure_ascii=False)
    
    # 創建文本摘要
    summary_path = results_dir / "summary.txt"
    create_text_summary(comprehensive_report, summary_path)
    
    print(f"✅ 綜合報告生成完成:")
    print(f"   綜合報告: {comprehensive_path}")
    print(f"   文本摘要: {summary_path}")
    
    # 打印最終摘要
    print("\n" + "=" * 70)
    print("🎉 增強版 RAG 自動化系統執行完成!")
    print("=" * 70)
    print(f"項目: {Path(project_path).name}")
    print(f"主要領域: {comprehensive_report['domain_analysis']['primary_domain']}")
    print(f"領域置信度: {comprehensive_report['domain_analysis']['domain_confidence']}%")
    print(f"活躍目標: {len(comprehensive_report['goal_analysis']['active_goals'])} 個")
    print(f"推薦焦點: {', '.join(comprehensive_report['goal_analysis']['recommended_focus'])}")
    print(f"詳細報告請查看: {results_dir}")
    print("=" * 70)
    
    return comprehensive_report

def generate_integration_insights(domain_report, goal_report):
    """生成集成洞察"""
    insights = []
    
    primary_domain = domain_report.get('domain_analysis', {}).get('primary_domain')
    recommended_focus = goal_report.get('summary', {}).get('recommended_focus', [])
    
    if primary_domain:
        insights.append(f"項目屬於{primary_domain}領域，優化應聚焦領域特定需求")
    
    if recommended_focus:
        insights.append(f"基於目標分析，推薦優先處理: {', '.join(recommended_focus[:3])}")
    
    # 領域特定洞察
    if primary_domain == "web_application":
        insights.append("Web應用應重點關注前端性能和用戶體驗")
    elif primary_domain == "api_service":
        insights.append("API服務應重點關注安全性和可靠性")
    
    return insights

def generate_optimization_recommendations(domain_report, goal_report):
    """生成優化建議"""
    recommendations = []
    
    primary_domain = domain_report.get('domain_analysis', {}).get('primary_domain')
    goal_details = goal_report.get('goal_analysis', {})
    
    # 領域特定建議
    if primary_domain == "web_application":
        recommendations.extend([
            "實施響應式設計和移動端優化",
            "優化前端資源加載和緩存策略",
            "加強Web安全防護（XSS、CSRF等）"
        ])
    elif primary_domain == "api_service":
        recommendations.extend([
            "實施API版本控制和文檔生成",
            "加強認證授權和安全防護",
            "優化API性能和可靠性"
        ])
    
    # 目標驅動建議
    for goal_key, goal_info in goal_details.items():
        if goal_info.get('priority') in ['high', 'critical']:
            goal_name = goal_info.get('definition', {}).get('name', goal_key)
            recommendations.append(f"優先處理{goal_name}相關優化")
    
    return recommendations

def generate_next_steps(domain_report, goal_report):
    """生成下一步"""
    next_steps = [
        "1. 查看詳細分析報告了解具體問題",
        "2. 根據領域特徵實施針對性優化",
        "3. 按照目標優先級制定實施計劃",
        "4. 監控優化效果並持續改進"
    ]
    
    primary_domain = domain_report.get('domain_analysis', {}).get('primary_domain')
    if primary_domain:
        next_steps.append(f"5. 參考{primary_domain}領域最佳實踐")
    
    return next_steps

def create_text_summary(report, output_path):
    """創建文本摘要"""
    summary = f"""增強版 RAG 自動化系統 - 分析結果摘要
================================================

執行時間: {report['system_info']['execution_time']}
項目名稱: {report['project_info']['name']}
項目路徑: {report['project_info']['path']}

📊 項目概況
------------------------------------------------
總體分數: {report['project_info']['overall_score']}/100
成熟度等級: {report['project_info']['maturity_level']}

🏢 領域分析
------------------------------------------------
檢測到的領域: {', '.join(report['domain_analysis']['detected_domains'])}
主要領域: {report['domain_analysis']['primary_domain']}
領域置信度: {report['domain_analysis']['domain_confidence']}%

🎯 目標分析
------------------------------------------------
活躍目標: {len(report['goal_analysis']['active_goals'])} 個
推薦焦點: {', '.join(report['goal_analysis']['recommended_focus'])}

💡 集成洞察
------------------------------------------------
"""
    
    for i, insight in enumerate(report['integration_insights'], 1):
        summary += f"{i}. {insight}\n"
    
    summary += """
📋 優化建議
------------------------------------------------
"""
    
    for i, recommendation in enumerate(report['optimization_recommendations'], 1):
        summary += f"{i}. {recommendation}\n"
    
    summary += """
🚀 下一步
------------------------------------------------
"""
    
    for step in report['next_steps']:
        summary += f"{step}\n"
    
    summary += """
================================================
詳細報告請查看 JSON 文件
================================================
"""
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(summary)

def main():
    """主函數"""
    if len(sys.argv) < 2:
        print("用法: python run_enhanced_with_modules.py <項目路徑>")
        print("示例: python run_enhanced_with_modules.py /path/to/your/project")
        print("\n可用測試項目:")
        print("  python run_enhanced_with_modules.py test-project")
        sys.exit(1)
    
    project_path = sys.argv[1]
    
    if not os.path.exists(project_path):
        print(f"錯誤: 項目路徑不存在: {project_path}")
        sys.exit(1)
    
    # 運行增強版分析
    report = run_enhanced_analysis_with_modules(project_path)
    
    # 打印成功消息
    print(f"\n✅ 分析完成！請查看 output/ 目錄中的報告文件。")

if __name__ == "__main__":
    main()