@echo off
chcp 65001 >nul
title RAG系统 - 一键启动
color 0B

cls
echo ========================================
echo       RAG 自动化系统
echo ========================================
echo.

REM 获取脚本所在目录
set "RAG_DIR=%~dp0"
cd /d "%RAG_DIR%"

REM 检查Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未检测到Python环境
    echo.
    echo 请先安装Python 3.8或更高版本
    echo 下载地址: https://www.python.org/downloads/
    echo.
    echo 安装时务必勾选: Add Python to PATH
    echo.
    pause
    exit /b 1
)

echo ✅ Python环境检测通过
echo.
echo 正在启动RAG系统...
echo.

REM 启动图形化界面
call RAG_Windows_Launcher.bat

pause