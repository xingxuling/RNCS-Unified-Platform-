#!/usr/bin/env python3
"""
RAG 自動化系統增強版主程序
整合分析、處理、學習、判斷、打包全流程
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List

# 添加模塊路徑
sys.path.insert(0, str(Path(__file__).parent / "modules"))

from rag_analyzer import ProjectAnalyzer
from decision_engine import DecisionEngine
from auto_packager import AutoPackager
from processing_module_simple import ProcessingModule
from utils import get_desktop_path
from advanced_learning_module import AdvancedLearningModule
from learning_module import LearningModule

class EnhancedRAGSystem:
    """增強版 RAG 自動化系統"""
    
    def __init__(self, project_path: str):
        self.project_path = Path(project_path)
        self.timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.results_dir = Path(__file__).parent / "output" / self.timestamp
        self.results_dir.mkdir(parents=True, exist_ok=True)
        
        # 結果存儲
        self.analysis_report = None
        self.processed_data = None
        self.learning_results = None
        self.decisions = None
        self.package_path = None
        
    def run_enhanced_analysis(self) -> Dict[str, Any]:
        """運行增強版分析流程"""
        print("=" * 70)
        print("🚀 啟動增強版 RAG 自動化系統")
        print("=" * 70)
        print(f"📁 分析項目: {self.project_path}")
        print(f"📊 結果目錄: {self.results_dir}")
        print("=" * 70)
        
        # 步驟 1: RAG 分析
        print("\n1️⃣  RAG 分析階段")
        print("-" * 45)
        self.analysis_report = self._run_rag_analysis()
        
        # 步驟 2: 數據處理
        print("\n2️⃣  數據處理階段")
        print("-" * 45)
        self.processed_data = self._run_data_processing()
        
        # 步驟 3: 智能學習
        print("\n3️⃣  智能學習階段")
        print("-" * 45)
        self.learning_results = self._run_intelligent_learning()
        
        # 步驟 4: 判斷決策
        print("\n4️⃣  判斷決策階段")
        print("-" * 45)
        self.decisions = self._run_enhanced_decision_engine()
        
        # 檢查是否應該繼續
        if not self.decisions.get("final_decision", {}).get("should_proceed", False):
            print("❌ 根據分析結果，建議停止後續流程")
            return self._generate_enhanced_final_report()
        
        # 步驟 5: 自動化打包
        print("\n5️⃣  自動化打包階段")
        print("-" * 45)
        self.package_path = self._run_enhanced_packaging()
        
        # 步驟 6: 生成最終報告
        print("\n6️⃣  生成最終報告")
        print("-" * 45)
        final_report = self._generate_enhanced_final_report()
        
        return final_report
    
    def _run_rag_analysis(self) -> Dict[str, Any]:
        """運行 RAG 分析"""
        print("🔍 執行 RAG 分析...")
        
        analyzer = ProjectAnalyzer(str(self.project_path))
        report = analyzer.generate_analysis_report()
        
        # 保存分析報告
        report_path = self.results_dir / "analysis_report.json"
        analyzer.save_report(report, str(report_path))
        
        # 打印分析摘要
        assessment = report.get("overall_assessment", {})
        print(f"✅ 分析完成:")
        print(f"   總體分數: {assessment.get('overall_score', 0):.1f}/100")
        print(f"   成熟度等級: {assessment.get('maturity_level', 'unknown')}")
        print(f"   建議數量: {len(report.get('recommendations', []))}")
        print(f"   報告文件: {report_path}")
        
        return report
    
    def _run_data_processing(self) -> Dict[str, Any]:
        """運行數據處理"""
        print("⚙️  執行數據處理...")
        
        if not self.analysis_report:
            print("    ⚠️  沒有分析數據可用")
            return {}
        
        processor = ProcessingModule(str(self.project_path))
        
        # 處理項目數據
        processed_results = processor.process_project(self.analysis_report)
        
        # 應用優化
        optimizations = processed_results.get("optimizations", [])
        if optimizations:
            optimization_results = processor.optimize_project(optimizations)
            processed_results["optimization_results"] = optimization_results
        
        # 驗證處理結果
        validation = processor.validate_processing()
        processed_results["validation"] = validation
        
        # 保存處理結果
        processed_path = self.results_dir / "processed_data.json"
        with open(processed_path, 'w', encoding='utf-8') as f:
            json.dump(processed_results, f, indent=2, ensure_ascii=False)
        
        print(f"✅ 處理完成:")
        print(f"   質量分數: {processed_results.get('quality_metrics', {}).get('overall_score', 0)}")
        print(f"   優化應用: {len(optimizations)} 個")
        print(f"   驗證結果: {'✅ 有效' if validation.get('is_valid', False) else '❌ 無效'}")
        print(f"   處理文件: {processed_path}")
        
        return processed_results
    
    def _run_intelligent_learning(self) -> Dict[str, Any]:
        """運行智能學習"""
        print("🧠 執行智能學習...")
        
        # 使用高級學習模塊
        advanced_learner = AdvancedLearningModule(str(self.project_path))
        
        # 執行自動學習和改進
        learning_results = advanced_learner.auto_learn_and_improve()
        
        # 使用基礎學習模塊進行補充學習
        basic_learner = LearningModule(str(self.project_path))
        basic_results = basic_learner.learn_from_project()
        basic_suggestions = basic_learner.get_suggestions()
        basic_applied = basic_learner.apply_learned_knowledge()
        
        # 合併學習結果
        combined_results = {
            "advanced_learning": learning_results,
            "basic_learning": {
                "results": basic_results,
                "suggestions": basic_suggestions,
                "applied": basic_applied
            }
        }
        
        # 保存學習結果
        learning_path = self.results_dir / "learning_results.json"
        with open(learning_path, 'w', encoding='utf-8') as f:
            json.dump(combined_results, f, indent=2, ensure_ascii=False)
        
        print(f"✅ 學習完成:")
        print(f"   總改進: {learning_results.get('total_improvements', 0)} 個")
        print(f"   成功率: {learning_results.get('success_rate', 0):.1f}%")
        print(f"   項目健康度: {learning_results.get('project_health', 0)}/100")
        print(f"   學習文件: {learning_path}")
        
        return combined_results
    
    def _run_enhanced_decision_engine(self) -> Dict[str, Any]:
        """運行增強版判斷引擎"""
        print("⚖️  執行增強版判斷決策...")
        
        # 加載所有數據
        analysis_path = self.results_dir / "analysis_report.json"
        processed_path = self.results_dir / "processed_data.json"
        learning_path = self.results_dir / "learning_results.json"
        
        if not analysis_path.exists():
            print("    ❌ 分析報告不存在")
            return {}
        
        with open(analysis_path, 'r', encoding='utf-8') as f:
            analysis_report = json.load(f)
        
        processed_data = {}
        if processed_path.exists():
            with open(processed_path, 'r', encoding='utf-8') as f:
                processed_data = json.load(f)
        
        learning_data = {}
        if learning_path.exists():
            with open(learning_path, 'r', encoding='utf-8') as f:
                learning_data = json.load(f)
        
        # 創建增強版決策引擎
        engine = DecisionEngine(analysis_report)
        
        # 生成決策（考慮處理和學習結果）
        priorities = engine.evaluate_priorities()
        focus = engine.determine_iteration_focus()
        plan = engine.generate_implementation_plan()
        
        # 增強決策基於學習結果
        enhanced_final_decision = self._enhance_decision_with_learning(
            engine.make_final_decision(),
            processed_data,
            learning_data
        )
        
        # 整合決策結果
        decisions = {
            "analysis_summary": {
                "project_name": analysis_report["project_info"]["name"],
                "overall_score": analysis_report["overall_assessment"]["overall_score"],
                "maturity_level": analysis_report["overall_assessment"]["maturity_level"]
            },
            "processing_summary": {
                "quality_score": processed_data.get("quality_metrics", {}).get("overall_score", 0),
                "is_valid": processed_data.get("validation", {}).get("is_valid", False)
            },
            "learning_summary": {
                "total_improvements": learning_data.get("advanced_learning", {}).get("total_improvements", 0),
                "project_health": learning_data.get("advanced_learning", {}).get("project_health", 0)
            },
            "priorities": priorities,
            "iteration_focus": focus,
            "implementation_plan": plan,
            "final_decision": enhanced_final_decision
        }
        
        # 保存決策
        decisions_path = self.results_dir / "enhanced_decisions.json"
        engine.save_decisions(decisions, str(decisions_path))
        
        # 打印決策摘要
        print(f"✅ 決策完成:")
        print(f"   是否繼續: {'✅ 是' if enhanced_final_decision['should_proceed'] else '❌ 否'}")
        print(f"   迭代主題: {focus['iteration_theme']}")
        print(f"   時間估計: {priorities['timeline_estimate']}")
        print(f"   決策文件: {decisions_path}")
        
        return decisions
    
    def _enhance_decision_with_learning(self, base_decision: Dict[str, Any], 
                                       processed_data: Dict[str, Any], 
                                       learning_data: Dict[str, Any]) -> Dict[str, Any]:
        """基於學習結果增強決策"""
        enhanced_decision = base_decision.copy()
        
        # 檢查處理結果
        is_processing_valid = processed_data.get("validation", {}).get("is_valid", True)
        processing_success_rate = processed_data.get("validation", {}).get("success_rate", 100)
        
        # 檢查學習結果
        learning_health = learning_data.get("advanced_learning", {}).get("project_health", 0)
        learning_improvements = learning_data.get("advanced_learning", {}).get("total_improvements", 0)
        
        # 調整決策基於結果
        if not is_processing_valid or processing_success_rate < 50:
            enhanced_decision["should_proceed"] = False
            enhanced_decision["reason"] = "數據處理失敗或成功率過低"
        
        elif learning_health < 40:
            enhanced_decision["should_proceed"] = False
            enhanced_decision["reason"] = "項目健康度過低，需要先修復基礎問題"
        
        elif learning_improvements == 0:
            enhanced_decision["should_proceed"] = True
            enhanced_decision["confidence"] = "medium"
            enhanced_decision["note"] = "項目質量良好，但未發現需要改進的地方"
        
        else:
            enhanced_decision["should_proceed"] = True
            enhanced_decision["confidence"] = "high"
            enhanced_decision["note"] = f"成功應用 {learning_improvements} 個改進，項目健康度: {learning_health}/100"
        
        return enhanced_decision
    
    def _run_enhanced_packaging(self) -> str:
        """運行增強版打包"""
        print("📦 執行增強版自動化打包...")
        
        # 加載決策
        decisions_path = self.results_dir / "enhanced_decisions.json"
        if not decisions_path.exists():
            print("    ❌ 決策文件不存在")
            return None
        
        with open(decisions_path, 'r', encoding='utf-8') as f:
            decisions = json.load(f)
        
        packager = AutoPackager(str(self.project_path), decisions)
        
        # 優化項目
        optimized_path = packager.optimize_project()
        
        # 創建包（放到桌面）
        desktop_path = get_desktop_path()
        package_path = packager.create_package(str(desktop_path))
        
        # 生成增強版報告
        report = self._generate_enhanced_packaging_report(packager, decisions)
        report_path = desktop_path / "enhanced_packaging_report.json"
        packager.save_report(report, str(report_path))
        
        print(f"✅ 打包完成:")
        print(f"   優化項目: {optimized_path}")
        print(f"   打包文件: {package_path}")
        print(f"   打包報告: {report_path}")
        
        return package_path
    
    def _generate_enhanced_packaging_report(self, packager: AutoPackager, decisions: Dict[str, Any]) -> Dict[str, Any]:
        """生成增強版打包報告"""
        base_report = packager.generate_report()
        
        enhanced_report = {
            **base_report,
            "enhanced_features": {
                "processing_integrated": self.processed_data is not None,
                "learning_applied": self.learning_results is not None,
                "decision_enhanced": True,
                "total_phases": 6
            },
            "learning_insights": self._extract_learning_insights(),
            "processing_results": self._summarize_processing_results(),
            "recommendation_summary": self._generate_recommendation_summary(decisions)
        }
        
        return enhanced_report
    
    def _extract_learning_insights(self) -> List[str]:
        """提取學習洞察"""
        insights = []
        
        if self.learning_results:
            advanced = self.learning_results.get("advanced_learning", {})
            basic = self.learning_results.get("basic_learning", {})
            
            if advanced:
                insights.append(f"自動改進: {advanced.get('total_improvements', 0)} 個")
                insights.append(f"項目健康度: {advanced.get('project_health', 0)}/100")
            
            if basic and basic.get("results"):
                results = basic["results"]
                insights.append(f"代碼模式: {results.get('patterns_found', 0)} 個")
                insights.append(f"最佳實踐: {results.get('best_practices', 0)} 個")
        
        return insights
    
    def _summarize_processing_results(self) -> Dict[str, Any]:
        """總結處理結果"""
        if not self.processed_data:
            return {}
        
        return {
            "quality_score": self.processed_data.get("quality_metrics", {}).get("overall_score", 0),
            "optimizations_applied": len(self.processed_data.get("optimizations", [])),
            "is_valid": self.processed_data.get("validation", {}).get("is_valid", False),
            "success_rate": self.processed_data.get("validation", {}).get("success_rate", 0)
        }
    
    def _generate_recommendation_summary(self, decisions: Dict[str, Any]) -> List[str]:
        """生成推薦摘要"""
        recommendations = []
        
        # 基於分析結果
        if self.analysis_report:
            score = self.analysis_report.get("overall_assessment", {}).get("overall_score", 0)
            if score < 40:
                recommendations.append("項目需要重大改進，建議進行全面重構")
            elif score < 70:
                recommendations.append("項目有改進空間，建議按優先級逐步優化")
            else:
                recommendations.append("項目質量良好，建議專注於創新功能")
        
        # 基於學習結果
        if self.learning_results:
            health = self.learning_results.get("advanced_learning", {}).get("project_health", 0)
            if health < 50:
                recommendations.append("優先修復基礎架構和代碼質量問題")
        
        # 基於決策
        if not decisions.get("final_decision", {}).get("should_proceed", False):
            recommendations.append("根據綜合分析，建議暫停當前迭代，重新評估項目方向")
        
        return recommendations
    
    def _generate_enhanced_final_report(self) -> Dict[str, Any]:
        """生成增強版最終報告"""
        print("📄 生成增強版最終報告...")
        
        final_report = {
            "system_info": {
                "name": "增強版 RAG 自動化系統",
                "version": "2.0.0",
                "execution_time": datetime.now().isoformat(),
                "execution_id": self.timestamp,
                "total_phases": 6
            },
            "project_info": {
                "path": str(self.project_path),
                "name": self.project_path.name
            },
            "phase_results": {
                "analysis": {
                    "completed": self.analysis_report is not None,
                    "score": self.analysis_report.get("overall_assessment", {}).get("overall_score", 0) if self.analysis_report else 0,
                    "maturity_level": self.analysis_report.get("overall_assessment", {}).get("maturity_level", "unknown") if self.analysis_report else "unknown"
                },
                "processing": {
                    "completed": self.processed_data is not None,
                    "quality_score": self.processed_data.get("quality_metrics", {}).get("overall_score", 0) if self.processed_data else 0,
                    "is_valid": self.processed_data.get("validation", {}).get("is_valid", False) if self.processed_data else False
                },
                "learning": {
                    "completed": self.learning_results is not None,
                    "total_improvements": self.learning_results.get("advanced_learning", {}).get("total_improvements", 0) if self.learning_results else 0,
                    "project_health": self.learning_results.get("advanced_learning", {}).get("project_health", 0) if self.learning_results else 0
                },
                "decision": {
                    "completed": self.decisions is not None,
                    "should_proceed": self.decisions.get("final_decision", {}).get("should_proceed", False) if self.decisions else False,
                    "iteration_theme": self.decisions.get("iteration_focus", {}).get("iteration_theme", "") if self.decisions else ""
                },
                "packaging": {
                    "completed": self.package_path is not None,
                    "package_path": self.package_path
                }
            },
            "summary": {
                "status": "completed" if self.package_path else "stopped",
                "total_improvements": self.learning_results.get("advanced_learning", {}).get("total_improvements", 0) if self.learning_results else 0,
                "overall_health": self._calculate_overall_health(),
                "key_insights": self._extract_key_insights(),
                "next_steps": self._generate_next_steps()
            }
        }
        
        # 保存最終報告
        final_report_path = self.results_dir / "enhanced_final_report.json"
        with open(final_report_path, 'w', encoding='utf-8') as f:
            json.dump(final_report, f, indent=2, ensure_ascii=False)
        
        # 創建桌面摘要
        self._create_enhanced_desktop_summary(final_report)
        
        print(f"✅ 最終報告: {final_report_path}")
        
        return final_report
    
    def _calculate_overall_health(self) -> int:
        """計算總體健康度"""
        scores = []
        
        # 分析分數
        if self.analysis_report:
            analysis_score = self.analysis_report.get("overall_assessment", {}).get("overall_score", 0)
            scores.append(analysis_score)
        
        # 處理分數
        if self.processed_data:
            processing_score = self.processed_data.get("quality_metrics", {}).get("overall_score", 0)
            scores.append(processing_score)
        
        # 學習健康度
        if self.learning_results:
            learning_health = self.learning_results.get("advanced_learning", {}).get("project_health", 0)
            scores.append(learning_health)
        
        if scores:
            return sum(scores) // len(scores)
        return 0
    
    def _extract_key_insights(self) -> List[str]:
        """提取關鍵洞察"""
        insights = []
        
        # 從分析中提取
        if self.analysis_report:
            score = self.analysis_report.get("overall_assessment", {}).get("overall_score", 0)
            if score < 40:
                insights.append("項目基礎薄弱，需要重大改進")
            elif score < 70:
                insights.append("項目有潛力，需要系統性優化")
            else:
                insights.append("項目質量優秀，適合進一步發展")
        
        # 從學習中提取
        if self.learning_results:
            improvements = self.learning_results.get("advanced_learning", {}).get("total_improvements", 0)
            if improvements > 0:
                insights.append(f"自動學習發現並應用了 {improvements} 個改進")
        
        # 從決策中提取
        if self.decisions:
            should_proceed = self.decisions.get("final_decision", {}).get("should_proceed", False)
            if not should_proceed:
                insights.append("綜合評估建議暫停當前迭代")
        
        return insights
    
    def _generate_next_steps(self) -> List[str]:
        """生成下一步"""
        next_steps = []
        
        if self.package_path:
            next_steps.extend([
                f"1. 在桌面找到增強版打包文件: {Path(self.package_path).name}",
                "2. 解壓縮包查看優化後的項目",
                "3. 運行 npm install 安裝依賴",
                "4. 查看增強版分析報告了解詳細改進建議",
                "5. 根據智能學習結果實施後續迭代",
                "6. 監控項目健康度並持續優化"
            ])
        else:
            next_steps.extend([
                "1. 查看增強版分析報告了解項目問題",
                "2. 根據學習結果修復關鍵問題",
                "3. 重新運行數據處理和學習模塊",
                "4. 解決問題後重新運行增強版系統"
            ])
        
        return next_steps
    
    def _create_enhanced_desktop_summary(self, final_report: Dict[str, Any]):
        """創建增強版桌面摘要"""
        desktop_path = Path.home() / "Desktop"
        summary_path = desktop_path / f"增強版_RAG_系統結果_{self.timestamp}.txt"
        
        summary = f"""增強版 RAG 自動化系統 - 執行結果
