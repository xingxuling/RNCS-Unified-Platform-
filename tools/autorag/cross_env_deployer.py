#!/usr/bin/env python3
"""
跨環境部署模塊
自動處理不同環境下的依賴安裝和打包問題
"""

import os
import sys
import subprocess
import platform
import shutil
import json
from pathlib import Path
from datetime import datetime

class CrossEnvDeployer:
    """跨環境部署器"""
    
    def __init__(self):
        self.system = platform.system()
        self.arch = platform.machine()
        self.python_version = platform.python_version()
        self.project_dir = Path(__file__).parent
        self.deploy_log = []
        
    def log(self, message, level="INFO"):
        """記錄日誌"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] [{level}] {message}"
        self.deploy_log.append(log_entry)
        print(log_entry)
        
    def detect_environment(self):
        """檢測環境"""
        self.log(f"檢測系統環境: {self.system} {self.arch}")
        self.log(f"Python版本: {self.python_version}")
        
        # 檢測包管理器
        package_managers = self._detect_package_managers()
        self.log(f"可用的包管理器: {', '.join(package_managers)}")
        
        # 檢測Python工具
        python_tools = self._detect_python_tools()
        self.log(f"可用的Python工具: {', '.join(python_tools)}")
        
        return {
            "system": self.system,
            "arch": self.arch,
            "python_version": self.python_version,
            "package_managers": package_managers,
            "python_tools": python_tools
        }
    
    def _detect_package_managers(self):
        """檢測可用的包管理器"""
        managers = []
        
        # 檢查Linux包管理器
        for cmd in ["apt-get", "apt", "yum", "dnf", "pacman", "zypper"]:
            if shutil.which(cmd):
                managers.append(cmd)
                
        # 檢查其他包管理器
        for cmd in ["brew", "choco", "scoop", "winget"]:
            if shutil.which(cmd):
                managers.append(cmd)
                
        return managers
    
    def _detect_python_tools(self):
        """檢測可用的Python工具"""
        tools = []
        
        # 檢查Python相關工具
        for tool in ["pip", "pip3", "conda", "mamba", "poetry", "uv", "pipx"]:
            if shutil.which(tool):
                tools.append(tool)
                
        # 檢查Python模塊
        try:
            import ensurepip
            tools.append("ensurepip")
        except ImportError:
            pass
            
        return tools
    
    def install_pyinstaller(self):
        """安裝PyInstaller"""
        self.log("開始安裝PyInstaller...")
        
        # 方法1: 使用pip
        if shutil.which("pip") or shutil.which("pip3"):
            pip_cmd = "pip3" if shutil.which("pip3") else "pip"
            return self._run_command([pip_cmd, "install", "pyinstaller"])
        
        # 方法2: 使用系統包管理器
        if self.system == "Linux":
            if "apt" in self._detect_package_managers() or "apt-get" in self._detect_package_managers():
                # 先安裝pip
                self.log("通過apt安裝python3-pip...")
                if self._run_command(["sudo", "apt-get", "update"]):
                    if self._run_command(["sudo", "apt-get", "install", "-y", "python3-pip"]):
                        return self._run_command(["pip3", "install", "pyinstaller"])
        
        # 方法3: 使用ensurepip
        try:
            self.log("嘗試使用ensurepip...")
            subprocess.run([sys.executable, "-m", "ensurepip", "--user"], check=True)
            return self._run_command([sys.executable, "-m", "pip", "install", "--user", "pyinstaller"])
        except:
            pass
            
        # 方法4: 下載並安裝
        self.log("嘗試下載PyInstaller...")
        try:
            import urllib.request
            import tempfile
            
            # 下載get-pip.py
            url = "https://bootstrap.pypa.io/get-pip.py"
            with tempfile.NamedTemporaryFile(suffix=".py", delete=False) as tmp:
                urllib.request.urlretrieve(url, tmp.name)
                # 安裝pip
                subprocess.run([sys.executable, tmp.name, "--user"], check=True)
                # 安裝pyinstaller
                return self._run_command([sys.executable, "-m", "pip", "install", "--user", "pyinstaller"])
        except Exception as e:
            self.log(f"下載安裝失敗: {e}", "ERROR")
            
        return False
    
    def create_virtual_env(self, env_name="venv"):
        """創建虛擬環境"""
        self.log(f"創建虛擬環境: {env_name}")
        
        env_path = self.project_dir / env_name
        
        # 檢查是否已存在
        if env_path.exists():
            self.log(f"虛擬環境已存在: {env_path}")
            return str(env_path)
        
        # 方法1: 使用venv模塊
        try:
            self.log("使用venv模塊創建虛擬環境...")
            subprocess.run([sys.executable, "-m", "venv", env_name], 
                          cwd=self.project_dir, check=True)
            return str(env_path)
        except Exception as e:
            self.log(f"venv創建失敗: {e}", "WARNING")
        
        # 方法2: 使用virtualenv
        if shutil.which("virtualenv"):
            self.log("使用virtualenv創建虛擬環境...")
            subprocess.run(["virtualenv", env_name], 
                          cwd=self.project_dir, check=True)
            return str(env_path)
        
        # 方法3: 使用conda
        if shutil.which("conda"):
            self.log("使用conda創建虛擬環境...")
            subprocess.run(["conda", "create", "-p", str(env_path), "python=3.8", "-y"], 
                          check=True)
            return str(env_path)
        
        self.log("無法創建虛擬環境", "ERROR")
        return None
    
    def build_windows_exe(self, entry_file="main_enhanced.py", app_name="AutoRAG"):
        """構建Windows EXE文件"""
        self.log(f"開始構建Windows EXE: {entry_file} -> {app_name}")
        
        # 檢查入口文件
        entry_path = self.project_dir / entry_file
        if not entry_path.exists():
            self.log(f"入口文件不存在: {entry_file}", "ERROR")
            return False
        
        # 檢查PyInstaller
        try:
            import PyInstaller
            self.log(f"PyInstaller版本: {PyInstaller.__version__}")
        except ImportError:
            self.log("PyInstaller未安裝，嘗試安裝...", "WARNING")
            if not self.install_pyinstaller():
                self.log("無法安裝PyInstaller", "ERROR")
                return False
        
        # 準備構建命令
        dist_dir = self.project_dir / "dist"
        build_dir = self.project_dir / "build"
        
        # 清理舊的構建文件
        if dist_dir.exists():
            shutil.rmtree(dist_dir)
        if build_dir.exists():
            shutil.rmtree(build_dir)
        
        # 構建命令
        cmd = [
            "pyinstaller",
            entry_file,
            "--onefile",
            "--windowed",
            "--name", app_name,
            "--distpath", str(dist_dir),
            "--workpath", str(build_dir),
            "--specpath", str(self.project_dir)
        ]
        
        # 添加數據文件
        data_dirs = ["modules", "config", "logs", "output"]
        for data_dir in data_dirs:
            dir_path = self.project_dir / data_dir
            if dir_path.exists():
                cmd.extend(["--add-data", f"{data_dir}{os.pathsep}{data_dir}"])
        
        self.log(f"執行構建命令: {' '.join(cmd)}")
        
        # 執行構建
        try:
            result = subprocess.run(cmd, cwd=self.project_dir, 
                                  capture_output=True, text=True, timeout=300)
            
            if result.returncode == 0:
                self.log("EXE構建成功！", "SUCCESS")
                
                # 檢查生成的EXE文件
                exe_path = dist_dir / f"{app_name}.exe"
                if exe_path.exists():
                    size = exe_path.stat().st_size
                    self.log(f"EXE文件: {exe_path} ({size:,} bytes)")
                    
                    # 創建部署報告
                    self.create_deployment_report(exe_path)
                    return True
                else:
                    self.log("EXE文件未生成", "ERROR")
                    return False
            else:
                self.log(f"構建失敗: {result.stderr}", "ERROR")
                return False
                
        except subprocess.TimeoutExpired:
            self.log("構建超時", "ERROR")
            return False
        except Exception as e:
            self.log(f"構建異常: {e}", "ERROR")
            return False
    
    def create_deployment_report(self, exe_path):
        """創建部署報告"""
        report = {
            "timestamp": datetime.now().isoformat(),
            "system": self.system,
            "arch": self.arch,
            "python_version": self.python_version,
            "exe_file": str(exe_path),
            "exe_size": exe_path.stat().st_size,
            "deployment_log": self.deploy_log,
            "status": "SUCCESS"
        }
        
        report_path = self.project_dir / "deployment_report.json"
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        self.log(f"部署報告已保存: {report_path}")
        
        # 創建README
        self.create_readme(exe_path)
    
    def create_readme(self, exe_path):
        """創建README文件"""
        readme_content = f"""# AutoRAG Windows 應用程式

