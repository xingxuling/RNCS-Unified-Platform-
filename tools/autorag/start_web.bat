@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 启动 AutoRAG Web 服务
echo ========================================

REM 设置端口
set PORT=8000
set HOST=0.0.0.0

REM 检查 Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: Python 未安装
    pause
    exit /b 1
)

REM 检查 FastAPI 是否安装
python -c "import fastapi" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  警告: FastAPI 未安装，正在安装...
    pip install fastapi uvicorn
)

REM 检查 uvicorn 是否安装
python -c "import uvicorn" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  警告: uvicorn 未安装，正在安装...
    pip install uvicorn
)

REM 创建必要的目录
if not exist templates mkdir templates
if not exist static mkdir static
if not exist web_output mkdir web_output

REM 检查 web_server.py 是否存在
if not exist web_server.py (
    echo ❌ 错误: web_server.py 不存在
    pause
    exit /b 1
)

REM 检查测试项目
if not exist test_project (
    echo ⚠️  警告: test_project 目录不存在
    echo 📁 创建测试项目目录...
    mkdir test_project
    echo # 测试项目 > test_project\README.md
    echo print('Hello from test project') > test_project\main.py
)

echo 📡 启动参数:
echo   主机: %HOST%
echo   端口: %PORT%
echo   地址: http://localhost:%PORT%
echo ========================================

REM 启动服务
echo 🚀 启动 Web 服务...
echo 📋 按 Ctrl+C 停止服务
echo ========================================

python web_server.py --host %HOST% --port %PORT%