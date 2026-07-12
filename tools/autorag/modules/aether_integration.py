"""
Aether Track Engine 集成模块
提供与 auto-rag-system 的集成接口
"""

from typing import Dict, List, Any, Optional
import json
from datetime import datetime
from .aether_track_engine import AetherTrackEngine, analyze_forecast


class AetherIntegration:
    """Aether Track Engine 集成类"""
    
    def __init__(self):
        self.engine = AetherTrackEngine()
        self.history: List[Dict[str, Any]] = []
    
    def analyze_with_rag(
        self,
        question: str,
        context: str = "",
        rag_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        结合 RAG 分析和 Aether 预测
        
        Args:
            question: 核心问题
            context: 背景信息
            rag_data: RAG 分析结果（可选）
        
        Returns:
            综合分析结果
        """
        # 执行 Aether 预测
        forecast = self.engine.analyze(question, context)
        
        # 如果有 RAG 数据，进行融合
        if rag_data:
            forecast = self._merge_with_rag(forecast, rag_data)
        
        # 保存到历史记录
        self.history.append(forecast)
        
        return forecast
    
    def _merge_with_rag(
        self,
        forecast: Dict[str, Any],
        rag_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        将 RAG 分析结果与 Aether 预测融合
        
        Args:
            forecast: Aether 预测结果
            rag_data: RAG 分析数据
        
        Returns:
            融合后的结果
        """
        # 调整置信度
        rag_confidence = rag_data.get("confidence", 0.5)
        aether_confidence = forecast["qsdm"]["actionType"]["score"]
        
        merged_confidence = (rag_confidence + aether_confidence) / 2
        
        # 调整时间窗口
        if rag_data.get("time_suggestion"):
            forecast["rag_time_suggestion"] = rag_data["time_suggestion"]
        
        # 添加 RAG 分析证据
        if rag_data.get("evidence"):
            forecast["rag_evidence"] = rag_data["evidence"]
        
        # 更新综合置信度
        forecast["merged_confidence"] = merged_confidence
        
        return forecast
    
    def batch_analyze(
        self,
        forecasts: List[Dict[str, str]]
    ) -> List[Dict[str, Any]]:
        """
        批量分析多个预测
        
        Args:
            forecasts: 预测列表，每个包含 question 和 context
        
        Returns:
            分析结果列表
        """
        results = []
        for item in forecasts:
            result = self.engine.analyze(
                item.get("question", ""),
                item.get("context", "")
            )
            results.append(result)
        
        self.history.extend(results)
        return results
    
    def export_to_json(
        self,
        forecast: Optional[Dict[str, Any]] = None,
        filepath: Optional[str] = None
    ) -> str:
        """
        导出预测结果为 JSON
        
        Args:
            forecast: 要导出的预测（默认为最新的）
            filepath: 导出文件路径
        
        Returns:
            JSON 字符串
        """
        if forecast is None:
            if not self.history:
                raise ValueError("没有可导出的预测记录")
            forecast = self.history[-1]
        
        json_str = json.dumps(forecast, ensure_ascii=False, indent=2)
        
        if filepath:
            with open(filepath, 'w', encoding='utf-8') as json_str:
                pass
        
        return json_str
    
    def export_aether_script(
        self,
        forecast: Optional[Dict[str, Any]] = None,
        filepath: Optional[str] = None
    ) -> str:
        """
        导出 Aether 脚本
        
        Args:
            forecast: 要导出的预测（默认为最新的）
            filepath: 导出文件路径
        
        Returns:
            Aether 脚本内容
        """
        if forecast is None:
            if not self.history:
                raise ValueError("没有可导出的预测记录")
            forecast = self.history[-1]
        
        script = forecast.get("aetherScript", "")
        
        if filepath:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(script)
        
        return script
    
    def get_action_recommendations(
        self,
        forecast: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        获取行动建议
        
        Args:
            forecast: 预测结果（默认为最新的）
        
        Returns:
            行动建议
        """
        if forecast is None:
            if not self.history:
                raise ValueError("没有预测记录")
            forecast = self.history[-1]
        
        action_type = forecast["qsdm"]["actionType"]
        
        return {
            "permission": action_type["permission"],
            "label": action_type["label"],
            "description": action_type["description"],
            "allowed_actions": action_type["allowedActions"],
            "prohibited_actions": action_type["prohibitedActions"],
            "confidence": action_type["score"],
            "result_window": f"{forecast['resultLine']['windowStart']} ~ {forecast['resultLine']['windowEnd']}",
            "activation_window": f"{forecast['activationLine']['windowStart']} ~ {forecast['activationLine']['windowEnd']}"
        }
    
    def check_edge_signals(
        self,
        forecast: Optional[Dict[str, Any]] = None,
        signal_type: Optional[str] = None
    ) -> List[Dict[str, str]]:
        """
        检查边缘信号
        
        Args:
            forecast: 预测结果（默认为最新的）
            signal_type: 信号类型过滤（可选）
        
        Returns:
            边缘信号列表
        """
        if forecast is None:
            if not self.history:
                raise ValueError("没有预测记录")
            forecast = self.history[-1]
        
        signals = forecast.get("edgeSignals", [])
        
        if signal_type:
            signals = [s for s in signals if s.get("category") == signal_type]
        
        return signals
    
    def get_summary(
        self,
        forecast: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        获取预测摘要
        
        Args:
            forecast: 预测结果（默认为最新的）
        
        Returns:
            摘要文本
        """
        if forecast is None:
            if not self.history:
                raise ValueError("没有预测记录")
            forecast = self.history[-1]
        
        action = forecast["qsdm"]["actionType"]
        
        summary = f"""
=== Aether Track Engine 预测摘要 ===

问题: {forecast['question']}
背景: {forecast.get('context', '无')}

【双轨时间线】
事件线: {forecast['resultLine']['windowStart']} ~ {forecast['resultLine']['windowEnd']}
  置信度: {forecast['resultLine']['confidence']*100:.0f}%

结构线: {forecast['activationLine']['windowStart']} ~ {forecast['activationLine']['windowEnd']}
  置信度: {forecast['activationLine']['confidence']*100:.0f}%

【行动授权】
许可级别: {action['label']}
授权分数: {action['score']*100:.0f}%
描述: {action['description']}

允许的行动:
"""

        for allowed in action['allowedActions']:
            summary += f"  ✓ {allowed}\n"
        
        summary += "\n禁止的行动:\n"
        for prohibited in action['prohibitedActions']:
            summary += f"  ✗ {prohibited}\n"
        
        summary += f"""
【边缘信号】
检测到 {len(forecast['edgeSignals'])} 个边缘信号
建议关注: {forecast['edgeSignals'][0]['signal'] if forecast['edgeSignals'] else '无'}

生成时间: {forecast['createdAt']}
"""
        return summary


# 便捷函数
def quick_forecast(question: str, context: str = "") -> Dict[str, Any]:
    """
    快速预测函数
    
    Args:
        question: 核心问题
        context: 背景信息
    
    Returns:
        预测结果
    """
    integration = AetherIntegration()
    return integration.analyze_with_rag(question, context)


def get_recommendations(question: str, context: str = "") -> Dict[str, Any]:
    """
    获取行动建议
    
    Args:
        question: 核心问题
        context: 背景信息
    
    Returns:
        行动建议
    """
    integration = AetherIntegration()
    integration.analyze_with_rag(question, context)
    return integration.get_action_recommendations()


def check_signals(question: str, context: str = "") -> List[Dict[str, str]]:
    """
    检查边缘信号
    
    Args:
        question: 核心问题
        context: 背景信息
    
    Returns:
        边缘信号列表
    """
    integration = AetherIntegration()
    integration.analyze_with_rag(question, context)
    return integration.check_edge_signals()


if __name__ == "__main__":
    # 测试集成
    print("=== Aether Track Engine 集成测试 ===\n")
    
    # 创建集成实例
    integration = AetherIntegration()
    
    # 分析示例
    result = integration.analyze_with_rag(
        question="A轮融资什么时候能close？",
        context="已与8家VC接触，3家给TS，目前2家在做DD。团队希望6周内完成。"
    )
    
    print(integration.get_summary())
    
    # 获取行动建议
    print("\n=== 行动建议 ===")
    recommendations = integration.get_action_recommendations()
    print(f"许可级别: {recommendations['label']}")
    print(f"置信度: {recommendations['confidence']*100:.0f}%")
    print("\n允许的行动:")
    for action in recommendations['allowed_actions']:
        print(f"  ✓ {action}")