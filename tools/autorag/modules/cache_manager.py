#!/usr/bin/env python3
"""
本地緩存模塊
為增強版RAG系統提供本地緩存功能
"""

import os
import json
import hashlib
import time
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime


class CacheManager:
    """緩存管理器"""
    
    def __init__(self, cache_dir: str = None, ttl_hours: int = 24):
        """
        初始化緩存管理器
        
        Args:
            cache_dir: 緩存目錄路徑，默認為 ~/.cache/rag-system
            ttl_hours: 緩存生存時間（小時），默認24小時
        """
        if cache_dir is None:
            cache_dir = os.path.expanduser("~/.cache/rag-system")
        
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.ttl_seconds = ttl_hours * 3600
        
        # 緩存統計
        self.stats = {
            "hits": 0,
            "misses": 0,
            "sets": 0,
            "evictions": 0,
            "errors": 0
        }
        
        # 緩存索引文件
        self.index_file = self.cache_dir / "cache_index.json"
        self._load_index()
    
    def _load_index(self):
        """加載緩存索引"""
        if self.index_file.exists():
            try:
                with open(self.index_file, 'r', encoding='utf-8') as f:
                    self.index = json.load(f)
            except:
                self.index = {}
        else:
            self.index = {}
    
    def _save_index(self):
        """保存緩存索引"""
        try:
            with open(self.index_file, 'w', encoding='utf-8') as f:
                json.dump(self.index, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"保存緩存索引失敗: {e}")
    
    def _generate_cache_key(self, project_path: str, cache_type: str, 
                           content_hash: str = None) -> str:
        """
        生成緩存鍵
        
        Args:
            project_path: 項目路徑
            cache_type: 緩存類型（analysis, processing, learning, decision, packaging）
            content_hash: 內容哈希（可選）
        
        Returns:
            緩存鍵字符串
        """
        # 標準化項目路徑
        project_path = os.path.abspath(project_path)
        
        # 如果沒有提供內容哈希，生成一個基於路徑和時間的哈希
        if content_hash is None:
            content_hash = hashlib.md5(
                f"{project_path}:{time.time():.0f}".encode()
            ).hexdigest()[:8]
        
        # 生成緩存鍵
        key_parts = [
            cache_type,
            hashlib.md5(project_path.encode()).hexdigest()[:12],
            content_hash[:8]
        ]
        
        return "_".join(key_parts)
    
    def _get_project_hash(self, project_path: str) -> str:
        """
        計算項目哈希值
        
        Args:
            project_path: 項目路徑
        
        Returns:
            項目哈希字符串
        """
        project_path = Path(project_path)
        
        # 收集關鍵文件信息
        file_info = []
        
        # 檢查關鍵文件
        critical_files = [
            "package.json",
            "README.md",
            "tsconfig.json",
            "app.json",
            "index.js",
            "App.js",
            "App.tsx"
        ]
        
        for file_name in critical_files:
            file_path = project_path / file_name
            if file_path.exists():
                try:
                    # 獲取文件修改時間和大小
                    stat = file_path.stat()
                    file_info.append(f"{file_name}:{stat.st_mtime}:{stat.st_size}")
                except:
                    pass
        
        # 獲取目錄結構信息
        try:
            dirs = []
            files = []
            for root, dirnames, filenames in os.walk(project_path):
                # 只考慮前兩層目錄
                depth = root[len(str(project_path)):].count(os.sep)
                if depth <= 2:
                    dirs.extend(dirnames)
                    files.extend(filenames[:20])  # 只取前20個文件
            
            dirs.sort()
            files.sort()
            file_info.append(f"dirs:{','.join(dirs[:10])}")
            file_info.append(f"files:{','.join(files[:20])}")
        except:
            pass
        
        # 生成哈希
        if file_info:
            content = ":".join(file_info)
            return hashlib.md5(content.encode()).hexdigest()[:16]
        else:
            return hashlib.md5(str(project_path).encode()).hexdigest()[:16]
    
    def _get_cache_file_path(self, cache_key: str) -> Path:
        """獲取緩存文件路徑"""
        # 使用前兩個字符作為子目錄，避免單個目錄文件過多
        subdir = cache_key[:2]
        subdir_path = self.cache_dir / subdir
        subdir_path.mkdir(exist_ok=True)
        
        return subdir_path / f"{cache_key}.json"
    
    def _is_cache_valid(self, cache_key: str) -> bool:
        """檢查緩存是否有效（未過期）"""
        if cache_key not in self.index:
            return False
        
        cache_info = self.index[cache_key]
        created_time = cache_info.get("created_at", 0)
        
        # 檢查是否過期
        if time.time() - created_time > self.ttl_seconds:
            return False
        
        # 檢查緩存文件是否存在
        cache_file = self._get_cache_file_path(cache_key)
        return cache_file.exists()
    
    def _clean_expired_cache(self):
        """清理過期緩存"""
        current_time = time.time()
        expired_keys = []
        
        for cache_key, cache_info in self.index.items():
            created_time = cache_info.get("created_at", 0)
            if current_time - created_time > self.ttl_seconds:
                expired_keys.append(cache_key)
        
        for cache_key in expired_keys:
            self._delete_cache(cache_key)
            self.stats["evictions"] += 1
        
        if expired_keys:
            print(f"清理了 {len(expired_keys)} 個過期緩存")
    
    def _delete_cache(self, cache_key: str):
        """刪除緩存"""
        try:
            # 刪除緩存文件
            cache_file = self._get_cache_file_path(cache_key)
            if cache_file.exists():
                cache_file.unlink()
            
            # 從索引中移除
            if cache_key in self.index:
                del self.index[cache_key]
            
            return True
        except Exception as e:
            print(f"刪除緩存失敗 {cache_key}: {e}")
            self.stats["errors"] += 1
            return False
    
    def get(self, project_path: str, cache_type: str) -> Optional[Dict[str, Any]]:
        """
        獲取緩存數據
        
        Args:
            project_path: 項目路徑
            cache_type: 緩存類型
        
        Returns:
            緩存數據或None
        """
        # 計算項目哈希
        project_hash = self._get_project_hash(project_path)
        
        # 生成緩存鍵
        cache_key = self._generate_cache_key(project_path, cache_type, project_hash)
        
        # 檢查緩存有效性
        if not self._is_cache_valid(cache_key):
            self.stats["misses"] += 1
            return None
        
        try:
            # 讀取緩存文件
            cache_file = self._get_cache_file_path(cache_key)
            with open(cache_file, 'r', encoding='utf-8') as f:
                cache_data = json.load(f)
            
            # 更新訪問時間
            if cache_key in self.index:
                self.index[cache_key]["last_accessed"] = time.time()
                self._save_index()
            
            self.stats["hits"] += 1
            return cache_data.get("data")
        
        except Exception as e:
            print(f"讀取緩存失敗 {cache_key}: {e}")
            self.stats["errors"] += 1
            self.stats["misses"] += 1
            return None
    
    def set(self, project_path: str, cache_type: str, data: Dict[str, Any]) -> bool:
        """
        設置緩存數據
        
        Args:
            project_path: 項目路徑
            cache_type: 緩存類型
            data: 要緩存的數據
        
        Returns:
            是否成功
        """
        # 計算項目哈希
        project_hash = self._get_project_hash(project_path)
        
        # 生成緩存鍵
        cache_key = self._generate_cache_key(project_path, cache_type, project_hash)
        
        try:
            # 準備緩存數據
            cache_data = {
                "key": cache_key,
                "project_path": os.path.abspath(project_path),
                "cache_type": cache_type,
                "project_hash": project_hash,
                "created_at": time.time(),
                "data": data
            }
            
            # 寫入緩存文件
            cache_file = self._get_cache_file_path(cache_key)
            with open(cache_file, 'w', encoding='utf-8') as f:
                json.dump(cache_data, f, indent=2, ensure_ascii=False)
            
            # 更新索引
            self.index[cache_key] = {
                "project_path": os.path.abspath(project_path),
                "cache_type": cache_type,
                "project_hash": project_hash,
                "created_at": time.time(),
                "last_accessed": time.time(),
                "size": cache_file.stat().st_size if cache_file.exists() else 0
            }
            
            self._save_index()
            self.stats["sets"] += 1
            
            return True
        
        except Exception as e:
            print(f"設置緩存失敗 {cache_key}: {e}")
            self.stats["errors"] += 1
            return False
    
    def delete(self, project_path: str = None, cache_type: str = None) -> int:
        """
        刪除緩存
        
        Args:
            project_path: 項目路徑（可選，None表示所有項目）
            cache_type: 緩存類型（可選，None表示所有類型）
        
        Returns:
            刪除的緩存數量
        """
        deleted_count = 0
        
        # 收集要刪除的緩存鍵
        keys_to_delete = []
        
        for cache_key, cache_info in self.index.items():
            match_project = (project_path is None or 
                           os.path.abspath(project_path) == cache_info.get("project_path"))
            match_type = (cache_type is None or 
                         cache_type == cache_info.get("cache_type"))
            
            if match_project and match_type:
                keys_to_delete.append(cache_key)
        
        # 刪除緩存
        for cache_key in keys_to_delete:
            if self._delete_cache(cache_key):
                deleted_count += 1
        
        return deleted_count
    
    def clear(self):
        """清空所有緩存"""
        deleted_count = 0
        
        # 刪除所有緩存文件
        for cache_file in self.cache_dir.rglob("*.json"):
            try:
                cache_file.unlink()
                deleted_count += 1
            except:
                pass
        
        # 清空索引
        self.index = {}
        self._save_index()
        
        # 重置統計
        self.stats = {
            "hits": 0,
            "misses": 0,
            "sets": 0,
            "evictions": 0,
            "errors": 0
        }
        
        print(f"清空了 {deleted_count} 個緩存文件")
        return deleted_count
    
    def get_stats(self) -> Dict[str, Any]:
        """獲取緩存統計信息"""
        total_cached = len(self.index)
        
        # 計算緩存大小
        total_size = 0
        for cache_info in self.index.values():
            total_size += cache_info.get("size", 0)
        
        # 計算命中率
        total_access = self.stats["hits"] + self.stats["misses"]
        hit_rate = (self.stats["hits"] / total_access * 100) if total_access > 0 else 0
        
        return {
            "total_cached": total_cached,
            "total_size_bytes": total_size,
            "total_size_mb": total_size / (1024 * 1024),
            "hits": self.stats["hits"],
            "misses": self.stats["misses"],
            "sets": self.stats["sets"],
            "evictions": self.stats["evictions"],
            "errors": self.stats["errors"],
            "hit_rate_percent": round(hit_rate, 2),
            "cache_dir": str(self.cache_dir)
        }
    
    def list_cached_projects(self) -> List[Dict[str, Any]]:
        """列出所有緩存的項目"""
        projects = {}
        
        for cache_key, cache_info in self.index.items():
            project_path = cache_info.get("project_path")
            if project_path not in projects:
                projects[project_path] = {
                    "path": project_path,
                    "cache_types": [],
                    "total_size": 0,
                    "last_accessed": 0
                }
            
            projects[project_path]["cache_types"].append(cache_info.get("cache_type"))
            projects[project_path]["total_size"] += cache_info.get("size", 0)
            
            last_accessed = cache_info.get("last_accessed", 0)
            if last_accessed > projects[project_path]["last_accessed"]:
                projects[project_path]["last_accessed"] = last_accessed
        
        # 轉換為列表並排序
        project_list = list(projects.values())
        project_list.sort(key=lambda x: x["last_accessed"], reverse=True)
        
        # 格式化時間
        for project in project_list:
            if project["last_accessed"] > 0:
                dt = datetime.fromtimestamp(project["last_accessed"])
                project["last_accessed_str"] = dt.strftime("%Y-%m-%d %H:%M:%S")
            else:
                project["last_accessed_str"] = "從未訪問"
            
            project["total_size_mb"] = project["total_size"] / (1024 * 1024)
        
        return project_list


