#!/usr/bin/env python3
"""
監測系統運行腳本

集成系統監測和RAG分析，實現同步監測電腦內正在完成的功能。
"""

import os
import sys
import time
import json
import threading
from pathlib import Path

# 添加模塊路徑
sys.path.insert(0, str(Path(__file__).parent / "modules"))

try:
    from system_monitor import SystemMonitor, RAGIntegrationHandler
    print("✅ 成功導入系統監測模塊")
except ImportError as e:
    print(f"❌ 無法導入系統監測模塊: {e}")
    print("正在創建簡化版本...")
    
    # 創建簡化的系統監測類
    import queue
    import signal
    from datetime import datetime
    import subprocess
    
    class SystemMonitor:
        def __init__(self, config=None):
            self.config = config or {}
            self.running = False
            self.event_queue = queue.Queue()
            self.event_handlers = []
            signal.signal(signal.SIGINT, self._signal_handler)
            print("🖥️  簡化版系統監測器初始化完成")
        
        def _signal_handler(self, signum, frame):
            print(f"\n🛑 收到信號 {signum}，正在停止監測...")
            self.stop()
            sys.exit(0)
        
        def add_event_handler(self, handler):
            self.event_handlers.append(handler)
        
        def start(self):
            self.running = True
            print("✅ 系統監測已啟動")
            print("按 Ctrl+C 停止監測")
        
        def stop(self):
            self.running = False
            print("🛑 系統監測已停止")
    
    class RAGIntegrationHandler:
        def __init__(self, rag_system_path="."):
            self.rag_system_path = rag_system_path
            print(f"🔗 RAG集成處理器初始化完成 (路徑: {rag_system_path})")
        
        def handle_event(self, event):
            print(f"📨 收到事件: {event.get('event_type', 'unknown')}")


def create_default_config():
    """創建默認配置"""
    return {
        "monitoring": {
            "interval_seconds": 5,
            "watch_directories": ["~/projects", "~/workspace", "."],
            "exclude_patterns": ["node_modules", ".git", "__pycache__", ".venv", ".idea"],
            "monitor_file_types": [".py", ".js", ".ts", ".java", ".go", ".rs", ".cpp", ".c"],
            "max_file_size_mb": 10
        },
        "rag_integration": {
            "enabled": True,
            "rag_system_path": ".",
            "auto_trigger_threshold": 3,
            "analysis_cooldown_seconds": 60
        },
        "output": {
            "log_file": "monitoring_system.log",
            "enable_console_output": True
        }
    }


def setup_monitoring_directories():
    """設置監測目錄"""
    home_dir = Path.home()
    default_dirs = [
        home_dir / "projects",
        home_dir / "workspace",
        Path.cwd()
    ]
    
    # 確保目錄存在
    for dir_path in default_dirs:
        dir_path.mkdir(parents=True, exist_ok=True)
    
    return [str(d) for d in default_dirs]


def monitor_file_changes(monitor, config):
    """監測文件變化（簡化版本）"""
    import os
    import time
    
    watch_dirs = config["monitoring"]["watch_directories"]
    interval = config["monitoring"]["interval_seconds"]
    
    # 擴展家目錄路徑
    expanded_dirs = []
    for dir_path in watch_dirs:
        if dir_path.startswith("~"):
            dir_path = os.path.expanduser(dir_path)
        if os.path.exists(dir_path):
            expanded_dirs.append(os.path.abspath(dir_path))
    
    if not expanded_dirs:
        print("⚠️  沒有有效的監測目錄")
        return
    
    print(f"📁 監測目錄: {', '.join(expanded_dirs)}")
    
    # 文件狀態緩存
    file_cache = {}
    
    while monitor.running:
        try:
            file_changes = []
            
            for watch_dir in expanded_dirs:
                for root, dirs, files in os.walk(watch_dir):
                    for file in files:
                        file_path = os.path.join(root, file)
                        
                        # 檢查文件類型
                        file_ext = os.path.splitext(file)[1].lower()
                        monitor_types = config["monitoring"]["monitor_file_types"]
                        if monitor_types and file_ext not in monitor_types:
                            continue
                        
                        try:
                            stat = os.stat(file_path)
                            current_mtime = stat.st_mtime
                            current_size = stat.st_size
                            
                            cache_key = file_path
                            
                            if cache_key in file_cache:
                                last_mtime, last_size = file_cache[cache_key]
                                
                                if current_mtime != last_mtime:
                                    # 文件被修改
                                    change_type = "modified"
                                    if current_size != last_size:
                                        change_type = "changed"
                                    
                                    file_changes.append({
                                        "path": file_path,
                                        "type": change_type,
                                        "file_type": file_ext,
                                        "relative_path": os.path.relpath(file_path, watch_dir)
                                    })
                            
                            # 更新緩存
                            file_cache[cache_key] = (current_mtime, current_size)
                            
                        except (OSError, PermissionError):
                            continue
            
            # 清理不存在的文件緩存
            file_cache = {k: v for k, v in file_cache.items() if os.path.exists(k)}
            
            # 發送事件
            if file_changes:
                event = {
                    "event_id": f"file_changes_{int(time.time() * 1000)}",
                    "event_type": "file_changes",
                    "timestamp": time.time(),
                    "timestamp_iso": datetime.now().isoformat(),
                    "data": {
                        "changes": file_changes,
                        "total_changes": len(file_changes),
                        "directories": expanded_dirs
                    },
                    "message": f"檢測到 {len(file_changes)} 個文件變化"
                }
                
                # 調用事件處理器
                for handler in monitor.event_handlers:
                    try:
                        handler(event)
                    except Exception as e:
                        print(f"⚠️  事件處理器錯誤: {e}")
                
                if len(file_changes) > 0:
                    print(f"📊 文件變化: {len(file_changes)} 個文件")
            
        except Exception as e:
            print(f"⚠️  文件監測錯誤: {e}")
        
        time.sleep(interval)


