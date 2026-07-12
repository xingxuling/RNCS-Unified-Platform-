#!/usr/bin/env python3
"""
RAG 自動化系統主程序
整合分析、判斷、打包全流程
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
from cache_manager import CacheManager
from utils import get_desktop_path

class RAGAutomationSystem:
    """RAG 自動化系統"""
    
    def __init__(self, project_path: str, use_cache: bool = True):
        self.project_path = Path(project_path)
        self.timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.results_dir = Path(__file__).parent / "output" / self.timestamp
        self.results_dir.mkdir(parents=True, exist_ok=True)
        
        # 結果存儲
        self.analysis_report = None
        self.decisions = None
        self.package_path = None
        
        # 初始化緩存管理器
        self.use_cache = use_cache
        self.cache_manager = CacheManager() if use_cache else None
        self.project_hash = self._calculate_project_hash() if use_cache else None
    
    def _calculate_project_hash(self) -> str:
        """計算項目哈希值用於緩存"""
        import hashlib
        
        # 使用項目路徑和文件列表創建哈希
        hash_input = str(self.project_path)
        
        # 獲取項目中的所有Python文件
        py_files = list(self.project_path.rglob("*.py"))
        for py_file in sorted(py_files)[:20]:  # 只取前20個文件
            try:
                stat = py_file.stat()
                hash_input += f"{py_file}:{stat.st_mtime}:{stat.st_size}"
            except:
                pass
        
        return hashlib.md5(hash_input.encode()).hexdigest()
    
    def _check_cache(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """檢查緩存"""
        if not self.use_cache or not self.cache_manager:
            return None
        
        cached_data = self.cache_manager.get(cache_key)
        if cached_data:
            print(f"✅ 使用緩存數據: {cache_key}")
            self.cache_manager.stats["hits"] += 1
            return cached_data
        
        self.cache_manager.stats["misses"] += 1
        return None
    
    def _save_cache(self, cache_key: str, data: Dict[str, Any]):
        """保存到緩存"""
        if not self.use_cache or not self.cache_manager:
            return
        
        self.cache_manager.set(cache_key, data)
        self.cache_manager.stats["sets"] += 1
        
    def run_full_analysis(self) -> Dict[str, Any]:
        """運行完整分析"""
        print("=" * 60)
        print("🚀 啟動 RAG 自動化系統")
        print("=" * 60)
        print(f"📁 分析項目: {self.project_path}")
        print(f"📊 結果目錄: {self.results_dir}")
        print("=" * 60)
        
        # 步驟 1: RAG 分析
        print("\n1️⃣  RAG 分析階段")
        print("-" * 40)
        self.analysis_report = self._run_rag_analysis()
        
        # 步驟 2: 判斷決策
        print("\n2️⃣  判斷決策階段")
        print("-" * 40)
        self.decisions = self._run_decision_engine()
        
        # 檢查是否應該繼續
        if not self.decisions.get("final_decision", {}).get("should_proceed", False):
            print("❌ 根據分析結果，建議停止後續流程")
            return self._generate_final_report()
        
        # 步驟 3: 自動化打包
        print("\n3️⃣  自動化打包階段")
        print("-" * 40)
        self.package_path = self._run_auto_packaging()
        
        # 步驟 4: 生成最終報告
        print("\n4️⃣  生成最終報告")
        print("-" * 40)
        final_report = self._generate_final_report()
        
        return final_report
    
    def _run_rag_analysis(self) -> Dict[str, Any]:
        """運行 RAG 分析"""
        print("🔍 執行 RAG 分析...")
        
        # 檢查緩存
        cache_key = f"analysis_{self.project_hash}"
        cached_report = self._check_cache(cache_key)
        
        if cached_report:
            return cached_report
        
        analyzer = ProjectAnalyzer(str(self.project_path))
        report = analyzer.generate_analysis_report()
        
        # 保存分析報告
        report_path = self.results_dir / "analysis_report.json"
        analyzer.save_report(report, str(report_path))
        
        # 保存到緩存
        self._save_cache(cache_key, report)
        
        # 打印分析摘要
        assessment = report.get("overall_assessment", {})
        print(f"✅ 分析完成:")
        print(f"   總體分數: {assessment.get('overall_score', 0):.1f}/100")
        print(f"   成熟度等級: {assessment.get('maturity_level', 'unknown')}")
        print(f"   建議數量: {len(report.get('recommendations', []))}")
        print(f"   報告文件: {report_path}")
        
        return report
    
    def _run_decision_engine(self) -> Dict[str, Any]:
        """運行判斷引擎"""
        print("⚖️  執行判斷決策...")
        
        # 加載分析報告
        report_path = self.results_dir / "analysis_report.json"
        with open(report_path, 'r', encoding='utf-8') as f:
            analysis_report = json.load(f)
        
        engine = DecisionEngine(analysis_report)
        
        # 生成決策
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
        decisions_path = self.results_dir / "decisions.json"
        engine.save_decisions(decisions, str(decisions_path))
        
        # 打印決策摘要
        print(f"✅ 決策完成:")
        print(f"   是否繼續: {'✅ 是' if final_decision['should_proceed'] else '❌ 否'}")
        print(f"   迭代主題: {focus['iteration_theme']}")
        print(f"   時間估計: {priorities['timeline_estimate']}")
        print(f"   決策文件: {decisions_path}")
        
        return decisions
    
    def _run_auto_packaging(self) -> str:
        """運行自動化打包"""
        print("📦 執行自動化打包...")
        
        # 加載決策
        decisions_path = self.results_dir / "decisions.json"
        with open(decisions_path, 'r', encoding='utf-8') as f:
            decisions = json.load(f)
        
        packager = AutoPackager(str(self.project_path), decisions)
        
        # 優化項目
        optimized_path = packager.optimize_project()
        
        # 創建包（放到桌面）
        desktop_path = get_desktop_path()
        package_path = packager.create_package(str(desktop_path))
        
        # 生成報告
        report = packager.generate_report()
        report_path = desktop_path / "auto_packaging_report.json"
        packager.save_report(report, str(report_path))
        
        print(f"✅ 打包完成:")
        print(f"   優化項目: {optimized_path}")
        print(f"   打包文件: {package_path}")
        print(f"   打包報告: {report_path}")
        
        return package_path
    
    def _generate_final_report(self) -> Dict[str, Any]:
        """生成最終報告"""
        print("📄 生成最終報告...")
        
        final_report = {
            "system_info": {
                "name": "RAG 自動化系統",
                "version": "1.0.0",
                "execution_time": datetime.now().isoformat(),
                "execution_id": self.timestamp
            },
            "project_info": {
                "path": str(self.project_path),
                "name": self.project_path.name
            },
            "analysis_results": {
                "report_path": str(self.results_dir / "analysis_report.json") if self.analysis_report else None,
                "overall_score": self.analysis_report.get("overall_assessment", {}).get("overall_score", 0) if self.analysis_report else 0,
                "maturity_level": self.analysis_report.get("overall_assessment", {}).get("maturity_level", "unknown") if self.analysis_report else "unknown"
            },
            "decision_results": {
                "report_path": str(self.results_dir / "decisions.json") if self.decisions else None,
                "should_proceed": self.decisions.get("final_decision", {}).get("should_proceed", False) if self.decisions else False,
                "iteration_theme": self.decisions.get("iteration_focus", {}).get("iteration_theme", "") if self.decisions else ""
            },
            "packaging_results": {
                "package_path": self.package_path,
                "report_path": str(Path.home() / "Desktop" / "auto_packaging_report.json") if self.package_path else None
            },
            "summary": {
                "status": "completed" if self.package_path else "stopped",
                "recommendations": self._generate_recommendations(),
                "next_steps": self._generate_next_steps()
            }
        }
        
        # 保存最終報告
        final_report_path = self.results_dir / "final_report.json"
        with open(final_report_path, 'w', encoding='utf-8') as f:
            json.dump(final_report, f, indent=2, ensure_ascii=False)
        
        # 創建桌面摘要
        self._create_desktop_summary(final_report)
        
        print(f"✅ 最終報告: {final_report_path}")
        
        return final_report
    
    def _generate_recommendations(self) -> List[str]:
        """生成推薦"""
        recommendations = []
        
        if self.analysis_report:
            assessment = self.analysis_report.get("overall_assessment", {})
            score = assessment.get("overall_score", 0)
            
            if score < 40:
                recommendations.append("項目需要重大改進，建議進行全面重構")
            elif score < 60:
                recommendations.append("項目有改進空間，建議按優先級逐步優化")
            elif score < 80:
                recommendations.append("項目質量良好，建議專注於自動化和部署優化")
            else:
                recommendations.append("項目質量優秀，建議探索創新功能和生態建設")
        
        if self.decisions and not self.decisions.get("final_decision", {}).get("should_proceed", False):
            recommendations.append("根據分析結果，建議暫停當前迭代，重新評估項目方向")
        
        return recommendations
    
    def _generate_next_steps(self) -> List[str]:
        """生成下一步"""
        next_steps = []
        
        if self.package_path:
            next_steps.extend([
                f"1. 在桌面找到打包文件: {Path(self.package_path).name}",
                "2. 解壓縮包查看優化後的項目",
                "3. 運行 npm install 安裝依賴",
                "4. 查看分析報告了解改進建議",
                "5. 根據決策計劃實施後續迭代"
            ])
        else:
            next_steps.extend([
                "1. 查看分析報告了解項目問題",
                "2. 根據決策建議重新規劃項目",
                "3. 解決關鍵問題後重新運行系統"
            ])
        
        return next_steps
    
    def _create_desktop_summary(self, final_report: Dict[str, Any]):
        """創建桌面摘要"""
        desktop_path = Path.home() / "Desktop"
        summary_path = desktop_path / f"RAG_系統結果_{self.timestamp}.txt"
        
        summary = f"""RAG 自動化系統 - 執行結果
