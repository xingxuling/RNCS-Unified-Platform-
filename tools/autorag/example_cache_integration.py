#!/usr/bin/env python3
"""
緩存模塊集成示例
展示如何將緩存功能集成到現有RAG系統中
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime

# 添加模塊路徑
sys.path.insert(0, str(Path(__file__).parent / "modules"))

from cache_manager import CacheManager
from rag_analyzer import ProjectAnalyzer
from processing_module_simple import ProcessingModule


class CachedProcessingModule:
    """帶緩存的處理模塊"""
    
    def __init__(self, project_path: str, cache_manager: CacheManager = None):
        self.project_path = project_path
        
        if cache_manager is None:
            cache_manager = CacheManager()
        self.cache_manager = cache_manager
        
        self.processor = ProcessingModule(project_path)
    
    def process_project(self, analysis_report, use_cache=True):
        """處理項目（帶緩存）"""
        print("⚙️  執行數據處理...")
        
        # 嘗試從緩存獲取
        if use_cache:
            cached_data = self.cache_manager.get(self.project_path, "processing")
            if cached_data is not None:
                print("✅ 從緩存加載處理結果")
                return cached_data
        
        # 執行實際處理
        processed_results = self.processor.process_project(analysis_report)
        
        # 應用優化
        optimizations = processed_results.get("optimizations", [])
        if optimizations:
            optimization_results = self.processor.optimize_project(optimizations)
            processed_results["optimization_results"] = optimization_results
        
        # 驗證處理結果
        validation = self.processor.validate_processing()
        processed_results["validation"] = validation
        
        # 保存到緩存
        if use_cache:
            self.cache_manager.set(self.project_path, "processing", processed_results)
            print("💾 處理結果已緩存")
        
        return processed_results


class EnhancedSystemWithCache:
    """帶緩存的增強系統示例"""
    
    def __init__(self, project_path: str):
        self.project_path = project_path
        self.cache_manager = CacheManager()
        self.timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.results_dir = Path(__file__).parent / "output" / f"cache_example_{self.timestamp}"
        self.results_dir.mkdir(parents=True, exist_ok=True)
        
        # 緩存統計
        self.cache_hits = 0
        self.cache_misses = 0
    
    def run_full_analysis(self):
        """運行完整分析流程（帶緩存）"""
        print("=" * 60)
        print("🚀 帶緩存的完整分析流程")
        print("=" * 60)
        print(f"項目: {self.project_path}")
        print(f"緩存目錄: {self.cache_manager.cache_dir}")
        print("=" * 60)
        
        # 1. RAG分析
        print("\n1️⃣  RAG分析階段")
        analysis_report = self._run_cached_analysis()
        
        # 2. 數據處理
        print("\n2️⃣  數據處理階段")
        processed_data = self._run_cached_processing(analysis_report)
        
        # 3. 顯示結果
        print("\n3️⃣  結果展示")
        self._show_results(analysis_report, processed_data)
        
        # 4. 緩存統計
        print("\n4️⃣  緩存統計")
        self._show_cache_statistics()
        
        return analysis_report, processed_data
    
    def _run_cached_analysis(self):
        """運行帶緩存的RAG分析"""
        print("🔍 執行RAG分析...")
        
        # 嘗試從緩存獲取
        cached_data = self.cache_manager.get(self.project_path, "analysis")
        if cached_data is not None:
            print("✅ 從緩存加載分析報告")
            self.cache_hits += 1
            return cached_data
        
        # 執行實際分析
        analyzer = ProjectAnalyzer(self.project_path)
        report = analyzer.generate_analysis_report()
        
        # 保存到文件
        report_path = self.results_dir / "analysis_report.json"
        analyzer.save_report(report, str(report_path))
        
        # 保存到緩存
        self.cache_manager.set(self.project_path, "analysis", report)
        print("💾 分析報告已緩存")
        self.cache_misses += 1
        
        return report
    
    def _run_cached_processing(self, analysis_report):
        """運行帶緩存的數據處理"""
        print("⚙️  執行數據處理...")
        
        # 使用帶緩存的處理模塊
        cached_processor = CachedProcessingModule(self.project_path, self.cache_manager)
        
        # 處理項目數據
        processed_results = cached_processor.process_project(analysis_report)
        
        # 保存到文件
        processed_path = self.results_dir / "processed_data.json"
        with open(processed_path, 'w', encoding='utf-8') as f:
            json.dump(processed_results, f, indent=2, ensure_ascii=False)
        
        return processed_results
    
    def _show_results(self, analysis_report, processed_data):
        """顯示分析結果"""
        # 分析結果
        assessment = analysis_report.get("overall_assessment", {})
        print(f"📊 分析結果:")
        print(f"   總體分數: {assessment.get('overall_score', 0):.1f}/100")
        print(f"   成熟度等級: {assessment.get('maturity_level', 'unknown')}")
        print(f"   建議數量: {len(analysis_report.get('recommendations', []))}")
        
        # 處理結果
        if processed_data:
            quality_score = processed_data.get("quality_metrics", {}).get("overall_score", 0)
            optimizations = processed_data.get("optimizations", [])
            validation = processed_data.get("validation", {})
            
            print(f"📈 處理結果:")
            print(f"   質量分數: {quality_score}")
            print(f"   優化應用: {len(optimizations)} 個")
            print(f"   驗證結果: {'✅ 有效' if validation.get('is_valid', False) else '❌ 無效'}")
    
    def _show_cache_statistics(self):
        """顯示緩存統計"""
        stats = self.cache_manager.get_stats()
        
        print(f"💾 緩存統計:")
        print(f"   緩存項目數: {stats['total_cached']}")
        print(f"   緩存大小: {stats['total_size_mb']:.2f} MB")
        print(f"   總命中次數: {stats['hits']}")
        print(f"   總未命中次數: {stats['misses']}")
        print(f"   總命中率: {stats['hit_rate_percent']}%")
        print(f"   本次命中: {self.cache_hits}")
        print(f"   本次未命中: {self.cache_misses}")
        
        # 列出緩存的項目
        projects = self.cache_manager.list_cached_projects()
        if projects:
            print(f"📁 緩存的項目:")
            for i, project in enumerate(projects[:2], 1):
                print(f"   {i}. {Path(project['path']).name}")
                print(f"      類型: {', '.join(project['cache_types'])}")
                print(f"      大小: {project['total_size_mb']:.2f} MB")


def demonstrate_cache_benefits():
    """演示緩存帶來的好處"""
    print("\n" + "=" * 60)
    print("📈 緩存性能演示")
    print("=" * 60)
    
    import time
    import tempfile
    import shutil
    
    # 創建測試項目
    test_project_dir = tempfile.mkdtemp(prefix="cache_demo_")
    print(f"測試項目目錄: {test_project_dir}")
    
    try:
        # 創建簡單項目結構
        (Path(test_project_dir) / "package.json").write_text('{"name": "demo-project", "version": "1.0.0"}')
        (Path(test_project_dir) / "README.md").write_text("# Demo Project")
        
        # 創建緩存管理器
        cache_manager = CacheManager()
        
        # 第一次運行（應該未命中緩存）
        print("\n🔍 第一次運行（未命中緩存）:")
        start_time = time.time()
        
        analyzer = ProjectAnalyzer(test_project_dir)
        report1 = analyzer.generate_analysis_report()
        
        # 保存到緩存
        cache_manager.set(test_project_dir, "analysis", report1)
        
        first_run_time = time.time() - start_time
        print(f"   用時: {first_run_time:.2f}秒")
        print(f"   分數: {report1.get('overall_assessment', {}).get('overall_score', 0):.1f}/100")
        
        # 第二次運行（應該命中緩存）
        print("\n🔍 第二次運行（命中緩存）:")
        start_time = time.time()
        
        cached_data = cache_manager.get(test_project_dir, "analysis")
        
        second_run_time = time.time() - start_time
        print(f"   用時: {second_run_time:.2f}秒")
        
        if cached_data:
            print(f"   分數: {cached_data.get('overall_assessment', {}).get('overall_score', 0):.1f}/100")
            print(f"   ✅ 從緩存加載成功")
        
        # 計算性能提升
        if first_run_time > 0:
            speedup = first_run_time / second_run_time if second_run_time > 0 else 0
            print(f"\n🚀 性能提升:")
            print(f"   第一次運行: {first_run_time:.2f}秒")
            print(f"   第二次運行: {second_run_time:.2f}秒")
            print(f"   加速比: {speedup:.1f}x")
            print(f"   時間節省: {(first_run_time - second_run_time):.2f}秒")
        
        # 顯示緩存統計
        stats = cache_manager.get_stats()
        print(f"\n📊 最終緩存統計:")
        print(f"   命中率: {stats['hit_rate_percent']}%")
        print(f"   緩存大小: {stats['total_size_mb']:.2f} MB")
        
    finally:
        # 清理
        if os.path.exists(test_project_dir):
            shutil.rmtree(test_project_dir)
            print(f"\n🧹 已清理測試目錄")


def main():
    """主函數"""
    if len(sys.argv) < 2:
        print("用法: python example_cache_integration.py <項目路徑>")
        print("示例: python example_cache_integration.py /path/to/your/project")
        print("\n或者使用演示模式:")
        print("python example_cache_integration.py --demo")
        sys.exit(1)
    
    if sys.argv[1] == "--demo":
        demonstrate_cache_benefits()
        return
    
    project_path = sys.argv[1]
    
    if not os.path.exists(project_path):
        print(f"錯誤: 項目路徑不存在: {project_path}")
        sys.exit(1)
    
    # 運行帶緩存的系統
    system = EnhancedSystemWithCache(project_path)
    system.run_full_analysis()
    
    print("\n" + "=" * 60)
    print("✅ 緩存集成示例完成！")
    print("=" * 60)
    print("\n💡 提示:")
    print("1. 再次運行相同項目會從緩存加載，速度更快")
    print("2. 查看緩存目錄: ~/.cache/rag-system")
    print("3. 使用 cache_manager.py 管理緩存")


if __name__ == "__main__":
    main()