#!/usr/bin/env python3
"""
集成增量處理模塊的 RAG 自動化系統
展示如何將增量處理集成到現有系統中
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime

# 添加模塊路徑
sys.path.insert(0, str(Path(__file__).parent / "modules"))

from rag_analyzer import ProjectAnalyzer
from incremental_processing_module import IncrementalProcessingModule


def rag_file_processor(file_path: str) -> Dict[str, Any]:
    """
    RAG 文件處理函數
    
    Args:
        file_path: 文件路徑
        
    Returns:
        處理結果
    """
    path = Path(file_path)
    
    # 這裡可以實現具體的 RAG 處理邏輯
    # 例如：代碼分析、文檔生成、質量檢查等
    
    result = {
        "file_path": str(path),
        "file_size": path.stat().st_size if path.exists() else 0,
        "file_type": path.suffix,
        "processed_at": datetime.now().isoformat(),
        "rag_analysis": {
            "code_quality_score": 0,
            "documentation_score": 0,
            "security_score": 0,
            "recommendations": []
        }
    }
    
    return result


def run_incremental_rag_analysis(project_path: str):
    """
    運行增量 RAG 分析
    
    Args:
        project_path: 項目路徑
    """
    print("=" * 70)
    print("🚀 增量 RAG 自動化系統")
    print("=" * 70)
    print(f"📁 分析項目: {project_path}")
    
    # 創建結果目錄
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_dir = Path(__file__).parent / "output" / f"incremental_{timestamp}"
    results_dir.mkdir(parents=True, exist_ok=True)
    print(f"📊 結果目錄: {results_dir}")
    print("=" * 70)
    
    # 步驟 1: 初始化增量處理模塊
    print("\n1️⃣  初始化增量處理模塊")
    print("-" * 45)
    print("⚙️  創建增量處理模塊...")
    
    incremental_module = IncrementalProcessingModule(project_path)
    
    # 獲取當前狀態
    summary = incremental_module.get_processing_summary()
    print(f"✅ 增量處理模塊初始化完成:")
    print(f"   追蹤文件數: {summary['file_tracking']['tracked_files']}")
    print(f"   上次處理時間: {summary['file_tracking']['last_updated'] or '從未處理'}")
    
    # 步驟 2: 檢測變化
    print("\n2️⃣  檢測項目變化")
    print("-" * 45)
    print("🔍 檢測項目中的變化...")
    
    # 定義要監控的文件類型
    code_extensions = [".py", ".js", ".ts", ".java", ".go", ".cpp", ".c", ".cs"]
    config_extensions = [".json", ".yaml", ".yml", ".toml", ".ini", ".cfg"]
    doc_extensions = [".md", ".txt", ".rst", ".adoc"]
    
    all_extensions = code_extensions + config_extensions + doc_extensions
    
    changes = incremental_module.detect_changes(all_extensions)
    
    # 保存變化報告
    changes_path = results_dir / "changes_report.json"
    with open(changes_path, 'w', encoding='utf-8') as f:
        json.dump(changes, f, indent=2, ensure_ascii=False)
    
    print(f"📄 變化報告已保存: {changes_path}")
    
    # 步驟 3: 增量處理
    print("\n3️⃣  增量處理階段")
    print("-" * 45)
    
    if not (changes["new_files"] or changes["modified_files"]):
        print("✅ 沒有需要處理的文件，跳過處理")
        print("\n" + "=" * 70)
        print("🎉 增量 RAG 分析完成 - 沒有變化需要處理")
        print("=" * 70)
        return
    
    print(f"🔄 開始增量處理 {len(changes['new_files'] + changes['modified_files'])} 個文件...")
    
    # 執行增量處理
    processing_results = incremental_module.process_incrementally(
        processor_func=rag_file_processor,
        extensions=all_extensions,
        batch_size=5
    )
    
    # 保存處理結果
    results_path = results_dir / "processing_results.json"
    with open(results_path, 'w', encoding='utf-8') as f:
        json.dump(processing_results, f, indent=2, ensure_ascii=False)
    
    print(f"📄 處理結果已保存: {results_path}")
    
    # 步驟 4: RAG 分析（僅處理新文件和修改的文件）
    print("\n4️⃣  RAG 分析階段")
    print("-" * 45)
    print("🔍 執行 RAG 分析...")
    
    # 創建 RAG 分析器
    analyzer = ProjectAnalyzer(project_path)
    
    # 生成分析報告
    analysis_report = analyzer.generate_analysis_report()
    
    # 保存分析報告
    analysis_path = results_dir / "analysis_report.json"
    analyzer.save_report(analysis_report, str(analysis_path))
    
    assessment = analysis_report.get("overall_assessment", {})
    print(f"✅ RAG 分析完成:")
    print(f"   總體分數: {assessment.get('overall_score', 0):.1f}/100")
    print(f"   成熟度等級: {assessment.get('maturity_level', 'unknown')}")
    print(f"   建議數量: {len(analysis_report.get('recommendations', []))}")
    
    # 步驟 5: 生成綜合報告
    print("\n5️⃣  生成綜合報告")
    print("-" * 45)
    print("📄 生成增量處理綜合報告...")
    
    # 創建綜合報告
    comprehensive_report = {
        "system_info": {
            "name": "增量 RAG 自動化系統",
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
        "incremental_processing": {
            "changes_detected": {
                "new_files": len(changes["new_files"]),
                "modified_files": len(changes["modified_files"]),
                "deleted_files": len(changes["deleted_files"]),
                "unchanged_files": len(changes["unchanged_files"])
            },
            "processing_results": {
                "total_processed": processing_results["results"]["successful"] + processing_results["results"]["failed"],
                "successful": processing_results["results"]["successful"],
                "failed": processing_results["results"]["failed"]
            },
            "time_savings": incremental_module.estimate_time_savings()
        },
        "rag_analysis": {
            "overall_score": assessment.get('overall_score', 0),
            "maturity_level": assessment.get('maturity_level', 'unknown'),
            "key_metrics": analysis_report.get("key_metrics", {}),
            "recommendations_count": len(analysis_report.get('recommendations', []))
        },
        "efficiency_metrics": calculate_efficiency_metrics(changes, processing_results),
        "recommendations": generate_incremental_recommendations(changes, processing_results, analysis_report)
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
    print("🎉 增量 RAG 自動化系統執行完成!")
    print("=" * 70)
    print(f"項目: {Path(project_path).name}")
    print(f"檢測到變化: {len(changes['new_files'] + changes['modified_files'])} 個文件")
    print(f"成功處理: {processing_results['results']['successful']} 個文件")
    print(f"跳過處理: {len(changes['unchanged_files'])} 個未變化文件")
    
    time_savings = comprehensive_report["incremental_processing"]["time_savings"]
    print(f"估計節省時間: {time_savings['estimated_time_saved_minutes']:.2f} 分鐘")
    
    print(f"RAG 分析分數: {assessment.get('overall_score', 0):.1f}/100")
    print(f"詳細報告請查看: {results_dir}")
    print("=" * 70)
    
    return comprehensive_report


def calculate_efficiency_metrics(changes, processing_results):
    """計算效率指標"""
    total_files = len(changes["new_files"] + changes["modified_files"] + changes["unchanged_files"] + changes["deleted_files"])
    unchanged_files = len(changes["unchanged_files"])
    
    if total_files > 0:
        efficiency_rate = unchanged_files / total_files * 100
    else:
        efficiency_rate = 0
    
    return {
        "total_files": total_files,
        "unchanged_files": unchanged_files,
        "efficiency_rate_percent": efficiency_rate,
        "processing_success_rate": processing_results["results"]["successful"] / max(1, len(changes["new_files"] + changes["modified_files"])) * 100
    }


def generate_incremental_recommendations(changes, processing_results, analysis_report):
    """生成增量處理建議"""
    recommendations = []
    
    # 基於變化類型的建議
    if changes["new_files"]:
        recommendations.append(f"新增 {len(changes['new_files'])} 個文件，建議進行全面審查")
    
    if changes["modified_files"]:
        recommendations.append(f"修改 {len(changes['modified_files'])} 個文件，建議重點關注修改內容")
    
    if changes["deleted_files"]:
        recommendations.append(f"刪除 {len(changes['deleted_files'])} 個文件，檢查是否有依賴關係需要更新")
    
    # 基於處理結果的建議
    if processing_results["results"]["failed"] > 0:
        recommendations.append(f"{processing_results['results']['failed']} 個文件處理失敗，建議檢查錯誤日誌")
    
    # 基於 RAG 分析的建議
    rag_recommendations = analysis_report.get("recommendations", [])
    if rag_recommendations:
        recommendations.append("根據 RAG 分析，優先處理以下建議:")
        recommendations.extend([f"  - {rec}" for rec in rag_recommendations[:3]])  # 只取前3個
    
    return recommendations


def create_text_summary(report, output_path):
    """創建文本摘要"""
    summary = f"""增量 RAG 自動化系統 - 分析結果摘要