================================================

執行時間: {final_report['system_info']['execution_time']}
項目名稱: {final_report['project_info']['name']}
系統版本: {final_report['system_info']['version']}

📊 階段結果
------------------------------------------------
1. RAG 分析: {'✅ 完成' if final_report['phase_results']['analysis']['completed'] else '❌ 未完成'}
   分數: {final_report['phase_results']['analysis']['score']:.1f}/100
   成熟度: {final_report['phase_results']['analysis']['maturity_level']}

2. 數據處理: {'✅ 完成' if final_report['phase_results']['processing']['completed'] else '❌ 未完成'}
   質量分數: {final_report['phase_results']['processing']['quality_score']:.1f}/100
   有效性: {'✅ 有效' if final_report['phase_results']['processing']['is_valid'] else '❌ 無效'}

3. 智能學習: {'✅ 完成' if final_report['phase_results']['learning']['completed'] else '❌ 未完成'}
   改進應用: {final_report['phase_results']['learning']['total_improvements']} 個
   項目健康度: {final_report['phase_results']['learning']['project_health']}/100

4. 判斷決策: {'✅ 完成' if final_report['phase_results']['decision']['completed'] else '❌ 未完成'}
   是否繼續: {'✅ 是' if final_report['phase_results']['decision']['should_proceed'] else '❌ 否'}
   迭代主題: {final_report['phase_results']['decision']['iteration_theme']}

