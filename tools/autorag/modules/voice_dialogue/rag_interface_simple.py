#!/usr/bin/env python3
"""
簡化版RAG接口模塊
與增強版RAG系統進行交互
"""

import os
import sys
import json
import time
import subprocess
import tempfile
from pathlib import Path
from typing import Dict, Any, Optional, List
import logging

# 添加父目錄到路徑
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

class RAGInterfaceSimple:
    """簡化版RAG接口模塊"""
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        初始化RAG接口模塊
        """
        self.config = config or {}
        self.logger = self._setup_logger()
        
        # 配置
        self.rag_system_path = self.config.get("rag_system_path", ".")
        self.timeout = self.config.get("timeout", 30)
        self.max_retries = self.config.get("max_retries", 3)
        self.simulate_mode = self.config.get("simulate_mode", True)
        
        # 狀態
        self.conversation_history = []
        
        self.logger.info(f"RAG接口模塊初始化完成")
    
    def _setup_logger(self) -> logging.Logger:
        """設置日誌記錄器"""
        logger = logging.getLogger(__name__)
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
            logger.setLevel(logging.INFO)
        return logger
    
    def query(self, text: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        查詢RAG系統
        """
        if self.simulate_mode:
            return self._simulate_query(text, context)
        
        # 嘗試調用RAG系統
        for attempt in range(self.max_retries):
            try:
                self.logger.info(f"查詢RAG系統 (嘗試 {attempt + 1}): {text[:50]}...")
                
                result = self._execute_rag_query(text)
                
                # 更新對話歷史
                self._update_conversation_history(text, result)
                
                self.logger.info("RAG查詢成功")
                return result
                
            except Exception as e:
                self.logger.error(f"RAG查詢失敗 (嘗試 {attempt + 1}): {e}")
                if attempt == self.max_retries - 1:
                    return self._create_error_response(text, str(e))
                
                time.sleep(1 * (attempt + 1))
    
    def _execute_rag_query(self, text: str) -> Dict[str, Any]:
        """執行RAG查詢"""
        # 方法1: 直接調用RAG模塊
        try:
            return self._call_rag_modules(text)
        except Exception as e:
            self.logger.warning(f"直接調用RAG模塊失敗: {e}")
        
        # 方法2: 通過子進程調用
        try:
            return self._call_rag_script(text)
        except Exception as e:
            self.logger.warning(f"調用RAG腳本失敗: {e}")
        
        # 方法3: 模擬響應
        return self._create_simulated_response(text)
    
    def _call_rag_modules(self, text: str) -> Dict[str, Any]:
        """直接調用RAG模塊"""
        try:
            # 嘗試導入RAG分析器
            from rag_analyzer import ProjectAnalyzer
            
            # 分析項目
            analyzer = ProjectAnalyzer(".")
            report = analyzer.generate_analysis_report()
            
            # 格式化響應
            response = self._format_analysis_response(text, report)
            
            return {
                "response": response,
                "confidence": 0.85,
                "sources": [{"type": "project_analysis", "path": "."}],
                "metadata": {
                    "analysis_type": "project_analysis",
                    "report_summary": report.get("overall_assessment", {})
                }
            }
            
        except ImportError as e:
            self.logger.error(f"無法導入RAG模塊: {e}")
            raise
        except Exception as e:
            self.logger.error(f"RAG模塊執行錯誤: {e}")
            raise
    
    def _call_rag_script(self, text: str) -> Dict[str, Any]:
        """通過子進程調用RAG腳本"""
        # 創建臨時文件
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(text)
            query_file = f.name
        
        try:
            # 查找可用的RAG腳本
            scripts = ["main_enhanced.py", "run_enhanced_with_modules.py", "main.py"]
            script_path = None
            
            for script in scripts:
                path = os.path.join(self.rag_system_path, script)
                if os.path.exists(path):
                    script_path = path
                    break
            
            if not script_path:
                raise FileNotFoundError("未找到RAG腳本")
            
            # 執行命令
            cmd = ["python3", script_path, "--query", text]
            
            self.logger.info(f"執行命令: {' '.join(cmd)}")
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=self.timeout,
                cwd=self.rag_system_path
            )
            
            if result.returncode == 0:
                return {
                    "response": result.stdout,
                    "confidence": 0.75,
                    "sources": [{"type": "script_execution", "script": script_path}],
                    "metadata": {
                        "execution_method": "script",
                        "return_code": result.returncode
                    }
                }
            else:
                raise Exception(f"腳本執行失敗: {result.stderr}")
                
        finally:
            # 清理臨時文件
            if os.path.exists(query_file):
                os.unlink(query_file)
    
    def _create_simulated_response(self, text: str) -> Dict[str, Any]:
        """創建模擬響應"""
        # 根據查詢內容生成響應
        if "分析" in text or "analyze" in text.lower():
            response = "項目分析結果：整體評分85/100。建議：1) 增加測試覆蓋率 2) 完善文檔 3) 優化代碼結構。"
        elif "代碼" in text or "code" in text.lower():
            response = "代碼質量分析：發現2個性能問題，3個代碼風格問題。建議進行代碼審查和重構。"
        elif "幫助" in text or "help" in text.lower():
            response = "我可以幫助您：1) 分析項目 2) 檢查代碼質量 3) 優化配置 4) 生成報告。請告訴我您需要什麼？"
        elif "運行" in text or "run" in text.lower():
            response = "要運行項目：1) 安裝依賴 2) 運行 'npm start' 或 'python main.py' 3) 查看日誌輸出。"
        else:
            response = f"收到您的查詢：'{text}'。我是增強版RAG系統，可以幫助您分析和優化項目。"
        
        return {
            "response": response,
            "confidence": 0.60,
            "sources": [{"type": "simulated_response"}],
            "metadata": {
                "simulated": True,
                "query": text
            }
        }
    
    def _simulate_query(self, text: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """模擬查詢（測試用）"""
        self.logger.info(f"模擬模式：處理查詢: {text[:50]}...")
        
        # 簡單模擬
        response = f"模擬響應：收到查詢 '{text}'。這是測試模式，實際系統會提供詳細分析。"
        
        return {
            "response": response,
            "confidence": 0.50,
            "sources": [{"type": "simulation"}],
            "metadata": {
                "simulated": True,
                "query": text,
                "context": context
            }
        }
    
    def _format_analysis_response(self, query: str, report: Dict[str, Any]) -> str:
        """格式化分析響應"""
        assessment = report.get("overall_assessment", {})
        score = assessment.get("overall_score", 0)
        level = assessment.get("maturity_level", "unknown")
        
        response = f"項目分析報告：\n"
        response += f"總體評分: {score}/100\n"
        response += f"成熟度等級: {level}\n\n"
        
        # 添加建議
        recommendations = report.get("recommendations", [])
        if recommendations:
            response += f"主要建議 ({len(recommendations)} 條):\n"
            for i, rec in enumerate(recommendations[:3], 1):
                response += f"{i}. {rec.get('description', '')}\n"
        
        return response
    
    def _update_conversation_history(self, query: str, result: Dict[str, Any]) -> None:
        """更新對話歷史"""
        history_entry = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "query": query,
            "response": result.get("response", "")[:100] + "..." if len(result.get("response", "")) > 100 else result.get("response", "")
        }
        
        self.conversation_history.append(history_entry)
        
        # 限制歷史長度
        if len(self.conversation_history) > 10:
            self.conversation_history = self.conversation_history[-10:]
    
    def _create_error_response(self, query: str, error: str) -> Dict[str, Any]:
        """創建錯誤響應"""
        response = f"抱歉，處理查詢時發生錯誤：{error}\n"
        response += "請稍後再試，或檢查RAG系統是否正常運行。"
        
        return {
            "response": response,
            "confidence": 0.0,
            "sources": [],
            "metadata": {
                "error": True,
                "error_message": error,
                "query": query
            }
        }
    
    def get_status(self) -> Dict[str, Any]:
        """獲取模塊狀態"""
        return {
            "simulate_mode": self.simulate_mode,
            "rag_system_path": self.rag_system_path,
            "conversation_history_length": len(self.conversation_history),
            "module": "RAGInterfaceSimple"
        }


def test_rag_interface():
    """測試RAG接口"""
    print("測試RAG接口模塊...")
    
    # 創配置
    config = {
        "rag_system_path": ".",
        "simulate_mode": True,
        "timeout": 10
    }
    
    # 創建接口模塊
    rag_interface = RAGInterfaceSimple(config)
    
    # 檢查狀態
    status = rag_interface.get_status()
    print(f"模塊狀態: {json.dumps(status, indent=2, ensure_ascii=False)}")
    
    # 測試查詢
    test_queries = [
        "請分析這個項目",
        "代碼質量怎麼樣",
        "幫助我了解這個系統",
        "如何運行這個項目"
    ]
    
    for query in test_queries:
        print(f"\n查詢: {query}")
        result = rag_interface.query(query)
        
        if result:
            print(f"響應: {result.get('response', '')[:100]}...")
            print(f"置信度: {result.get('confidence', 0)}")
        else:
            print("查詢失敗")
    
    print("\nRAG接口測試完成")


if __name__ == "__main__":
    test_rag_interface()