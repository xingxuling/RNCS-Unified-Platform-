#!/usr/bin/env python3
"""
RAG 系統托盤圖標應用程序
提供後台運行和快速訪問功能
"""

import os
import sys
import threading
import subprocess
import tkinter as tk
from tkinter import messagebox
from pathlib import Path

try:
    import pystray
    from PIL import Image, ImageDraw
    HAS_PYSTRAY = True
except ImportError:
    HAS_PYSTRAY = False
    print("⚠️  pystray 庫未安裝，無法創建系統托盤圖標")
    print("   安裝命令: pip install pystray pillow")

class RAGTrayApp:
    """RAG 系統托盤應用程序"""
    
    def __init__(self):
        self.icon = None
        self.is_monitoring = False
        self.monitor_process = None
        
    def create_icon_image(self):
        """創建圖標圖像"""
        # 創建簡單的圖標
        image = Image.new('RGB', (64, 64), color='#2c3e50')
        draw = ImageDraw.Draw(image)
        
        # 繪製 RAG 文字
        try:
            from PIL import ImageFont
            font = ImageFont.truetype("arial.ttf", 24)
        except:
            font = None
            
        draw.text((32, 32), "R", fill='#3498db', font=font, anchor="mm")
        
        return image
        
    def setup_menu(self):
        """設置托盤菜單"""
        menu_items = [
            pystray.MenuItem("打開主界面", self.open_main_app),
            pystray.MenuItem("快速分析", self.quick_analysis),
            pystray.MenuItem("監測控制", self.monitor_control),
            pystray.MenuItem("查看報告", self.open_reports),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("設置", self.open_settings),
            pystray.MenuItem("幫助", self.open_help),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("退出", self.quit_app)
        ]
        
        return pystray.Menu(*menu_items)
        
    def open_main_app(self, icon, item):
        """打開主應用程序"""
        try:
            subprocess.Popen([sys.executable, "rag_app.py"])
        except Exception as e:
            self.show_notification("錯誤", f"無法打開主程序: {e}")
            
    def quick_analysis(self, icon, item):
        """快速分析"""
        # 這裡可以實現快速分析功能
        # 暫時使用簡單的實現
        self.show_notification("快速分析", "快速分析功能正在開發中")
        
    def monitor_control(self, icon, item):
        """監測控制"""
        if self.is_monitoring:
            self.stop_monitoring()
        else:
            self.start_monitoring()
            
    def start_monitoring(self):
        """啟動監測"""
        if self.is_monitoring:
            return
            
        try:
            self.monitor_process = subprocess.Popen(
                [sys.executable, "run_monitoring_system.py"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            self.is_monitoring = True
            self.show_notification("監測系統", "監測系統已啟動")
        except Exception as e:
            self.show_notification("錯誤", f"無法啟動監測: {e}")
            
    def stop_monitoring(self):
        """停止監測"""
        if not self.is_monitoring:
            return
            
        try:
            if self.monitor_process:
                self.monitor_process.terminate()
                self.monitor_process = None
                
            self.is_monitoring = False
            self.show_notification("監測系統", "監測系統已停止")
        except Exception as e:
            self.show_notification("錯誤", f"無法停止監測: {e}")
            
    def open_reports(self, icon, item):
        """打開報告"""
        reports_dir = Path.home() / "Desktop"
        
        # 查找最新的報告文件
        report_files = list(reports_dir.glob("RAG_系統結果_*.txt"))
        report_files.extend(list(reports_dir.glob("auto_packaging_report.json")))
        
        if report_files:
            # 打開最新的報告
            latest = max(report_files, key=lambda p: p.stat().st_mtime)
            try:
                if sys.platform == "win32":
                    os.startfile(latest)
                elif sys.platform == "darwin":
                    subprocess.Popen(["open", latest])
                else:
                    subprocess.Popen(["xdg-open", latest])
            except:
                self.show_notification("報告", f"最新報告: {latest.name}")
        else:
            self.show_notification("報告", "沒有找到報告文件")
            
    def open_settings(self, icon, item):
        """打開設置"""
        try:
            subprocess.Popen([sys.executable, "config_manager.py"])
        except Exception as e:
            self.show_notification("錯誤", f"無法打開設置: {e}")
            
    def open_help(self, icon, item):
        """打開幫助"""
        help_text = """
        RAG 系統托盤應用
        
        功能:
        1. 打開主界面 - 啟動完整 GUI 應用
        2. 快速分析 - 快速分析最近項目
        3. 監測控制 - 啟動/停止監測系統
        4. 查看報告 - 打開最新的分析報告
        5. 設置 - 修改系統配置
        6. 幫助 - 查看幫助信息
        
        狀態:
        - 監測系統: {}
        """.format("運行中" if self.is_monitoring else "已停止")
        
        # 顯示幫助對話框
        root = tk.Tk()
        root.withdraw()  # 隱藏主窗口
        
        messagebox.showinfo("幫助", help_text)
        root.destroy()
        
    def show_notification(self, title, message):
        """顯示通知"""
        if self.icon:
            self.icon.notify(message, title)
            
    def quit_app(self, icon, item):
        """退出應用程序"""
        self.stop_monitoring()
        icon.stop()
        
    def run(self):
        """運行托盤應用程序"""
        if not HAS_PYSTRAY:
            print("❌ 缺少必要庫，無法運行托盤應用")
            print("請安裝: pip install pystray pillow")
            return
            
        # 創建圖標
        image = self.create_icon_image()
        menu = self.setup_menu()
        
        # 創建並運行圖標
        self.icon = pystray.Icon("rag_system", image, "RAG 自動化系統", menu)
        self.icon.run()

def main():
    """主函數"""
    app = RAGTrayApp()
    app.run()

if __name__ == "__main__":
    main()