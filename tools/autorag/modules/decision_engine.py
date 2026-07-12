#!/usr/bin/env python3
"""
判斷引擎模塊
基於 RAG 分析結果決定迭代方向和優先級
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Any, Tuple
import sys
from datetime import datetime

class DecisionEngine:
    """判斷引擎"""
    
    def __init__(self, analysis_report: Dict[str, Any]):
        self.report = analysis_report
        self.decisions = {}
        
    def evaluate_priorities(self) -> Dict[str, Any]:
        """評估改進優先級"""
        print("⚖️  評估改進優先級...")
        
        priorities = {
            "critical": [],
            "high": [],
            "medium": [],
            "low": [],
            "timeline_estimate": "1-2 週",
            "resource_requirements": {
                "development_effort": "medium",
                "testing_effort": "medium",
                "documentation_effort": "low"
            }
        }
        
        # 從分析報告中獲取建議
        recommendations = self.report.get("recommendations", [])
        
        for rec in recommendations:
            priority = rec.get("priority", "medium")
            category = rec.get("category", "general")
            
            decision_item = {
                "description": rec["description"],
                "category": category,
                "impact": rec.get("impact", "未知"),
                "estimated_effort": self._estimate_effort(category, priority),
                "implementation_strategy": self._generate_strategy(category)
            }
            
            priorities[priority].append(decision_item)
        
        # 根據項目狀態調整時間線
        assessment = self.report.get("overall_assessment", {})
        overall_score = assessment.get("overall_score", 0)
        
        if overall_score < 40:
            priorities["timeline_estimate"] = "2-4 週"
            priorities["resource_requirements"]["development_effort"] = "high"
        elif overall_score < 60:
            priorities["timeline_estimate"] = "1-3 週"
        elif overall_score >= 80:
            priorities["timeline_estimate"] = "3-7 天"
            priorities["resource_requirements"]["development_effort"] = "low"
        
        return priorities
    
    def determine_iteration_focus(self) -> Dict[str, Any]:
        """確定迭代重點"""
        print("🎯 確定迭代重點...")
        
        focus = {
            "primary_focus": "",
            "secondary_focus": "",
            "iteration_theme": "",
            "key_objectives": [],
            "success_metrics": {}
        }
        
        assessment = self.report.get("overall_assessment", {})
        overall_score = assessment.get("overall_score", 0)
        maturity = assessment.get("maturity_level", "beginner")
        
        # 根據成熟度等級確定重點
        if maturity == "beginner":
            focus["primary_focus"] = "基礎設施完善"
            focus["secondary_focus"] = "核心功能穩定"
            focus["iteration_theme"] = "建立堅實基礎"
            
            focus["key_objectives"] = [
                "完善項目結構和配置",
                "確保核心功能正常工作",
                "建立基本的測試框架",
                "添加必要的文檔"
            ]
            
        elif maturity == "basic":
            focus["primary_focus"] = "功能擴展"
            focus["secondary_focus"] = "代碼質量提升"
            focus["iteration_theme"] = "功能增強與優化"
            
            focus["key_objectives"] = [
                "添加缺失的重要功能",
                "改進用戶界面和體驗",
                "增強錯誤處理和穩定性",
                "優化代碼結構"
            ]
            
        elif maturity == "intermediate":
            focus["primary_focus"] = "自動化與部署"
            focus["secondary_focus"] = "性能優化"
            focus["iteration_theme"] = "生產就緒優化"
            
            focus["key_objectives"] = [
                "完善 CI/CD 流水線",
                "優化構建和部署流程",
                "添加監控和日誌",
                "性能測試和優化"
            ]
            
        else:  # advanced
            focus["primary_focus"] = "創新與擴展"
            focus["secondary_focus"] = "生態系統建設"
            focus["iteration_theme"] = "引領行業標準"
            
            focus["key_objectives"] = [
                "探索新技術和架構",
                "構建開發者工具和文檔",
                "社區貢獻和生態建設",
                "國際化和可訪問性"
            ]
        
        # 設置成功指標
        focus["success_metrics"] = {
            "code_coverage_target": self._calculate_coverage_target(overall_score),
            "performance_improvement": "15%",
            "bug_reduction": "30%",
            "user_satisfaction": "4.5/5.0"
        }
        
        return focus
    
    def generate_implementation_plan(self) -> Dict[str, Any]:
        """生成實施計劃"""
        print("📋 生成實施計劃...")
        
        plan = {
            "phases": [],
            "milestones": [],
            "deliverables": [],
            "risk_assessment": {},
            "quality_gates": []
        }
        
        # 獲取優先級評估
        priorities = self.evaluate_priorities()
        
        # 創建實施階段
        phases = []
        
        # 階段 1: 關鍵修復（如果有）
        if priorities["critical"]:
            phases.append({
                "name": "關鍵修復階段",
                "duration": "3-5 天",
                "tasks": [item["description"] for item in priorities["critical"][:3]],
                "outcome": "解決阻礙開發的關鍵問題"
            })
        
        # 階段 2: 高優先級改進
        if priorities["high"]:
            phases.append({
                "name": "核心改進階段",
                "duration": "5-10 天",
                "tasks": [item["description"] for item in priorities["high"][:5]],
                "outcome": "顯著提升項目質量和功能"
            })
        
        # 階段 3: 中優先級改進
        if priorities["medium"]:
            phases.append({
                "name": "功能增強階段",
                "duration": "7-14 天",
                "tasks": [item["description"] for item in priorities["medium"][:7]],
                "outcome": "完善功能和用戶體驗"
            })
        
        plan["phases"] = phases
        
        # 設置里程碑
        milestones = []
        total_days = 0
        
        for i, phase in enumerate(phases):
            # 估算天數
            duration_str = phase["duration"]
            days = self._parse_duration(duration_str)
            total_days += days
            
            milestone = {
                "name": f"完成 {phase['name']}",
                "target_date": self._calculate_date(days),
                "acceptance_criteria": [
                    f"完成所有 {len(phase['tasks'])} 個任務",
                    "通過質量門檢查",
                    "更新相關文檔"
                ]
            }
            milestones.append(milestone)
        
        plan["milestones"] = milestones
        
        # 定義交付物
        deliverables = [
            {
                "name": "優化後的源代碼",
                "description": "包含所有改進的完整項目代碼",
                "format": "Git 倉庫 + 壓縮包"
            },
            {
                "name": "更新文檔",
                "description": "包括 README、API 文檔、部署指南",
                "format": "Markdown + HTML"
            },
            {
                "name": "測試報告",
                "description": "單元測試、集成測試、性能測試結果",
                "format": "HTML 報告 + JSON 數據"
            },
            {
                "name": "部署包",
                "description": "可直接部署的應用包",
                "format": "APK/AAB + Docker 鏡像"
            }
        ]
        
        plan["deliverables"] = deliverables
        
        # 風險評估
        plan["risk_assessment"] = {
            "technical_risks": [
                {"risk": "第三方依賴不兼容", "probability": "低", "impact": "中", "mitigation": "鎖定依賴版本"},
                {"risk": "性能回退", "probability": "中", "impact": "高", "mitigation": "全面的性能測試"},
                {"risk": "安全漏洞", "probability": "低", "impact": "高", "mitigation": "安全審計和掃描"}
            ],
            "project_risks": [
                {"risk": "時間超支", "probability": "中", "impact": "中", "mitigation": "敏捷迭代，優先核心功能"},
                {"risk": "需求變更", "probability": "高", "impact": "中", "mitigation": "靈活架構，模塊化設計"}
            ]
        }
        
        # 質量門
        plan["quality_gates"] = [
            {
                "name": "代碼質量門",
                "criteria": ["測試覆蓋率 > 70%", "無嚴重代碼嗅覺", "通過所有 lint 檢查"],
                "enforcement": "自動化檢查 + 人工審核"
            },
            {
                "name": "功能質量門",
                "criteria": ["所有核心功能正常工作", "UI/UX 符合設計規範", "性能指標達標"],
                "enforcement": "自動化測試 + 用戶驗收測試"
            },
            {
                "name": "部署質量門",
                "criteria": ["構建成功", "部署成功", "監控正常"],
                "enforcement": "CI/CD 流水線檢查"
            }
        ]
        
        return plan
    
    def make_final_decision(self) -> Dict[str, Any]:
        """做出最終決策"""
        print("🤔 做出最終決策...")
        
        decision = {
            "should_proceed": True,
            "recommended_approach": "",
            "expected_benefits": [],
            "potential_risks": [],
            "next_steps": []
        }
        
        assessment = self.report.get("overall_assessment", {})
        overall_score = assessment.get("overall_score", 0)
        
        # 決定是否繼續
        if overall_score < 20:
            decision["should_proceed"] = False
            decision["recommended_approach"] = "項目需要重大重構，建議重新設計"
            decision["next_steps"] = ["進行架構設計", "創建原型", "重新評估"]
        else:
            decision["should_proceed"] = True
            
            # 根據分數推薦方法
            if overall_score < 50:
                decision["recommended_approach"] = "增量改進：逐步修復關鍵問題，然後增強功能"
            elif overall_score < 75:
                decision["recommended_approach"] = "平衡發展：同時改進功能、質量和自動化"
            else:
                decision["recommended_approach"] = "優化完善：專注於性能、安全和用戶體驗"
        
        # 預期收益
        if decision["should_proceed"]:
            expected_improvement = min(30, 100 - overall_score)
            decision["expected_benefits"] = [
                f"項目質量提升 {expected_improvement}%",
                "開發效率提高",
                "用戶體驗改善",
                "維護成本降低"
            ]
            
            # 潛在風險
            decision["potential_risks"] = [
                "引入新的 bug",
                "學習曲線影響開發速度",
                "第三方依賴問題"
            ]
            
            # 下一步
            decision["next_steps"] = [
                "執行實施計劃",
                "監控改進效果",
                "收集用戶反饋",
                "持續迭代優化"
            ]
        
        return decision
    
    def _estimate_effort(self, category: str, priority: str) -> str:
        """估算工作量"""
        effort_map = {
            "structure": {"critical": "低", "high": "低", "medium": "低", "low": "低"},
            "testing": {"critical": "中", "high": "中", "medium": "中", "low": "低"},
            "code_quality": {"critical": "中", "high": "中", "medium": "低", "low": "低"},
            "features": {"critical": "高", "high": "中", "medium": "中", "low": "低"},
            "automation": {"critical": "高", "high": "中", "medium": "中", "low": "低"},
            "overall": {"critical": "高", "high": "高", "medium": "中", "low": "低"}
        }
        
        return effort_map.get(category, {}).get(priority, "中")
    
    def _generate_strategy(self, category: str) -> str:
        """生成實施策略"""
        strategies = {
            "structure": "逐步添加缺失文件，保持向後兼容",
            "testing": "測試驅動開發，先寫測試再實現",
            "code_quality": "使用自動化工具，逐步重構",
            "features": "用戶故事驅動，小步迭代",
            "automation": "基礎設施即代碼，版本控制配置",
            "overall": "分階段實施，持續集成和交付"
        }
        
        return strategies.get(category, "根據具體情況制定策略")
    
    def _calculate_coverage_target(self, score: float) -> str:
        """計算測試覆蓋率目標"""
        if score < 40:
            return "50%"
        elif score < 60:
            return "70%"
        elif score < 80:
            return "80%"
        else:
            return "90%"
    
    def _parse_duration(self, duration_str: str) -> int:
        """解析持續時間字符串"""
        # 簡單解析如 "3-5 天" 或 "1-2 週"
        if "週" in duration_str:
            return 7  # 簡化為7天
        elif "天" in duration_str:
            parts = duration_str.split("-")
            if len(parts) > 1:
                try:
                    return int(parts[1].split()[0])
                except:
                    return 5
        return 5
    
    def _calculate_date(self, days_from_now: int) -> str:
        """計算日期"""
        from datetime import datetime, timedelta
        target_date = datetime.now() + timedelta(days=days_from_now)
        return target_date.strftime("%Y-%m-%d")
    
    def save_decisions(self, decisions: Dict[str, Any], output_path: str = None) -> str:
        """保存決策結果"""
        if output_path is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = Path(".") / f"decisions_{timestamp}.json"
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(decisions, f, indent=2, ensure_ascii=False)
        
        print(f"✅ 決策結果已保存: {output_path}")
        return str(output_path)


def main():
    """主函數"""
    if len(sys.argv) < 2:
        print("用法: python decision_engine.py <分析報告路徑>")
        sys.exit(1)
    
    report_path = sys.argv[1]
    
    if not os.path.exists(report_path):
        print(f"錯誤: 分析報告不存在: {report_path}")
        sys.exit(1)
    
    # 加載分析報告
    with open(report_path, 'r', encoding='utf-8') as f:
        analysis_report = json.load(f)
    
    print(f"🎯 開始決策分析")
    print("=" * 50)
    
    engine = DecisionEngine(analysis_report)
    
    # 生成各項決策
    priorities = engine.evaluate_priorities()
    focus = engine.determine_iteration_focus()
    plan = engine.generate_implementation_plan()
    final_decision = engine.make_final_decision()
    
    # 整合決策結果
    decisions = {
        "analysis_summary": {
            "project_name": analysis_report["project_info"]["name"],
            "overall_score": analysis_report["overall_assessment"]["overall_score"],
            "maturity_level": analysis_report["overall_assessment"]["maturity_level"]
        },
        "priorities": priorities,
        "iteration_focus": focus,
        "implementation_plan": plan,
        "final_decision": final_decision
    }
    
    # 保存決策
    output_file = engine.save_decisions(decisions)
    
    # 打印摘要
    print("\n" + "=" * 50)
    print("📋 決策摘要:")
    print(f"是否繼續: {'✅ 是' if final_decision['should_proceed'] else '❌ 否'}")
    print(f"推薦方法: {final_decision['recommended_approach']}")
    print(f"迭代主題: {focus['iteration_theme']}")
    print(f"時間估計: {priorities['timeline_estimate']}")
    print(f"關鍵目標: {len(focus['key_objectives'])} 個")
    print(f"詳細決策: {output_file}")
    print("=" * 50)


if __name__ == "__main__":
    main()