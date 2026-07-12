#!/usr/bin/env python3
"""
測試緩存模塊
"""

import os
import sys
import tempfile
import shutil
from pathlib import Path

# 添加模塊路徑
sys.path.insert(0, str(Path(__file__).parent / "modules"))

from cache_manager import CacheManager, CachedRAGAnalyzer


def test_cache_manager():
    """測試緩存管理器"""
    print("🧪 測試緩存管理器")
    print("=" * 50)
    
    # 創建臨時緩存目錄
    temp_cache_dir = tempfile.mkdtemp(prefix="test_cache_")
    print(f"臨時緩存目錄: {temp_cache_dir}")
    
    try:
        # 創建緩存管理器
        cache_manager = CacheManager(cache_dir=temp_cache_dir, ttl_hours=1)
        
        # 測試初始統計
        stats = cache_manager.get_stats()
        print(f"初始統計:")
        print(f"  緩存項目數: {stats['total_cached']}")
        print(f"  緩存大小: {stats['total_size_mb']:.2f} MB")
        print(f"  命中率: {stats['hit_rate_percent']}%")
        
        # 創建測試數據
        test_project_path = "/tmp/test_project"
        test_data = {
            "project_name": "Test Project",
            "score": 85,
            "recommendations": ["Fix issue 1", "Add tests", "Improve documentation"]
        }
        
        # 測試設置緩存
        print("\n🔧 測試設置緩存...")
        success = cache_manager.set(test_project_path, "analysis", test_data)
        print(f"設置緩存結果: {'✅ 成功' if success else '❌ 失敗'}")
        
        # 測試獲取緩存（應該命中）
        print("\n🔍 測試獲取緩存（應該命中）...")
        cached_data = cache_manager.get(test_project_path, "analysis")
        if cached_data:
            print(f"✅ 緩存命中:")
            print(f"  項目名稱: {cached_data.get('project_name')}")
            print(f"  分數: {cached_data.get('score')}")
            print(f"  建議數量: {len(cached_data.get('recommendations', []))}")
        else:
            print("❌ 緩存未命中")
        
        # 測試獲取不存在的緩存（應該未命中）
        print("\n🔍 測試獲取不存在的緩存（應該未命中）...")
        non_existent_data = cache_manager.get("/non/existent/path", "analysis")
        print(f"結果: {'❌ 未命中（正確）' if non_existent_data is None else '⚠️  命中（異常）'}")
        
        # 測試緩存統計更新
        stats = cache_manager.get_stats()
        print(f"\n📊 更新後的統計:")
        print(f"  命中次數: {stats['hits']}")
        print(f"  未命中次數: {stats['misses']}")
        print(f"  設置次數: {stats['sets']}")
        print(f"  命中率: {stats['hit_rate_percent']}%")
        
        # 測試列出緩存項目
        print("\n📁 列出緩存項目...")
        projects = cache_manager.list_cached_projects()
        for i, project in enumerate(projects, 1):
            print(f"{i}. {project['path']}")
            print(f"   類型: {', '.join(project['cache_types'])}")
            print(f"   大小: {project['total_size_mb']:.2f} MB")
            print(f"   最後訪問: {project['last_accessed_str']}")
        
        # 測試刪除緩存
        print("\n🗑️  測試刪除緩存...")
        deleted_count = cache_manager.delete(test_project_path, "analysis")
        print(f"刪除了 {deleted_count} 個緩存")
        
        # 驗證緩存已被刪除
        cached_data = cache_manager.get(test_project_path, "analysis")
        print(f"驗證刪除: {'✅ 成功' if cached_data is None else '❌ 失敗'}")
        
        # 測試清空緩存
        print("\n🗑️  測試清空所有緩存...")
        # 先添加一些測試數據
        for i in range(3):
            cache_manager.set(f"/test/project/{i}", "analysis", {"id": i, "data": f"test_{i}"})
        
        deleted_count = cache_manager.clear()
        print(f"清空了 {deleted_count} 個緩存文件")
        
        # 驗證緩存已被清空
        stats = cache_manager.get_stats()
        print(f"最終統計 - 緩存項目數: {stats['total_cached']}")
        
        print("\n✅ 緩存管理器測試完成！")
        
    finally:
        # 清理臨時目錄
        if os.path.exists(temp_cache_dir):
            shutil.rmtree(temp_cache_dir)
            print(f"\n🧹 已清理臨時目錄: {temp_cache_dir}")


def test_cached_rag_analyzer():
    """測試帶緩存的RAG分析器"""
    print("\n" + "=" * 50)
    print("🧪 測試帶緩存的RAG分析器")
    print("=" * 50)
    
    # 創建測試項目目錄
    test_project_dir = tempfile.mkdtemp(prefix="test_project_")
    print(f"測試項目目錄: {test_project_dir}")
    
    try:
        # 創建簡單的項目結構
        (Path(test_project_dir) / "package.json").write_text('{"name": "test-project", "version": "1.0.0"}')
        (Path(test_project_dir) / "README.md").write_text("# Test Project\\n\\nThis is a test project.")
        
        # 創建臨時緩存目錄
        temp_cache_dir = tempfile.mkdtemp(prefix="test_analyzer_cache_")
        
        # 創建緩存管理器
        cache_manager = CacheManager(cache_dir=temp_cache_dir)
        
        # 創建帶緩存的RAG分析器
        print("\n🔍 創建帶緩存的RAG分析器...")
        cached_analyzer = CachedRAGAnalyzer(test_project_dir, cache_manager)
        
        # 第一次運行（應該未命中緩存）
        print("\n第一次運行（應該未命中緩存）:")
        report1 = cached_analyzer.generate_analysis_report()
        print(f"分析完成，分數: {report1.get('overall_assessment', {}).get('overall_score', 0):.1f}/100")
        
        # 第二次運行（應該命中緩存）
        print("\n第二次運行（應該命中緩存）:")
        report2 = cached_analyzer.generate_analysis_report()
        print(f"從緩存加載，分數: {report2.get('overall_assessment', {}).get('overall_score', 0):.1f}/100")
        
        # 顯示緩存統計
        stats = cache_manager.get_stats()
        print(f"\n📊 緩存統計:")
        print(f"  命中次數: {stats['hits']}")
        print(f"  未命中次數: {stats['misses']}")
        print(f"  設置次數: {stats['sets']}")
        print(f"  命中率: {stats['hit_rate_percent']}%")
        
        print("\n✅ 帶緩存的RAG分析器測試完成！")
        
    finally:
        # 清理臨時目錄
        for dir_path in [test_project_dir, temp_cache_dir]:
            if os.path.exists(dir_path):
                shutil.rmtree(dir_path)
                print(f"🧹 已清理臨時目錄: {dir_path}")


def main():
    """主測試函數"""
    print("🚀 開始緩存模塊測試")
    print("=" * 60)
    
    try:
        # 測試緩存管理器
        test_cache_manager()
        
        # 測試帶緩存的RAG分析器
        test_cached_rag_analyzer()
        
        print("\n" + "=" * 60)
        print("🎉 所有測試完成！")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ 測試過程中發生錯誤: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main())