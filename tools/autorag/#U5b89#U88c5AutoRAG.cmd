@echo off
title AutoRAG 一键安装
color 0A

echo =========================================
echo        AutoRAG 一键安装程序
echo =========================================
echo.

REM 检查是否在正确目录
if not exist "main_enhanced.py" (
    echo [错误] 请将本文件复制到以下目录运行：
    echo        C:\Users\User\auto-rag-system\
    echo.
    echo 操作方法：
    echo 1. 按 Win+R
    echo 2. 输入：explorer C:\Users\User\auto-rag-system
    echo 3. 将本文件复制进去
    echo.
    pause
    exit /b 1
)

echo [1/4] 检查Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到Python，请先安装Python 3.8+
    echo 下载地址：https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [2/4] 生成EXE...
python build_exe.py
if errorlevel 1 (
    echo [错误] EXE生成失败
    pause
    exit /b 1
)

echo [3/4] 安装系统组件...
python -m pip install pywin32
python post_install.py

echo [4/4] 完成！
echo.
echo =========================================
echo         安装成功！
echo =========================================
echo.
echo 已创建：
echo   ✓ dist\AutoRAG.exe
echo   ✓ 桌面快捷方式
echo   ✓ 开机自启动
echo.
echo 使用方法：
echo   1. 双击桌面上的 AutoRAG 快捷方式
echo   2. 或运行：dist\AutoRAG.exe
echo   3. 重启电脑后会自动启动
echo.
pause