## 🚀 快速開始

### 應用程式信息
- **文件名**: {exe_path.name}
- **大小**: {exe_path.stat().st_size:,} bytes
- **系統要求**: Windows 7/8/10/11
- **構建時間**: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

### 使用方法
1. 將 `{exe_path.name}` 複製到Windows電腦
2. 雙擊運行應用程式
3. 按照提示操作

### 功能特點
- ✅ 無需安裝Python
- ✅ 無需安裝依賴包
- ✅ 獨立可執行文件
- ✅ 無控制台窗口（後台運行）
- ✅ 自動日誌記錄

## 📁 文件結構

應用程式包含以下目錄：
- `modules/` - RAG系統模塊
- `config/` - 配置文件
- `logs/` - 運行日誌
- `output/` - 分析結果

## ⚙️ 配置說明

### 配置文件位置
應用程式會在以下位置創建配置文件：
1. 應用程式所在目錄的 `config/` 文件夾
2. 用戶目錄的 `.auto_rag/` 文件夾

### 日誌文件
運行日誌保存在：
- `logs/` 目錄（應用程式所在目錄）
- `%APPDATA%\\AutoRAG\\logs\\`（Windows系統）

## 🔧 故障排除

### 常見問題

#### 1. 應用程式無法啟動
**解決方案**：
- 確保Windows版本為7或更高
- 以管理員身份運行
- 檢查防毒軟體是否攔截