5. 自動打包: {'✅ 完成' if final_report['phase_results']['packaging']['completed'] else '❌ 未完成'}
   打包文件: {final_report['phase_results']['packaging']['package_path'] or '無'}

📈 總體摘要
------------------------------------------------
狀態: {final_report['summary']['status']}
總改進: {final_report['summary']['total_improvements']} 個
總體健康度: {final_report['summary']['overall_health']}/100

💡 關鍵洞察
------------------------------------------------
"""
        
        for i, insight in enumerate(final_report['summary']['key_insights'], 1):
            summary += f"{i}. {insight}\n"
        
        summary += """
🚀 下一步
------------------------------------------------
"""
        
        for step in final_report['summary']['next_steps']:
            summary += f"{step}\n"
        
        summary += """
================================================
詳細報告請查看:
- 增強版報告: output/ 目錄
- 打包報告: 桌面上的 JSON 文件
================================================
"""
        
        with open(summary_path, 'w', encoding='utf-8') as f:
            f.write(summary)
        
        print(f"✅ 增強版桌面摘要: {summary_path}")


def main():
    """主函數"""
    if len(sys.argv) < 2:
        print("用法: python main_enhanced.py <項目路徑>")
        print("示例: python main_enhanced.py /path/to/your/project")
        sys.exit(1)
    
    project_path = sys.argv[1]
    
    if not os.path.exists(project_path):
        print(f"錯誤: 項目路徑不存在: {project_path}")
        sys.exit(1)
    
    # 創建並運行增強版系統
    system = EnhancedRAGSystem(project_path)
    final_report = system.run_enhanced_analysis()
    
    # 打印最終摘要
    print("\n" + "=" * 70)
    print("🎉 增強版 RAG 自動化系統執行完成!")
    print("=" * 70)
    print(f"項目: {final_report['project_info']['name']}")
    print(f"狀態: {final_report['summary']['status']}")
    print(f"總體健康度: {final_report['summary']['overall_health']}/100")
    print(f"總改進: {final_report['summary']['total_improvements']} 個")
    
    if final_report['phase_results']['packaging']['package_path']:
        print(f"打包文件: {final_report['phase_results']['packaging']['package_path']}")
        print("✅ 請查看桌面上的增強版打包文件和報告")
    else:
        print("⚠️  未生成打包文件，請查看增強版分析報告了解原因")
    
    print("=" * 70)


if __name__ == "__main__":
    main()