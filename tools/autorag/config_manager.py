#!/usr/bin/env python3
"""
RAG 系統配置管理器
"""

import os
import json
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from pathlib import Path

class ConfigManager:
    """配置管理器"""
    
    def __init__(self, config_file="config/app_config.json"):
        self.config_file = config_file
        self.config = self.load_config()
        
    def load_config(self):
        """加載配置"""
        default_config = {
            "system": {
                "name": "RAG 自動化系統",
                "version": "1.0.0",
                "auto_update": True,
                "notifications": True
            },
            "paths": {
                "default_project_dir": str(Path.home() / "projects"),
                "output_dir": "output",
                "log_dir": "logs",
                "cache_dir": "cache"
            },
            "analysis": {
                "enable_code_quality": True,
                "enable_structure_analysis": True,
                "max_file_size_mb": 10,
                "analysis_depth": "standard"
            },
            "monitoring": {
                "enabled": False,
                "interval_seconds": 5,
                "watch_directories": [str(Path.home() / "projects")],
                "exclude_patterns": ["node_modules", ".git", "__pycache__"]
            },
            "packaging": {
                "create_zip": True,
                "create_tar": False,
                "output_location": "desktop",
                "include_documentation": True
            }
        }
        
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    loaded = json.load(f)
                    # 合併配置
                    self.merge_config(default_config, loaded)
                    return default_config
            except:
                print(f"無法讀取配置文件 {self.config_file}，使用默認配置")
                return default_config
        else:
            # 創建配置目錄
            os.makedirs(os.path.dirname(self.config_file), exist_ok=True)
            return default_config
            
    def merge_config(self, default, loaded):
        """合併配置"""
        for key in loaded:
            if key in default:
                if isinstance(default[key], dict) and isinstance(loaded[key], dict):
                    self.merge_config(default[key], loaded[key])
                else:
                    default[key] = loaded[key]
                    
    def save_config(self):
        """保存配置"""
        try:
            os.makedirs(os.path.dirname(self.config_file), exist_ok=True)
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"保存配置失敗: {e}")
            return False
            
    def get(self, key, default=None):
        """獲取配置值"""
        keys = key.split('.')
        value = self.config
        
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
                
        return value
        
    def set(self, key, value):
        """設置配置值"""
        keys = key.split('.')
        config = self.config
        
        for i, k in enumerate(keys[:-1]):
            if k not in config:
                config[k] = {}
            config = config[k]
            
        config[keys[-1]] = value
        return self.save_config()

