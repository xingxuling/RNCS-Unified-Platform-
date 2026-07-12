#!/usr/bin/env python3
"""
目標自驅模塊
根據設定的目標自動驅動優化過程，生成目標導向的實施計劃
"""

import os
import json
import re
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime

class GoalDrivenModule:
    """目標自驅模塊"""
    
    def __init__(self, project_path: str):
        self.project_path = Path(project_path)
        self.goal_definitions = self._load_goal_definitions()
        self.active_goals = []
        self.goal_progress = {}
        
    def _load_goal_definitions(self) -> Dict[str, Any]:
        """加載目標定義"""
        return {
            "improve_performance": {
                "name": "提高性能",
                "description": "優化應用程序性能",
                "metrics": ["加載時間", "FPS", "內存使用"],
                "strategies": ["代碼分割", "圖片優化", "緩存策略"],
                "priority": "high",
                "success_criteria": ["加載時間減少30%", "FPS穩定在60"]
            },
            "enhance_security": {
                "name": "增強安全性",
                "description": "提高應用程序安全性",
                "metrics": ["安全漏洞數", "依賴漏洞"],
                "strategies": ["輸入驗證", "認證加固", "依賴更新"],
                "priority": "high",
                "success_criteria": ["零高危漏洞", "所有依賴更新"]
            },
            "improve_code_quality": {
                "name": "改善代碼質量",
                "description": "提高代碼可讀性和可維護性",
                "metrics": ["代碼覆蓋率", "圈複雜度"],
                "strategies": ["代碼重構", "單元測試", "文檔生成"],
                "priority": "medium",
                "success_criteria": ["代碼覆蓋率>80%", "圈複雜度<10"]
            },
            "optimize_user_experience": {
                "name": "優化用戶體驗",
                "description": "改善用戶界面和交互體驗",
                "metrics": ["用戶滿意度", "錯誤率"],
                "strategies": ["UI改進", "錯誤處理", "加載優化"],
                "priority": "medium",
                "success_criteria": ["用戶滿意度>4/5", "錯誤率<1%"]
            }
        }
    
    def set_goals(self, goals: List[str], analysis_report: Dict[str, Any]) -> Dict[str, Any]:
        """設置目標並分析相關性"""
        print("🎯 設置優化目標...")
        
        self.active_goals = []
        goal_analysis = {}
        
        for goal_key in goals:
            if goal_key in self.goal_definitions:
                goal_def = self.goal_definitions[goal_key]
                
                # 分析目標與項目的相關性
                relevance = self._analyze_goal_relevance(goal_key, analysis_report)
                
                # 生成目標特定的建議
                recommendations = self._generate_goal_recommendations(goal_key, analysis_report)
                
                # 創建實施計劃
                implementation_plan = self._create_implementation_plan(goal_key)
                
                goal_analysis[goal_key] = {
                    "definition": goal_def,
                    "relevance_score": relevance["score"],
                    "relevance_analysis": relevance["analysis"],
                    "recommendations": recommendations,
                    "implementation_plan": implementation_plan,
                    "priority": self._calculate_goal_priority(goal_key, relevance["score"])
                }
                
                self.active_goals.append(goal_key)
                print(f"  ✅ 設置目標: {goal_def['name']} (相關性: {relevance['score']}/100)")
        
        return goal_analysis
    
    def _analyze_goal_relevance(self, goal_key: str, analysis_report: Dict[str, Any]) -> Dict[str, Any]:
        """分析目標與項目的相關性"""
        score = 50  # 基礎分數
        analysis = []
        
        # 從分析報告中提取信息
        issues = analysis_report.get("issues", [])
        recommendations = analysis_report.get("recommendations", [])
        
        if goal_key == "improve_performance":
            # 檢查性能相關問題
            perf_issues = [issue for issue in issues if "性能" in issue.get("description", "")]
            
            if perf_issues:
                score += len(perf_issues) * 10
                analysis.append(f"發現{len(perf_issues)}個性能相關問題")
        
        elif goal_key == "enhance_security":
            # 檢查安全相關問題
            security_issues = [issue for issue in issues if "安全" in issue.get("description", "")]
            
            if security_issues:
                score += len(security_issues) * 15
                analysis.append(f"發現{len(security_issues)}個安全相關問題")
        
        elif goal_key == "improve_code_quality":
            # 檢查代碼質量問題
            quality_issues = [issue for issue in issues if "質量" in issue.get("description", "")]
            
            if quality_issues:
                score += len(quality_issues) * 8
                analysis.append(f"發現{len(quality_issues)}個代碼質量問題")
        
        elif goal_key == "optimize_user_experience":
            # 檢查UI/UX相關問題
            ux_issues = [issue for issue in issues if "用戶" in issue.get("description", "")]
            
            if ux_issues:
                score += len(ux_issues) * 10
                analysis.append(f"發現{len(ux_issues)}個用戶體驗問題")
        
        # 限制分數在0-100之間
        score = max(0, min(100, score))
        
        if not analysis:
            analysis.append("未發現明顯相關問題，但目標仍然相關")
        
        return {
            "score": score,
            "analysis": analysis
        }
    
    def _calculate_goal_priority(self, goal_key: str, relevance_score: int) -> str:
        """計算目標優先級"""
        goal_def = self.goal_definitions[goal_key]
        base_priority = goal_def["priority"]
        
        # 根據相關性分數調整優先級
        if relevance_score >= 80:
            return "critical"
        elif relevance_score >= 60:
            return "high" if base_priority == "high" else "medium"
        elif relevance_score >= 40:
            return base_priority
        else:
            return "low"
    
    def _generate_goal_recommendations(self, goal_key: str, analysis_report: Dict[str, Any]) -> List[Dict[str, Any]]:
        """生成目標特定的建議"""
        recommendations = []
        goal_def = self.goal_definitions[goal_key]
        
        # 基於目標策略生成建議
        for strategy in goal_def["strategies"]:
            recommendations.append({
                "goal": goal_key,
                "strategy": strategy,
                "priority": "medium",
                "description": f"實施{strategy}以達成{goal_def['name']}目標"
            })
        
        return recommendations
    
    def _create_implementation_plan(self, goal_key: str) -> Dict[str, Any]:
        """創建實施計劃"""
        goal_def = self.goal_definitions[goal_key]
        
        plan = {
            "goal": goal_key,
            "goal_name": goal_def["name"],
            "phases": [],
            "timeline": {
                "estimated_total_weeks": 2,
                "start_date": datetime.now().strftime("%Y-%m-%d")
            },
            "success_criteria": goal_def["success_criteria"]
        }
        
        # 創建實施階段
        strategies = goal_def["strategies"]
        for i, strategy in enumerate(strategies[:2]):  # 只取前2個策略作為階段
            phase = {
                "phase_number": i + 1,
                "name": f"實施{strategy}",
                "description": f"第{i+1}階段: {strategy}",
                "tasks": [
                    f"研究{strategy}最佳實踐",
                    f"設計{strategy}實施方案",
                    f"實施{strategy}",
                    f"測試{strategy}效果"
                ],
                "duration_weeks": 1,
                "deliverables": [f"{strategy}實施完成", "相關測試通過"]
            }
            plan["phases"].append(phase)
        
        return plan
    
    def generate_goal_report(self, goal_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """生成目標分析報告"""
        report = {
            "project_info": {
                "path": str(self.project_path),
                "name": self.project_path.name
            },
            "goal_analysis": goal_analysis,
            "summary": {
                "total_goals": len(goal_analysis),
                "high_priority_goals": sum(1 for g in goal_analysis.values() if g["priority"] in ["high", "critical"]),
                "average_relevance": sum(g["relevance_score"] for g in goal_analysis.values()) / len(goal_analysis) if goal_analysis else 0,
                "recommended_focus": self._get_recommended_focus(goal_analysis)
            }
        }
        
        return report
    
    def _get_recommended_focus(self, goal_analysis: Dict[str, Any]) -> List[str]:
        """獲取推薦的焦點目標"""
        # 按優先級和相關性排序
        sorted_goals = sorted(
            goal_analysis.items(),
            key=lambda x: (self._priority_to_number(x[1]["priority"]), x[1]["relevance_score"]),
            reverse=True
        )
        
        # 返回前3個目標
        return [goal[1]["definition"]["name"] for goal in sorted_goals[:3]]
    
    def _priority_to_number(self, priority: str) -> int:
        """將優先級轉換為數字"""
        priority_map = {
            "critical": 4,
            "high": 3,
            "medium": 2,
            "low": 1
        }
        return priority_map.get(priority, 0)
    
    def save_report(self, report: Dict[str, Any], filepath: str):
        """保存目標分析報告"""
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        print(f"✅ 目標分析報告已保存: {filepath}")


def main():
    """主函數（用於獨立測試）"""
    import sys
    
    if len(sys.argv) < 2:
        print("用法: python goal_driven_module.py <項目路徑>")
        print("示例: python goal_driven_module.py /path/to/your/project")
        sys.exit(1)
    
    project_path = sys.argv[1]
    
    if not os.path.exists(project_path):
        print(f"錯誤: 項目路徑不存在: {project_path}")
        sys.exit(1)
    
    # 創建並運行目標自驅模塊
    module = GoalDrivenModule(project_path)
    
    # 創建一個簡單的分析報告用於測試
    test_report = {
        "project_info": {
            "name": Path(project_path).name,
            "path": project_path
        },
        "issues": [
            {"description": "應用程序加載速度慢，需要性能優化"},
            {"description": "存在安全漏洞需要修復"},
            {"description": "代碼質量較差，需要重構"}
        ],
        "recommendations": [
            {"description": "實施代碼分割以提高性能"},
            {"description": "修復安全漏洞"}
        ]
    }
    
    # 設置目標
    goals = ["improve_performance", "enhance_security", "improve_code_quality"]
    goal_analysis = module.set_goals(goals, test_report)
    
    # 生成目標報告
    report = module.generate_goal_report(goal_analysis)
    
    # 打印摘要
    print("\n📊 目標分析摘要:")
    print(f"總目標數: {report['summary']['total_goals']}")
    print(f"高優先級目標: {report['summary']['high_priority_goals']}")
    print(f"平均相關性: {report['summary']['average_relevance']:.1f}%")
    print(f"推薦焦點: {', '.join(report['summary']['recommended_focus'])}")
    
    # 保存報告
    output_dir = Path(__file__).parent.parent / "output" / "goal_analysis"
    output_dir.mkdir(parents=True, exist_ok=True)
    report_path = output_dir / f"goal_report_{Path(project_path).name}.json"
    module.save_report(report, str(report_path))


if __name__ == "__main__":
    main()