================================================

執行時間: {report['system_info']['execution_time']}
項目名稱: {report['project_info']['name']}
項目路徑: {report['project_info']['path']}

📊 項目概況
------------------------------------------------
總體分數: {report['project_info']['overall_score']}/100
成熟度等級: {report['project_info']['maturity_level']}

🔄 增量處理統計
------------------------------------------------
新文件: {report['incremental_processing']['changes_detected']['new_files']} 個
修改的文件: {report['incremental_processing']['changes_detected']['modified_files']} 個
刪除的文件: {report['incremental_processing']['changes_detected']['deleted_files']} 個
未變化的文件: {report['incremental_processing']['changes_detected']['unchanged_files']} 個

成功處理: {report['incremental_processing']['processing_results']['successful']} 個文件
處理失敗: {report['incremental_processing']['processing_results']['failed']} 個文件

⏱️  效率指標
------------------------------------------------
總文件數: {report['efficiency_metrics']['total_files']}
跳過處理: {report['efficiency_metrics']['unchanged_files']} 個文件
處理效率: {report['efficiency_metrics']['efficiency_rate_percent']:.1f}%
估計節省時間: {report['incremental_processing']['time_savings']['estimated_time_saved_minutes']:.2f} 分鐘

📋 建議
------------------------------------------------
"""
    
    for i, recommendation in enumerate(report['recommendations'], 1):
        summary += f"{i}. {recommendation}\n"
    
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
        print("用法: python run_with_incremental_processing.py <項目路徑>")
        print("示例: python run_with_incremental_processing.py /path/to/your/project")
        print("\n可用測試項目:")
        print("  python run_with_incremental_processing.py test-project")
        sys.exit(1)
    
    project_path = sys.argv[1]
    
    if not os.path.exists(project_path):
        print(f"錯誤: 項目路徑不存在: {project_path}")
        sys.exit(1)
    
    # 運行增量 RAG 分析
    report = run_incremental_rag_analysis(project_path)
    
    # 打印成功消息
    if report:
        print(f"\n✅ 增量分析完成！請查看 output/ 目錄中的報告文件。")


if __name__ == "__main__":
    main()