========================================

執行時間: {final_report['system_info']['execution_time']}
項目名稱: {final_report['project_info']['name']}

📊 分析結果
----------------------------------------
總體分數: {final_report['analysis_results']['overall_score']:.1f}/100
成熟度等級: {final_report['analysis_results']['maturity_level']}
是否繼續: {'✅ 是' if final_report['decision_results']['should_proceed'] else '❌ 否'}

🎯 迭代重點
----------------------------------------
主題: {final_report['decision_results']['iteration_theme']}

📦 打包結果
----------------------------------------
狀態: {final_report['summary']['status']}
打包文件: {final_report['packaging_results']['package_path'] or '無'}

💡 推薦
----------------------------------------
"""
        
        for i, rec in enumerate(final_report['summary']['recommendations'], 1):
            summary += f"{i}. {rec}\n"
        
        summary += """
🚀 下一步
----------------------------------------
"""
        
        for step in final_report['summary']['next_steps']:
            summary += f"{step}\n"
        
        summary += """
========================================
詳細報告請查看:
- 分析報告: output/ 目錄
- 打包報告: 桌面上的 JSON 文件
========================================
"""
        
        with open(summary_path, 'w', encoding='utf-8') as f:
            f.write(summary)
        
        print(f"✅ 桌面摘要: {summary_path}")


def main():
    """主函數"""
    if len(sys.argv) < 2:
        print("=" * 60)
        print("❌ 錯誤: 缺少項目路徑參數")
        print("=" * 60)
        print()
        print("用法:")
        print("  python main.py <項目路徑> [--no-cache]")
        print()
        print("參數:")
        print("  項目路徑    要分析的項目目錄路徑")
        print("  --no-cache  禁用緩存，強制重新分析")
        print()
        print("示例:")
        print("  python main.py C:\\projects\\my-app")
        print("  python main.py ~/projects/my-app --no-cache")
        print()
        print("提示:")
        print("  - 支持相對路徑和絕對路徑")
        print("  - 路徑中包含空格請使用引號")
        print("  - Windows路徑可以使用正斜杠或反斜杠")
        print("=" * 60)
        sys.exit(1)
    
    project_path = sys.argv[1]
    
    if not os.path.exists(project_path):
        print("=" * 60)
        print(f"❌ 錯誤: 項目路徑不存在")
        print("=" * 60)
        print()
        print(f"提供的路徑: {project_path}")
        print()
        print("請檢查:")
        print("  1. 路徑是否正確")
        print("  2. 項目目錄是否存在")
        print("  3. 是否有訪問權限")
        print()
        print("建議:")
        print("  - 使用絕對路徑")
        print("  - 檢查路徑拼寫")
        print("  - 確認項目已下載或克隆")
        print("=" * 60)
        sys.exit(1)
    
    if not os.path.isdir(project_path):
        print("=" * 60)
        print(f"❌ 錯誤: 路徑不是目錄")
        print("=" * 60)
        print()
        print(f"提供的路徑: {project_path}")
        print()
        print("RAG系統需要一個項目目錄作為輸入")
        print("請提供目錄路徑而不是文件路徑")
        print("=" * 60)
        sys.exit(1)
    
    # 創建並運行系統
    use_cache = '--no-cache' not in sys.argv
    system = RAGAutomationSystem(project_path, use_cache=use_cache)
    final_report = system.run_full_analysis()
    
    # 打印最終摘要
    print("\n" + "=" * 60)
    print("🎉 RAG 自動化系統執行完成!")
    print("=" * 60)
    print(f"項目: {final_report['project_info']['name']}")
    print(f"狀態: {final_report['summary']['status']}")
    print(f"分數: {final_report['analysis_results']['overall_score']:.1f}/100")
    
    # 打印緩存統計
    if system.use_cache and system.cache_manager:
        stats = system.cache_manager.get_statistics()
        print(f"緩存命中: {stats['hits']}/{stats['hits'] + stats['misses']}")
    
    if final_report['packaging_results']['package_path']:
        print(f"打包文件: {final_report['packaging_results']['package_path']}")
        print("✅ 請查看桌面上的打包文件和報告")
    else:
        print("⚠️  未生成打包文件，請查看分析報告了解原因")
    
    print("=" * 60)


if __name__ == "__main__":
    main()