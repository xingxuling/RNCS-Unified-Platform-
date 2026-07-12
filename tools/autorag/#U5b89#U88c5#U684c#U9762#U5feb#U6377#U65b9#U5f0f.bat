@echo off
chcp 65001 >nul
title RAG系统 - 创建桌面快捷方式
color 0A

cls
echo ========================================
echo   RAG系统 - 创建桌面快捷方式
echo ========================================
echo.

REM 获取脚本所在目录
set "RAG_DIR=%~dp0"
cd /d "%RAG_DIR%"

echo 正在创建桌面快捷方式...
echo.

REM 使用PowerShell创建快捷方式
powershell -Command "& {$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\RAG-System.lnk'); $Shortcut.TargetPath = '%RAG_DIR%启动RAG系统.bat'; $Shortcut.WorkingDirectory = '%RAG_DIR%'; $Shortcut.Save(); Write-Host 'RAG-System.lnk created' -ForegroundColor Green}"

powershell -Command "& {$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\RAG-System-Full.lnk'); $Shortcut.TargetPath = '%RAG_DIR%RAG_Windows_Launcher.bat'; $Shortcut.WorkingDirectory = '%RAG_DIR%'; $Shortcut.Save(); Write-Host 'RAG-System-Full.lnk created' -ForegroundColor Green}"

echo.
echo ========================================
echo   快捷方式创建完成!
echo ========================================
echo.
echo 桌面上已创建两个快捷方式:
echo   1. RAG-System.lnk - 快速启动版
echo   2. RAG-System-Full.lnk - 完整菜单版
echo.
echo 双击快捷方式即可启动RAG系统
echo.
pause