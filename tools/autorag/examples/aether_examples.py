"""
Aether Track Engine 使用示例
演示如何在 auto-rag-system 中使用 Aether 预测功能
"""

from modules.aether_integration import AetherIntegration, quick_forecast, get_recommendations


def example_basic_forecast():
    """基础预测示例"""
    print("=== 基础预测示例 ===\n")
    
    # 创建集成实例
    integration = AetherIntegration()
    
    # 执行预测
    result = integration.analyze_with_rag(
        question="A轮融资什么时候能close？",
        context="已与8家VC接触，3家给TS，目前2家在做DD。团队希望6周内完成。"
    )
    
    # 打印摘要
    print(integration.get_summary())
    
    # 获取行动建议
    recommendations = integration.get_action_recommendations()
    print(f"\n推荐行动: {recommendations['label']}")
    print(f"置信度: {recommendations['confidence']*100:.0f}%")


def example_with_rag():
    """结合 RAG 分析的示例"""
    print("\n=== 结合 RAG 分析示例 ===\n")
    
    integration = AetherIntegration()
    
    # 模拟 RAG 分析数据
    rag_data = {
        "confidence": 0.75,
        "time_suggestion": "预计 3-4 周内",
        "evidence": ["项目进度良好", "投资意向明确"]
    }
    
    # 执行分析
    result = integration.analyze_with_rag(
        question="产品什么时候能发布？",
        context="核心功能开发完成90%，测试覆盖率85%。竞品预计下月发布。",
        rag_data=rag_data
    )
    
    print(f"综合置信度: {result['merged_confidence']*100:.0f}%")
    print(f"RAG 建议: {rag_data['time_suggestion']}")


def example_edge_signals():
    """边缘信号检测示例"""
    print("\n=== 边缘信号检测示例 ===\n")
    
    integration = AetherIntegration()
    
    # 执行分析
    integration.analyze_with_rag(
        question="offer什么时候能到？",
        context="已完成3轮面试，上周完成HR终面。HR说2周内给答复。"
    )
    
    # 检查边缘信号
    signals = integration.check_edge_signals()
    
    print(f"检测到 {len(signals)} 个边缘信号:\n")
    for i, signal in enumerate(signals, 1):
        print(f"{i}. {signal['signal']}")
        print(f"   为什么重要: {signal['whyItMatters']}")
        print(f"   如何验证: {signal['howToVerify']}\n")


def example_batch_forecast():
    """批量预测示例"""
    print("\n=== 批量预测示例 ===\n")
    
    integration = AetherIntegration()
    
    # 批量预测
    forecasts = [
        {"question": "融资什么时候能close？", "context": "已接触5家VC"},
        {"question": "offer什么时候到？", "context": "已完成面试"},
        {"question": "项目什么时候能交付？", "context": "完成80%进度"}
    ]
    
    results = integration.batch_analyze(forecasts)
    
    for i, result in enumerate(results, 1):
        print(f"{i}. {result['question']}")
        print(f"   事件线: {result['resultLine']['windowStart']}")
        print(f"   行动许可: {result['qsdm']['actionType']['label']}\n")


def example_export():
    """导出功能示例"""
    print("\n=== 导出功能示例 ===\n")
    
    integration = AetherIntegration()
    integration.analyze_with_rag(
        question="录取什么时候能确定？",
        context="已提交申请，等待结果。"
    )
    
    # 导出为 JSON
    json_data = integration.export_to_json()
    print("JSON 导出成功")
    
    # 导出 Aether 脚本
    script = integration.export_aether_script()
    print("Aether 脚本导出成功")
    print(f"\n脚本预览:\n{script[:200]}...")


def example_convenience_functions():
    """便捷函数示例"""
    print("\n=== 便捷函数示例 ===\n")
    
    # 快速预测
    result = quick_forecast(
        question="房产什么时候能卖出去？",
        context="挂牌3周，12组看房，2组意向。"
    )
    
    # 获取建议
    recommendations = get_recommendations(
        question="房产什么时候能卖出去？",
        context="挂牌3周，12组看房，2组意向。"
    )
    
    print(f"快速预测完成")
    print(f"行动许可: {recommendations['label']}")
    print(f"允许行动: {', '.join(recommendations['allowed_actions'][:2])}")


if __name__ == "__main__":
    # 运行所有示例
    example_basic_forecast()
    example_with_rag()
    example_edge_signals()
    example_batch_forecast()
    example_export()
    example_convenience_functions()
    
    print("\n=== 所有示例运行完成 ===")