class CachedRAGAnalyzer:
    """帶緩存的RAG分析器"""
    
    def __init__(self, project_path: str, cache_manager: CacheManager = None):
        self.project_path = project_path
        
        if cache_manager is None:
            cache_manager = CacheManager()
        self.cache_manager = cache_manager
        
        # 導入原始分析器
        from rag_analyzer import ProjectAnalyzer
        self.analyzer = ProjectAnalyzer(project_path)
    
    def generate_analysis_report(self, use_cache: bool = True) -> Dict[str, Any]:
        """生成分析報告（帶緩存）"""
        # 嘗試從緩存獲取
        if use_cache:
            cached_data = self.cache_manager.get(self.project_path, "analysis")
            if cached_data is not None:
                print("✅ 從緩存加載分析報告")
                return cached_data
        
        # 執行實際分析
        print("🔍 執行RAG分析...")
        report = self.analyzer.generate_analysis_report()
        
        # 保存到緩存
        if use_cache:
            self.cache_manager.set(self.project_path, "analysis", report)
            print("💾 分析報告已緩存")
        
        return report
    
    def save_report(self, report: Dict[str, Any], output_path: str = None) -> str:
        """保存報告（同時更新緩存）"""
        # 保存到文件
        result_path = self.analyzer.save_report(report, output_path)
        
        # 更新緩存
        self.cache_manager.set(self.project_path, "analysis", report)
        
        return result_path


