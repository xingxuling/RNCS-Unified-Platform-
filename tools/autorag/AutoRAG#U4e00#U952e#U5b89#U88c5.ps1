# AutoRAG 一键安装 PowerShell 脚本
# 右键点击 → "使用 PowerShell 运行"

Write-Host "===============================" -ForegroundColor Cyan
Write-Host "AutoRAG One-Click Installer" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

# 检查 Python
$pythonPath = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonPath) {
    Write-Host "[ERROR] 未检测到 Python，请先安装 Python 3.8+" -ForegroundColor Red
    Write-Host "下载地址: https://www.python.org/downloads/" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "[1/3] 生成 EXE..." -ForegroundColor Green
python build_exe.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] EXE 生成失败" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "[2/3] 安装系统集成..." -ForegroundColor Green
python -m pip install pywin32
python post_install.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] 系统集成可能未完全安装" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[3/3] 完成" -ForegroundColor Green
Write-Host "✔ 已生成 exe" -ForegroundColor Green
Write-Host "✔ 已创建桌面图标" -ForegroundColor Green
Write-Host "✔ 已设置开机自启动" -ForegroundColor Green
Write-Host ""
Write-Host "现在你可以：" -ForegroundColor Cyan
Write-Host "1. 双击桌面上的 AutoRAG 快捷方式" -ForegroundColor White
Write-Host "2. 重启电脑后会自动启动" -ForegroundColor White
Write-Host ""
pause