class ConfigGUI:
    """配置圖形界面"""
    
    def __init__(self, parent=None):
        self.manager = ConfigManager()
        
        if parent:
            self.window = tk.Toplevel(parent)
        else:
            self.window = tk.Tk()
            
        self.window.title("RAG 系統配置")
        self.window.geometry("600x500")
        
        self.create_widgets()
        
    def create_widgets(self):
        """創建界面組件"""
        # 創建筆記本控件
        notebook = ttk.Notebook(self.window)
        notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # 系統設置頁面
        system_frame = ttk.Frame(notebook)
        notebook.add(system_frame, text="系統")
        self.create_system_tab(system_frame)
        
        # 路徑設置頁面
        paths_frame = ttk.Frame(notebook)
        notebook.add(paths_frame, text="路徑")
        self.create_paths_tab(paths_frame)
        
        # 分析設置頁面
        analysis_frame = ttk.Frame(notebook)
        notebook.add(analysis_frame, text="分析")
        self.create_analysis_tab(analysis_frame)
        
        # 監測設置頁面
        monitor_frame = ttk.Frame(notebook)
        notebook.add(monitor_frame, text="監測")
        self.create_monitor_tab(monitor_frame)
        
        # 按鈕區域
        button_frame = ttk.Frame(self.window)
        button_frame.pack(fill=tk.X, padx=10, pady=(0, 10))
        
        ttk.Button(button_frame, text="保存", command=self.save_config).pack(side=tk.RIGHT, padx=5)
        ttk.Button(button_frame, text="取消", command=self.window.destroy).pack(side=tk.RIGHT, padx=5)
        ttk.Button(button_frame, text="恢復默認", command=self.reset_default).pack(side=tk.LEFT, padx=5)
        
    def create_system_tab(self, parent):
        """創建系統設置頁面"""
        frame = ttk.Frame(parent, padding="10")
        frame.pack(fill=tk.BOTH, expand=True)
        
        # 系統名稱
        ttk.Label(frame, text="系統名稱:").grid(row=0, column=0, sticky=tk.W, pady=5)
        self.system_name = tk.StringVar(value=self.manager.get("system.name", ""))
        ttk.Entry(frame, textvariable=self.system_name, width=30).grid(row=0, column=1, sticky=tk.W, pady=5)
        
        # 自動更新
        self.auto_update = tk.BooleanVar(value=self.manager.get("system.auto_update", True))
        ttk.Checkbutton(frame, text="啟用自動更新", variable=self.auto_update).grid(row=1, column=0, columnspan=2, sticky=tk.W, pady=5)
        
        # 通知
        self.notifications = tk.BooleanVar(value=self.manager.get("system.notifications", True))
        ttk.Checkbutton(frame, text="啟用通知", variable=self.notifications).grid(row=2, column=0, columnspan=2, sticky=tk.W, pady=5)
        
    def create_paths_tab(self, parent):
        """創建路徑設置頁面"""
        frame = ttk.Frame(parent, padding="10")
        frame.pack(fill=tk.BOTH, expand=True)
        
        # 默認項目目錄
        ttk.Label(frame, text="默認項目目錄:").grid(row=0, column=0, sticky=tk.W, pady=5)
        self.project_dir = tk.StringVar(value=self.manager.get("paths.default_project_dir", ""))
        
        entry_frame = ttk.Frame(frame)
        entry_frame.grid(row=0, column=1, sticky=tk.W+tk.E, pady=5)
        
        ttk.Entry(entry_frame, textvariable=self.project_dir, width=30).pack(side=tk.LEFT, fill=tk.X, expand=True)
        ttk.Button(entry_frame, text="瀏覽", command=lambda: self.browse_directory(self.project_dir)).pack(side=tk.LEFT, padx=5)
        
        # 輸出目錄
        ttk.Label(frame, text="輸出目錄:").grid(row=1, column=0, sticky=tk.W, pady=5)
        self.output_dir = tk.StringVar(value=self.manager.get("paths.output_dir", ""))
        ttk.Entry(frame, textvariable=self.output_dir, width=30).grid(row=1, column=1, sticky=tk.W, pady=5)
        
        # 日誌目錄
        ttk.Label(frame, text="日誌目錄:").grid(row=2, column=0, sticky=tk.W, pady=5)
        self.log_dir = tk.StringVar(value=self.manager.get("paths.log_dir", ""))
        ttk.Entry(frame, textvariable=self.log_dir, width=30).grid(row=2, column=1, sticky=tk.W, pady=5)
        
    def create_analysis_tab(self, parent):
        """創建分析設置頁面"""
        frame = ttk.Frame(parent, padding="10")
        frame.pack(fill=tk.BOTH, expand=True)
        
        # 代碼質量分析
        self.enable_code_quality = tk.BooleanVar(value=self.manager.get("analysis.enable_code_quality", True))
        ttk.Checkbutton(frame, text="啟用代碼質量分析", variable=self.enable_code_quality).grid(row=0, column=0, sticky=tk.W, pady=5)
        
        # 結構分析
        self.enable_structure = tk.BooleanVar(value=self.manager.get("analysis.enable_structure_analysis", True))
        ttk.Checkbutton(frame, text="啟用結構分析", variable=self.enable_structure).grid(row=1, column=0, sticky=tk.W, pady=5)
        
        # 最大文件大小
        ttk.Label(frame, text="最大文件大小 (MB):").grid(row=2, column=0, sticky=tk.W, pady=5)
        self.max_file_size = tk.IntVar(value=self.manager.get("analysis.max_file_size_mb", 10))
        ttk.Spinbox(frame, from_=1, to=100, textvariable=self.max_file_size, width=10).grid(row=2, column=1, sticky=tk.W, pady=5)
        
        # 分析深度
        ttk.Label(frame, text="分析深度:").grid(row=3, column=0, sticky=tk.W, pady=5)
        self.analysis_depth = tk.StringVar(value=self.manager.get("analysis.analysis_depth", "standard"))
        
        depth_frame = ttk.Frame(frame)
        depth_frame.grid(row=3, column=1, sticky=tk.W, pady=5)
        
        ttk.Radiobutton(depth_frame, text="快速", variable=self.analysis_depth, value="quick").pack(side=tk.LEFT, padx=5)
        ttk.Radiobutton(depth_frame, text="標準", variable=self.analysis_depth, value="standard").pack(side=tk.LEFT, padx=5)
        ttk.Radiobutton(depth_frame, text="詳細", variable=self.analysis_depth, value="detailed").pack(side=tk.LEFT, padx=5)
        
    def create_monitor_tab(self, parent):
        """創建監測設置頁面"""
        frame = ttk.Frame(parent, padding="10")
        frame.pack(fill=tk.BOTH, expand=True)
        
        # 啟用監測
        self.monitor_enabled = tk.BooleanVar(value=self.manager.get("monitoring.enabled", False))
        ttk.Checkbutton(frame, text="啟用監測系統", variable=self.monitor_enabled).grid(row=0, column=0, columnspan=2, sticky=tk.W, pady=5)
        
        # 監測間隔
        ttk.Label(frame, text="監測間隔 (秒):").grid(row=1, column=0, sticky=tk.W, pady=5)
        self.monitor_interval = tk.IntVar(value=self.manager.get("monitoring.interval_seconds", 5))
        ttk.Spinbox(frame, from_=1, to=60, textvariable=self.monitor_interval, width=10).grid(row=1, column=1, sticky=tk.W, pady=5)
        
    def browse_directory(self, var):
        """瀏覽目錄"""
        path = filedialog.askdirectory()
        if path:
            var.set(path)
            
    def save_config(self):
        """保存配置"""
        try:
            # 保存系統設置
            self.manager.set("system.name", self.system_name.get())
            self.manager.set("system.auto_update", self.auto_update.get())
            self.manager.set("system.notifications", self.notifications.get())
            
            # 保存路徑設置
            self.manager.set("paths.default_project_dir", self.project_dir.get())
            self.manager.set("paths.output_dir", self.output_dir.get())
            self.manager.set("paths.log_dir", self.log_dir.get())
            
            # 保存分析設置
            self.manager.set("analysis.enable_code_quality", self.enable_code_quality.get())
            self.manager.set("analysis.enable_structure_analysis", self.enable_structure.get())
            self.manager.set("analysis.max_file_size_mb", self.max_file_size.get())
            self.manager.set("analysis.analysis_depth", self.analysis_depth.get())
            
            # 保存監測設置
            self.manager.set("monitoring.enabled", self.monitor_enabled.get())
            self.manager.set("monitoring.interval_seconds", self.monitor_interval.get())
            
            messagebox.showinfo("成功", "配置已保存")
            self.window.destroy()
            
        except Exception as e:
            messagebox.showerror("錯誤", f"保存配置失敗: {e}")
            
    def reset_default(self):
        """恢復默認設置"""
        if messagebox.askyesno("確認", "確定要恢復默認設置嗎？"):
            self.manager = ConfigManager()
            self.window.destroy()
            ConfigGUI(self.window if hasattr(self, 'window') else None)

def main():
    """主函數"""
    app = ConfigGUI()
    app.window.mainloop()

if __name__ == "__main__":
    main()