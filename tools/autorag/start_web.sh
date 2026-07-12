#!/bin/bash

# AutoRAG Web 服务启动脚本
# 用法: ./start_web.sh [端口]

set -e

echo "========================================"
echo "🚀 启动 AutoRAG Web 服务"
echo "========================================"

# 设置端口
PORT=${1:-8000}
HOST="0.0.0.0"

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: Python3 未安装"
    exit 1
fi

# 检查 FastAPI 是否安装
if ! python3 -c "import fastapi" &> /dev/null; then
    echo "⚠️  警告: FastAPI 未安装，正在安装..."
    pip3 install fastapi uvicorn --break-system-packages
fi

# 检查 uvicorn 是否安装
if ! python3 -c "import uvicorn" &> /dev/null; then
    echo "⚠️  警告: uvicorn 未安装，正在安装..."
    pip3 install uvicorn --break-system-packages
fi

# 创建必要的目录
mkdir -p templates
mkdir -p static
mkdir -p web_output

# 检查 web_server.py 是否存在
if [ ! -f "web_server.py" ]; then
    echo "❌ 错误: web_server.py 不存在"
    exit 1
fi

# 检查测试项目
if [ ! -d "test_project" ]; then
    echo "⚠️  警告: test_project 目录不存在"
    echo "📁 创建测试项目目录..."
    mkdir -p test_project
    echo "# 测试项目" > test_project/README.md
    echo "print('Hello from test project')" > test_project/main.py
fi

echo "📡 启动参数:"
echo "  主机: $HOST"
echo "  端口: $PORT"
echo "  地址: http://localhost:$PORT"
echo "========================================"

# 启动服务
echo "🚀 启动 Web 服务..."
echo "📋 按 Ctrl+C 停止服务"
echo "========================================"

python3 web_server.py --host "$HOST" --port "$PORT"