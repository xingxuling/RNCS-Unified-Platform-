#!/usr/bin/env python3
"""
RAG 系統應用程序 - 簡化版本
提供基本的圖形界面來使用 RAG 系統
"""

import os
import sys
import subprocess
import threading
import tkinter as tk
from tkinter import ttk, messagebox, filedialog, scrolledtext
from pathlib import Path

class RAGApp:
    """RAG 應用程序"""
    
    def __init__(self, root):
        self.root = root
        self.root.title("RAG 自動化系統")
        self.root.geometry("800x600")
        
        # 設置窗口居中
        self.center_window()
        
        # 創建界面
        self.create_ui()
        
        # 狀態變量
        self.current_process = None
        self.is_running = False
        
    def center_window(self):
        """窗口居中"""
        self.root.update_idletasks()
        width = self.root.winfo_width()
        height = self.root.winfo_height()
        x = (self.root.winfo_screenwidth() // 2) - (width // 2)
        y = (self.root.winfo_screenheight() // 2) - (height // 2)
        self.root.geometry(f'{width}x{height}+{x}+{y}')
        
    def create_ui(self):
        """創建用戶界面"""
        # 創建主框架
        main_frame = ttk.Frame(self.root, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # 標題
        title_label = ttk.Label(main_frame, 
                               text="RAG 自動化系統",
                               font=("Arial", 18, "bold"),
                               foreground="#2c3e50")
        title_label.pack(pady=(0, 20))
        
        # 項目選擇
        project_frame = ttk.LabelFrame(main_frame, text="項目選擇", padding="10")
        project_frame.pack(fill=tk.X, pady=(0, 20))
        
        project_inner = ttk.Frame(project_frame)
        project_inner.pack(fill=tk.X)
        
        ttk.Label(project_inner, text="項目路徑:").pack(side=tk.LEFT, padx=(0, 10))
        
        self.project_path = tk.StringVar()
        self.project_entry = ttk.Entry(project_inner, textvariable=self.project_path, width=50)
        self.project_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10))
        
        browse_btn = ttk.Button(project_inner, text="瀏覽...", command=self.browse_project)
        browse_btn.pack(side=tk.LEFT)
        
        # 功能按鈕
        buttons_frame = ttk.LabelFrame(main_frame, text="功能", padding="10")
        buttons_frame.pack(fill=tk.X, pady=(0, 20))
        
        # 創建按鈕
        buttons = [
            ("🚀 基礎分析", self.run_basic),
            ("🌟 增強分析", self.run_enhanced),
            ("📊 監測系統", self.run_monitor),
            ("📦 項目打包", self.run_package),
            ("❓ 幫助", self.show_help)
        ]
        
        for text, command in buttons:
            btn = ttk.Button(buttons_frame, text=text, command=command, width=15)
            btn.pack(side=tk.LEFT, padx=5, pady=5)
        
        # 輸出日誌
        log_frame = ttk.LabelFrame(main_frame, text="輸出", padding="10")
        log_frame.pack(fill=tk.BOTH, expand=True)
        
        self.log_text = scrolledtext.ScrolledText(log_frame, 
                                                 height=15,
                                                 wrap=tk.WORD,
                                                 font=("Consolas", 9))
        self.log_text.pack(fill=tk.BOTH, expand=True)
        
        # 狀態欄
        status_frame = ttk.Frame(main_frame)
        status_frame.pack(fill=tk.X, pady=(10, 0))
        
        self.status = tk.StringVar(value="就緒")
        status_label = ttk.Label(status_frame, textvariable=self.status)
        status_label.pack(side=tk.LEFT)
        
        self.progress = ttk.Progressbar(status_frame, maximum=100)
        self.progress.pack(side=tk.RIGHT, fill=tk.X, expand=True, padx=(10, 0))
        
    def browse_project(self):
        """瀏覽項目"""
        path = filedialog.askdirectory(title="選擇項目目錄")
        if path:
            self.project_path.set(path)
            self.log(f"已選擇項目: {path}")
            
    def log(self, message):
        """記錄日誌"""
        self.log_text.insert(tk.END, f"{message}\n")
        self.log_text.see(tk.END)
        self.root.update_idletasks()
        
    def run_basic(self):
        """運行基礎分析"""
        self.run_analysis("basic", "main.py")
        
    def run_enhanced(self):
        """運行增強分析"""
        self.run_analysis("enhanced", "main_enhanced.py")
        
    def run_analysis(self, name, script):
        """運行分析"""
        project = self.project_path.get()
        
        if not project or not os.path.exists(project):
            messagebox.showerror("錯誤", "請選擇有效的項目路徑")
            return
            
        if self.is_running:
            messagebox.showwarning("警告", "已有任務正在運行")
            return
            
        if not messagebox.askyesno("確認", f"確定要執行{name}分析嗎？"):
            return
            
        self.is_running = True
        self.status.set(f"正在執行 {name} 分析...")
        self.progress["value"] = 10
        
        # 在後台運行
        thread = threading.Thread(
            target=self.do_analysis,
            args=(script, project, name),
            daemon=True
        )
        thread.start()
        
    def do_analysis(self, script, project, name):
        """執行分析"""
        try:
            self.log(f"開始 {name} 分析...")
            self.log(f"項目: {project}")
            self.log("-" * 40)
            
            if not os.path.exists(script):
                self.root.after(0, self.log, f"錯誤: 找不到腳本 {script}")
                self.root.after(0, self.analysis_done, name, False)
                return
                
            cmd = [sys.executable, script, project]
            
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                encoding='utf-8'
            )
            
            self.current_process = process
            
            for line in iter(process.stdout.readline, ''):
                if line.strip():
                    self.root.after(0, self.log, line.rstrip())
                    
            process.wait()
            
            self.root.after(0, self.analysis_done, name, process.returncode == 0)
            
        except Exception as e:
            self.root.after(0, self.log, f"錯誤: {str(e)}")
            self.root.after(0, self.analysis_done, name, False)
            
    def analysis_done(self, name, success):
        """分析完成"""
        self.current_process = None
        self.is_running = False
        
        if success:
            self.status.set(f"{name} 分析完成")
            self.progress["value"] = 100
            self.log(f"✅ {name} 分析成功")
            messagebox.showinfo("完成", f"{name} 分析已完成！")
        else:
            self.status.set(f"{name} 分析失敗")
            self.progress["value"] = 0
            self.log(f"❌ {name} 分析失敗")
            
    def run_monitor(self):
        """運行監測"""
        if self.is_running:
            messagebox.showwarning("警告", "已有任務正在運行")
            return
            
        self.is_running = True
        self.status.set("正在啟動監測...")
        
        thread = threading.Thread(
            target=self.do_monitor,
            daemon=True
        )
        thread.start()
        
    def do_monitor(self):
        """執行監測"""
        try:
            self.log("啟動監測系統...")
            
            if not os.path.exists("run_monitoring_system.py"):
                self.root.after(0, self.log, "錯誤: 找不到監測腳本")
                self.root.after(0, self.monitor_done, False)
                return
                
            cmd = [sys.executable, "run_monitoring_system.py"]
            
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                encoding='utf-8'
            )
            
            self.current_process = process
            
            for line in iter(process.stdout.readline, ''):
                if line.strip():
                    self.root.after(0, self.log, line.rstrip())
                    
            process.wait()
            
            self.root.after(0, self.monitor_done, process.returncode == 0)
            
        except Exception as e:
            self.root.after(0, self.log, f"錯誤: {str(e)}")
            self.root.after(0, self.monitor_done, False)
            
    def monitor_done(self, success):
        """監測完成"""
        self.current_process = None
        self.is_running = False
        
        if success:
            self.status.set("監測完成")
            self.progress["value"] = 100
            self.log("✅ 監測完成")
        else:
            self.status.set("監測失敗")
            self.progress["value"] = 0
            self.log("❌ 監測失敗")
            
    def run_package(self):
        """運行打包"""
        project = self.project_path.get()
        
        if not project or not os.path.exists(project):
            messagebox.showerror("錯誤", "請選擇有效的項目路徑")
            return
            
        if self.is_running:
            messagebox.showwarning("警告", "已有任務正在運行")
            return
            
        if not messagebox.askyesno("確認", "確定要打包項目嗎？"):
            return
            
        self.is_running = True
        self.status.set("正在打包...")
        self.progress["value"] = 30
        
        thread = threading.Thread(
            target=self.do_package,
            args=(project,),
            daemon=True
        )
        thread.start()
        
    def do_package(self, project):
        """執行打包"""
        try:
            self.log("開始項目打包...")
            
            # 簡單打包實現
            import shutil
            import glob
            
            desktop = Path.home() / "Desktop"
            package_dir = desktop / f"packaged_{Path(project).name}"
            
            if package_dir.exists():
                shutil.rmtree(package_dir)
                
            package_dir.mkdir()
            
            # 複製文件
            for py_file in glob.glob(os.path.join(project, "*.py")):
                if os.path.isfile(py_file):
                    shutil.copy2(py_file, package_dir)
                    
            for readme in glob.glob(os.path.join(project, "README*")):
                if os.path.isfile(readme):
                    shutil.copy2(readme, package_dir)
                    
            # 創建報告
            report = package_dir / "打包報告.txt"
            with open(report, 'w', encoding='utf-8') as f:
                f.write(f"項目打包報告\n")
                f.write(f"原始項目: {project}\n")
                f.write(f"打包目錄: {package_dir}\n")
                f.write(f"打包時間: {Path(__file__).stat().st_ctime}\n")
                
            self.root.after(0, self.package_done, str(package_dir))
            
        except Exception as e:
            self.root.after(0, self.log, f"打包錯誤: {str(e)}")
            self.root.after(0, self.package_done, None)
            
    def package_done(self, output_dir):
        """打包完成"""
        self.is_running = False
        
        if output_dir:
            self.status.set("打包完成")
            self.progress["value"] = 100
            self.log(f"✅ 打包完成: {output_dir}")
            messagebox.showinfo("完成", f"項目打包完成！\n輸出目錄: {output_dir}")
        else:
            self.status.set("打包失敗")
            self.progress["value"] = 0
            self.log("❌ 打包失敗")
            
    def show_help(self):
        """顯示幫助"""
        help_text = """
        RAG 自動化系統使用說明
        
        1. 選擇項目
           - 點擊「瀏覽...」選擇要分析的項目
        
        2. 使用功能
           - 🚀 基礎分析: 基礎項目分析
           - 🌟 增強分析: 完整項目分析
           - 📊 監測系統: 實時監測項目
           - 📦 項目打包: 打包優化項目
        
        3. 查看結果
           - 分析結果顯示在輸出區域
           - 詳細報告保存到桌面
        
        4. 注意事項
           - 確保項目目錄可讀
           - 大型項目需要較長時間
           - 監測系統會持續運行
        """
        
        help_window = tk.Toplevel(self.root)
        help_window.title("幫助")
        help_window.geometry("500x400")
        
        text = scrolledtext.ScrolledText(help_window, wrap=tk.WORD)
        text.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        text.insert(tk.END, help_text)
        text.config(state=tk.DISABLED)
        
        ttk.Button(help_window, text="關閉", command=help_window.destroy).pack(pady=10)

def main():
    """主函數"""
    root = tk.Tk()
    app = RAGApp(root)
    
    def on_closing():
        if app.current_process:
            app.current_process.terminate()
        root.destroy()
        
    root.protocol("WM_DELETE_WINDOW", on_closing)
    root.mainloop()

if __name__ == "__main__":
    main()