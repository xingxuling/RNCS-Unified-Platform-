import subprocess
import sys
import os
from pathlib import Path

APP_NAME = "AutoRAG"
ENTRY_FILE = "main_enhanced.py"

def run(cmd):
    print(">>", cmd)
    subprocess.check_call(cmd, shell=True)

def main():
    root = Path(__file__).parent.resolve()

    # 1. 检查入口
    entry = root / ENTRY_FILE
    if not entry.exists():
        print(f"[ERROR] 找不到入口文件: {ENTRY_FILE}")
        sys.exit(1)

    # 2. 安装 PyInstaller
    run(f"{sys.executable} -m pip install --upgrade pyinstaller")

    # 3. 清理旧构建 (跨平台)
    import shutil
    for d in ["build", "dist"]:
        dir_path = root / d
        if dir_path.exists():
            try:
                shutil.rmtree(dir_path)
                print(f"已清理目录: {d}")
            except Exception as e:
                print(f"清理目录 {d} 失败: {e}")

    # 4. 打包 exe
    run(
        f'pyinstaller "{ENTRY_FILE}" '
        f'--onefile --windowed '
        f'--name {APP_NAME}'
    )

    exe = root / "dist" / f"{APP_NAME}.exe"
    if not exe.exists():
        print("[ERROR] exe 生成失败")
        sys.exit(1)

    print("[OK] EXE 已生成:", exe)

if __name__ == "__main__":
    main()