import os
import winreg
from pathlib import Path
import pythoncom
from win32com.client import Dispatch

APP_NAME = "AutoRAG"

def create_desktop_shortcut(exe_path):
    desktop = Path(os.path.join(os.environ["USERPROFILE"], "Desktop"))
    shortcut_path = desktop / f"{APP_NAME}.lnk"

    shell = Dispatch("WScript.Shell")
    shortcut = shell.CreateShortcut(str(shortcut_path))
    shortcut.TargetPath = str(exe_path)
    shortcut.WorkingDirectory = str(exe_path.parent)
    shortcut.IconLocation = str(exe_path)
    shortcut.save()

    print("[OK] 桌面快捷方式已创建")

def enable_startup(exe_path):
    key = winreg.OpenKey(
        winreg.HKEY_CURRENT_USER,
        r"Software\Microsoft\Windows\CurrentVersion\Run",
        0,
        winreg.KEY_SET_VALUE
    )
    winreg.SetValueEx(key, APP_NAME, 0, winreg.REG_SZ, str(exe_path))
    winreg.CloseKey(key)
    print("[OK] 已设置开机自启动")

def main():
    exe = Path(__file__).parent / "dist" / f"{APP_NAME}.exe"
    if not exe.exists():
        print("[ERROR] 未找到 exe，请先运行 build_exe.py")
        return

    create_desktop_shortcut(exe)
    enable_startup(exe)

if __name__ == "__main__":
    main()