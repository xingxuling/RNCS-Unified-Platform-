#!/usr/bin/env python3
"""
AutoRAG Web 服务器
提供浏览器访问接口，封装原有 AutoRAG 功能
"""

import os
import sys
import json
import subprocess
import tempfile
import shutil
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional

from fastapi import FastAPI, HTTPException, Form, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uvicorn

# 添加模块路径
sys.path.insert(0, str(Path(__file__).parent / "modules"))

# 导入原有模块
try:
    from rag_analyzer import ProjectAnalyzer
    from decision_engine import DecisionEngine
    from auto_packager import AutoPackager
    HAS_MODULES = True
except ImportError as e:
    print(f"警告: 无法导入模块: {e}")
    HAS_MODULES = False

app = FastAPI(
    title="AutoRAG Web 服务",
    description="AutoRAG 系统的 Web 接口",
    version="1.0.0"
)

# 创建模板目录
templates_dir = Path(__file__).parent / "templates"
templates_dir.mkdir(exist_ok=True)
templates = Jinja2Templates(directory=str(templates_dir))

# 创建静态文件目录
static_dir = Path(__file__).parent / "static"
static_dir.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

class RAGWebService:
    """RAG Web 服务封装"""
    
    @staticmethod
    def run_analysis(project_path: str) -> Dict[str, Any]:
        """运行 RAG 分析（封装原有逻辑）"""
        try:
            # 检查项目路径
            if not os.path.exists(project_path):
                return {
                    "status": "error",
                    "message": f"项目路径不存在: {project_path}",
                    "timestamp": datetime.now().isoformat()
                }
            
            # 使用原有分析器
            analyzer = ProjectAnalyzer(project_path)
            report = analyzer.generate_analysis_report()
            
            # 生成决策
            engine = DecisionEngine(report)
            priorities = engine.evaluate_priorities()
            focus = engine.determine_iteration_focus()
            plan = engine.generate_implementation_plan()
            final_decision = engine.make_final_decision()
            
            decisions = {
                "analysis_summary": {
                    "project_name": report["project_info"]["name"],
                    "overall_score": report["overall_assessment"]["overall_score"],
                    "maturity_level": report["overall_assessment"]["maturity_level"]
                },
                "priorities": priorities,
                "iteration_focus": focus,
                "implementation_plan": plan,
                "final_decision": final_decision
            }
            
            # 创建输出目录
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_dir = Path(__file__).parent / "web_output" / timestamp
            output_dir.mkdir(parents=True, exist_ok=True)
            
            # 保存报告
            report_path = output_dir / "analysis_report.json"
            with open(report_path, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
            
            decisions_path = output_dir / "decisions.json"
            with open(decisions_path, 'w', encoding='utf-8') as f:
                json.dump(decisions, f, indent=2, ensure_ascii=False)
            
            # 返回简化结果
            return {
                "status": "success",
                "project_name": report["project_info"]["name"],
                "overall_score": report["overall_assessment"]["overall_score"],
                "maturity_level": report["overall_assessment"]["maturity_level"],
                "readiness_for_production": report["overall_assessment"]["readiness_for_production"],
                "recommendations_count": len(report["recommendations"]),
                "should_proceed": final_decision["should_proceed"],
                "iteration_theme": focus["iteration_theme"],
                "report_path": str(report_path),
                "decisions_path": str(decisions_path),
                "output_dir": str(output_dir),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"分析过程中出错: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
    
    @staticmethod
    def run_simple_analysis(project_path: str) -> Dict[str, Any]:
        """运行简单分析（备用方法）"""
        try:
            # 使用子进程调用原有 main.py
            cmd = [sys.executable, "main.py", project_path]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                encoding='utf-8',
                timeout=300  # 5分钟超时
            )
            
            if result.returncode != 0:
                return {
                    "status": "error",
                    "message": f"分析失败: {result.stderr[:200]}",
                    "timestamp": datetime.now().isoformat()
                }
            
            # 尝试从输出中提取信息
            output = result.stdout
            
            # 简单解析输出
            project_name = Path(project_path).name
            score_match = None
            level_match = None
            
            # 查找分数和等级
            for line in output.split('\n'):
                if "總體分數:" in line:
                    score_match = line
                elif "成熟度等級:" in line:
                    level_match = line
            
            return {
                "status": "success",
                "project_name": project_name,
                "output": output[-1000:],  # 最后1000字符
                "score_line": score_match,
                "level_line": level_match,
                "timestamp": datetime.now().isoformat()
            }
            
        except subprocess.TimeoutExpired:
            return {
                "status": "error",
                "message": "分析超时（超过5分钟）",
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"简单分析出错: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }

# API 路由
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """主页"""
    return templates.TemplateResponse(
        "index.html",
        {"request": request, "has_modules": HAS_MODULES}
    )

@app.post("/api/run")
async def run_analysis(project_path: str = Form(...)):
    """运行分析 API"""
    if not project_path.strip():
        raise HTTPException(status_code=400, detail="项目路径不能为空")
    
    # 检查路径是否存在
    if not os.path.exists(project_path):
        # 尝试相对路径
        abs_path = Path(__file__).parent / project_path
        if not abs_path.exists():
            raise HTTPException(status_code=400, detail=f"项目路径不存在: {project_path}")
        project_path = str(abs_path)
    
    # 运行分析
    if HAS_MODULES:
        result = RAGWebService.run_analysis(project_path)
    else:
        result = RAGWebService.run_simple_analysis(project_path)
    
    return JSONResponse(content=result)

@app.get("/api/status")
async def get_status():
    """获取服务状态"""
    return {
        "status": "running",
        "service": "AutoRAG Web",
        "version": "1.0.0",
        "has_modules": HAS_MODULES,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/test-project")
async def test_with_sample():
    """使用测试项目运行分析"""
    test_project = Path(__file__).parent / "test_project"
    if not test_project.exists():
        raise HTTPException(status_code=404, detail="测试项目不存在")
    
    if HAS_MODULES:
        result = RAGWebService.run_analysis(str(test_project))
    else:
        result = RAGWebService.run_simple_analysis(str(test_project))
    
    return JSONResponse(content=result)

# 错误处理
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """通用异常处理"""
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": f"服务器内部错误: {str(exc)}",
            "timestamp": datetime.now().isoformat()
        }
    )

def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description="启动 AutoRAG Web 服务器")
    parser.add_argument("--host", default="0.0.0.0", help="监听地址")
    parser.add_argument("--port", type=int, default=8000, help="监听端口")
    parser.add_argument("--reload", action="store_true", help="启用热重载")
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("🚀 启动 AutoRAG Web 服务器")
    print("=" * 60)
    print(f"📡 地址: http://{args.host}:{args.port}")
    print(f"🔧 模块状态: {'✅ 已加载' if HAS_MODULES else '⚠️  未加载'}")
    print(f"📁 测试项目: {Path(__file__).parent / 'test_project'}")
    print("=" * 60)
    print("📋 可用接口:")
    print("  GET  /              - 主页")
    print("  POST /api/run       - 运行分析")
    print("  GET  /api/status    - 服务状态")
    print("  GET  /api/test-project - 测试分析")
    print("=" * 60)
    
    uvicorn.run(
        "web_server:app",
        host=args.host,
        port=args.port,
        reload=args.reload
    )

if __name__ == "__main__":
    main()