#### 2. 缺少依賴文件
**解決方案**：
- 確保 `modules/` 和 `config/` 目錄與EXE文件在同一目錄
- 重新下載完整應用程式包

#### 3. 日誌文件未生成
**解決方案**：
- 檢查應用程式目錄權限
- 確保有寫入權限

## 📊 系統監測

應用程式包含以下監測功能：
- 實時資源使用監測
- 自動錯誤報告
- 性能統計收集

## 🔄 更新與維護

### 檢查更新
應用程式會自動檢查更新，如需手動更新：
1. 下載最新版本
2. 替換舊的EXE文件
3. 配置文件會自動遷移

### 數據備份
重要數據備份位置：
- 分析結果：`output/` 目錄
- 配置設置：`config/` 目錄
- 日誌文件：`logs/` 目錄

## 📞 支持與幫助

### 獲取幫助
1. 查看 `deployment_report.json` 了解構建信息
2. 檢查 `logs/` 目錄的錯誤日誌
3. 查看應用程式內置幫助

---

**AutoRAG系統** - 智能項目分析與優化工具
**版本**: Windows可執行版
**構建環境**: {self.system} {self.arch} Python {self.python_version}
"""
        
        readme_path = self.project_dir / "README_WINDOWS_EXE.md"
        with open(readme_path, 'w', encoding='utf-8') as f:
            f.write(readme_content)
        
        self.log(f"README文件已創建: {readme_path}")
    
    def _run_command(self, cmd):
        """運行命令並返回結果"""
        self.log(f"執行命令: {' '.join(cmd)}")
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            
            if result.returncode == 0:
                self.log(f"命令成功: {cmd[0]}")
                if result.stdout.strip():
                    self.log(f"輸出: {result.stdout[:200]}...")
                return True
            else:
                self.log(f"命令失敗: {cmd[0]}", "ERROR")
                if result.stderr.strip():
                    self.log(f"錯誤: {result.stderr[:200]}...", "ERROR")
                return False
                
        except subprocess.TimeoutExpired:
            self.log(f"命令超時: {cmd[0]}", "ERROR")
            return False
        except Exception as e:
            self.log(f"命令異常: {e}", "ERROR")
            return False
    
    def deploy(self):
        """主部署流程"""
        self.log("=" * 60)
        self.log("🚀 開始跨環境部署流程")
        self.log("=" * 60)
        
        # 1. 檢測環境
        env_info = self.detect_environment()
        
        # 2. 安裝PyInstaller
        if not self.install_pyinstaller():
            self.log("PyInstaller安裝失敗，嘗試使用虛擬環境...", "WARNING")
            
            # 創建虛擬環境
            venv_path = self.create_virtual_env()
            if venv_path:
                # 在虛擬環境中安裝
                venv_python = Path(venv_path) / "bin" / "python"
                if venv_python.exists():
                    self.log("在虛擬環境中安裝PyInstaller...")
                    subprocess.run([str(venv_python), "-m", "pip", "install", "pyinstaller"], 
                                  check=True)
                else:
                    self.log("虛擬環境Python不可用", "ERROR")
                    return False
        
        # 3. 構建EXE
        success = self.build_windows_exe()
        
        # 4. 總結
        self.log("=" * 60)
        if success:
            self.log("🎉 部署流程完成！", "SUCCESS")
            self.log(f"EXE文件位置: {self.project_dir}/dist/AutoRAG.exe")
        else:
            self.log("❌ 部署流程失敗", "ERROR")
            self.log("請查看上面的錯誤信息進行調試")
        self.log("=" * 60)
        
        return success

def main():
    """主函數"""
    deployer = CrossEnvDeployer()
    deployer.deploy()

if __name__ == "__main__":
    main()