def main():
    """測試緩存管理器"""
    import sys
    
    if len(sys.argv) < 2:
        print("用法: python cache_manager.py <項目路徑>")
        print("示例: python cache_manager.py /path/to/your/project")
        sys.exit(1)
    
    project_path = sys.argv[1]
    
    if not os.path.exists(project_path):
        print(f"錯誤: 項目路徑不存在: {project_path}")
        sys.exit(1)
    
    print("🧪 測試緩存管理器")
    print("=" * 50)
    
    # 創建緩存管理器
    cache_manager = CacheManager()
    
    # 測試緩存統計
    stats = cache_manager.get_stats()
    print(f"緩存目錄: {stats['cache_dir']}")
    print(f"緩存項目數: {stats['total_cached']}")
    print(f"緩存大小: {stats['total_size_mb']:.2f} MB")
    print(f"命中率: {stats['hit_rate_percent']}%")
    
    print("\n🔍 測試帶緩存的RAG分析器")
    print("-" * 30)
    
    # 第一次運行（應該未命中緩存）
    print("第一次運行（應該未命中緩存）:")
    cached_analyzer = CachedRAGAnalyzer(project_path, cache_manager)
    report1 = cached_analyzer.generate_analysis_report()
    print(f"分析完成，分數: {report1.get('overall_assessment', {}).get('overall_score', 0):.1f}/100")
    
    # 第二次運行（應該命中緩存）
    print("\n第二次運行（應該命中緩存）:")
    report2 = cached_analyzer.generate_analysis_report()
    print(f"從緩存加載，分數: {report2.get('overall_assessment', {}).get('overall_score', 0):.1f}/100")
    
    # 顯示緩存統計
    print("\n📊 最終緩存統計:")
    final_stats = cache_manager.get_stats()
    print(f"命中次數: {final_stats['hits']}")
    print(f"未命中次數: {final_stats['misses']}")
    print(f"設置次數: {final_stats['sets']}")
    print(f"最終命中率: {final_stats['hit_rate_percent']}%")
    
    # 列出緩存的項目
    print("\n📁 緩存的項目:")
    projects = cache_manager.list_cached_projects()
    for i, project in enumerate(projects[:3], 1):
        print(f"{i}. {project['path']}")
        print(f"   類型: {', '.join(project['cache_types'])}")
        print(f"   大小: {project['total_size_mb']:.2f} MB")
        print(f"   最後訪問: {project['last_accessed_str']}")
    
    print("\n✅ 緩存測試完成！")


if __name__ == "__main__":
    main()