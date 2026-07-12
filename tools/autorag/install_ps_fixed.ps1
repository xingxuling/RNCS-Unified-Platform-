# AutoRAG PowerShell 安裝腳本 (修正版)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    AutoRAG PowerShell 安裝器" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 檢查管理員權限
Write-Host "🔍 檢查管理員權限..." -ForegroundColor Yellow
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ 需要管理員權限" -ForegroundColor Red
    Write-Host ""
    Write-Host "請右鍵點擊此文件，選擇「以管理員身份運行」" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "按 Enter 鍵退出"
    exit 1
}
Write-Host "✅ 管理員權限已確認" -ForegroundColor Green

# 檢查 Python
Write-Host ""
Write-Host "🔍 檢查 Python 環境..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Python not found"
    }
    Write-Host "✅ Python 已安裝: $pythonVersion" -ForegroundColor Green
    
    # 檢查 Python 版本
    $versionOutput = python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>$null
    if ([version]$versionOutput -lt [version]"3.8") {
        Write-Host "❌ Python 版本過低 (需要 >= 3.8)" -ForegroundColor Red
        Read-Host "按 Enter 鍵退出"
        exit 1
    }
    Write-Host "✅ Python 版本符合要求" -ForegroundColor Green
}
catch {
    Write-Host "❌ 未檢測到 Python" -ForegroundColor Red
    Write-Host ""
    Write-Host "請先安裝 Python 3.8+ 並添加到 PATH" -ForegroundColor Yellow
    Write-Host "下載地址: https://www.python.org/downloads/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "安裝時請務必勾選「Add Python to PATH」" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "按 Enter 鍵退出"
    exit 1
}

# 檢查必要文件
Write-Host ""
Write-Host "🔍 檢查必要文件..." -ForegroundColor Yellow
$requiredFiles = @("build_exe.py", "post_install.py", "main_enhanced.py")
$allFilesExist = $true

foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ 找不到文件: $file" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host ""
    Read-Host "按 Enter 鍵退出"
    exit 1
}
Write-Host "✅ 所有必要文件都存在" -ForegroundColor Green

# 步驟 1: 生成 EXE 文件
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    [1/3] 生成 EXE 文件" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "正在安裝 PyInstaller 並生成 EXE..." -ForegroundColor Yellow
Write-Host "這可能需要幾分鐘時間..." -ForegroundColor Yellow
Write-Host ""

python build_exe.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ EXE 生成失敗" -ForegroundColor Red
    Write-Host ""
    Write-Host "請檢查:" -ForegroundColor Yellow
    Write-Host "1. Python 是否正確安裝" -ForegroundColor Yellow
    Write-Host "2. 網絡連接是否正常" -ForegroundColor Yellow
    Write-Host "3. 磁盤空間是否充足" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "按 Enter 鍵退出"
    exit 1
}
Write-Host "✅ EXE 生成成功" -ForegroundColor Green

# 步驟 2: 安裝系統集成
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    [2/3] 安裝系統集成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "正在安裝 pywin32..." -ForegroundColor Yellow
python -m pip install pywin32
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  pywin32 安裝失敗，嘗試替代方法..." -ForegroundColor Yellow
    python -m pip install --upgrade pip
    python -m pip install pywin32 --user
}

Write-Host ""
Write-Host "正在創建快捷方式和設置開機自啟動..." -ForegroundColor Yellow
python post_install.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  系統集成部分失敗，但 EXE 已生成" -ForegroundColor Yellow
    Write-Host "您可以手動運行 dist\AutoRAG.exe" -ForegroundColor Yellow
}

# 步驟 3: 安裝完成
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    [3/3] 安裝完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 安裝完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📋 安裝結果:" -ForegroundColor Cyan
Write-Host ""

if (Test-Path "dist\AutoRAG.exe") {
    Write-Host "✅ EXE 文件: dist\AutoRAG.exe" -ForegroundColor Green
} else {
    Write-Host "❌ EXE 文件生成失敗" -ForegroundColor Red
}

$desktopShortcut = "$env:USERPROFILE\Desktop\AutoRAG.lnk"
if (Test-Path $desktopShortcut) {
    Write-Host "✅ 桌面快捷方式: 已創建" -ForegroundColor Green
} else {
    Write-Host "⚠️  桌面快捷方式: 未創建" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 使用方法:" -ForegroundColor Cyan
Write-Host "1. 雙擊桌面上的 AutoRAG 快捷方式" -ForegroundColor Yellow
Write-Host "2. 或直接運行 dist\AutoRAG.exe" -ForegroundColor Yellow
Write-Host ""
Write-Host "📖 文檔:" -ForegroundColor Cyan
Write-Host "   查看 README_ENHANCED.md 獲取詳細信息" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "按 Enter 鍵退出"