def run_rag_analysis(target_dir, rag_system_path="."):
    """運行RAG分析"""
    try:
        # 檢查RAG系統
        rag_main = os.path.join(rag_system_path, "main.py")
        if not os.path.exists(rag_main):
            print("⚠️  RAG系統未找到")
            return False
        
        print(f"🧠 執行RAG分析: {target_dir}")
        
        # 運行分析
        import subprocess
        result = subprocess.run(
            ["python", rag_main, target_dir],
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if result.returncode == 0:
            print("✅ RAG分析完成")
            
            # 提取分數
            import re
            output = result.stdout
            score_match = re.search(r"總體分數:\s*([\d.]+)/100", output)
            if score_match:
                score = float(score_match.group(1))
                print(f"📊 分析分數: {score}/100")
            return True
        else:
            print(f"❌ RAG分析失敗: {result.stderr[:200]}")
            return False
            
    except subprocess.TimeoutExpired:
        print("⏰ RAG分析超時")
        return False
    except Exception as e:
        print(f"⚠️  RAG分析錯誤: {e}")
        return False


class SimpleRAGHandler:
    """簡化的RAG處理器"""
    
    def __init__(self, rag_system_path="."):
        self.rag_system_path = rag_system_path
        self.last_analysis_time = 0
        self.change_counter = 0
        self.analysis_threshold = 3
        self.analysis_cooldown = 60
        
        print(f"🔗 RAG處理器初始化完成")
    
    def handle_event(self, event):
        event_type = event.get("event_type")
        
        if event_type == "file_changes":
            changes = event.get("data", {}).get("changes", [])
            self.change_counter += len(changes)
            
            print(f"📊 文件變化計數: {self.change_counter}/{self.analysis_threshold}")
            
            # 檢查是否觸發分析
            current_time = time.time()
            if (self.change_counter >= self.analysis_threshold and 
                current_time - self.last_analysis_time > self.analysis_cooldown):
                
                print("🚀 達到分析閾值，觸發RAG分析...")
                
                # 獲取目標目錄
                directories = event.get("data", {}).get("directories", ["."])
                target_dir = directories[0] if directories else "."
                
                # 運行分析
                success = run_rag_analysis(target_dir, self.rag_system_path)
                
                if success:
                    self.change_counter = 0
                    self.last_analysis_time = current_time


def main():
    """主函數"""
    print("=" * 60)
    print("🚀 啟動同步監測與RAG人工智能系統")
    print("=" * 60)
    
    # 創建配置
    config = create_default_config()
    
    # 設置監測目錄
    monitor_dirs = setup_monitoring_directories()
    config["monitoring"]["watch_directories"] = monitor_dirs
    
    print(f"\n📁 監測目錄設置:")
    for i, dir_path in enumerate(monitor_dirs, 1):
        print(f"  {i}. {dir_path}")
    
    # 創建監測器
    monitor = SystemMonitor(config)
    
    # 添加RAG處理器
    rag_handler = SimpleRAGHandler(
        rag_system_path=config["rag_integration"]["rag_system_path"]
    )
    monitor.add_event_handler(rag_handler.handle_event)
    
    # 啟動監測
    monitor.start()
    
    # 啟動文件監測線程
    monitor_thread = threading.Thread(
        target=monitor_file_changes,
        args=(monitor, config),
        daemon=True
    )
    monitor_thread.start()
    
    print("\n📡 系統正在監測中...")
    print("   - 監測文件變化")
    print("   - 自動觸發RAG分析")
    print("   - 按 Ctrl+C 停止")
    
    try:
        # 主循環
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n\n🛑 用戶中斷，正在停止...")
    
    finally:
        # 停止監測
        monitor.stop()
        
        print("\n" + "=" * 60)
        print("✅ 系統監測已停止")
        print("=" * 60)


if __name__ == "__main__":
    main()