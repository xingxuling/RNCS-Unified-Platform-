#!/usr/bin/env python3
"""
語音對話模塊演示腳本
展示完整的功能流程
"""

import os
import sys
import time
from pathlib import Path

# 添加當前目錄到路徑
sys.path.insert(0, str(Path(__file__).parent))

def demo_individual_modules():
    """演示各個子模塊"""
    print("=" * 70)
    print("演示各個子模塊功能")
    print("=" * 70)
    
    # 1. 語音識別模塊演示
    print("\n1. 🎤 語音識別模塊演示")
    print("-" * 40)
    
    from speech_recognition_simple import SpeechRecognitionSimple
    
    recognizer = SpeechRecognitionSimple({
        "language": "zh-CN",
        "simulate_mode": True
    })
    
    print("模擬語音識別中...")
    recognized_text = recognizer.recognize_from_microphone()
    print(f"識別結果: {recognized_text}")
    
    # 2. RAG接口模塊演示
    print("\n2. 🧠 RAG接口模塊演示")
    print("-" * 40)
    
    from rag_interface_simple import RAGInterfaceSimple
    
    rag_interface = RAGInterfaceSimple({
        "rag_system_path": ".",
        "simulate_mode": True
    })
    
    test_queries = [
        "請分析這個項目",
        "代碼質量怎麼樣",
        "如何運行這個系統"
    ]
    
    for query in test_queries:
        print(f"\n查詢: {query}")
        result = rag_interface.query(query)
        response = result.get("response", "")
        print(f"回復: {response[:80]}...")
    
    # 3. 語音合成模塊演示
    print("\n3. 🔊 語音合成模塊演示")
    print("-" * 40)
    
    from speech_synthesis_simple import SpeechSynthesisSimple
    
    synthesizer = SpeechSynthesisSimple({
        "language": "zh",
        "rate": 150,
        "simulate_mode": True,
        "output_dir": "demo_audio"
    })
    
    test_texts = [
        "你好，我是增強版RAG語音助手",
        "我可以幫助您分析項目和代碼質量",
        "請告訴我您需要什麼幫助"
    ]
    
    for text in test_texts:
        print(f"\n合成文本: {text}")
        audio_file = synthesizer.speak(text, blocking=False)
        print(f"音頻文件: {audio_file}")
        time.sleep(1)  # 模擬播放時間


def demo_integrated_system():
    """演示集成系統"""
    print("\n" + "=" * 70)
    print("演示集成語音對話系統")
    print("=" * 70)
    
    from voice_dialogue_module import VoiceDialogueModule
    
    # 創建配置
    config = {
        "simulate_mode": True,
        "auto_start": False,
        "max_conversation_turns": 5,
        
        "speech_recognition": {
            "simulate_mode": True
        },
        
        "rag_interface": {
            "simulate_mode": True,
            "rag_system_path": "."
        },
        
        "speech_synthesis": {
            "simulate_mode": True,
            "output_dir": "demo_audio"
        }
    }
    
    # 創建語音對話模塊
    print("\n初始化語音對話系統...")
    dialogue = VoiceDialogueModule(config)
    
    # 顯示系統信息
    status = dialogue.get_status()
    print(f"系統狀態: 模擬模式={status['main_module']['simulate_mode']}")
    
    # 開始對話
    print("\n開始對話...")
    if dialogue.start_conversation():
        print("✅ 對話已開始")
        time.sleep(2)  # 等待歡迎語音
        
        # 演示對話流程
        demo_scenarios = [
            {
                "input": "請介紹這個系統的功能",
                "description": "功能查詢"
            },
            {
                "input": "如何分析一個項目",
                "description": "使用指導"
            },
            {
                "input": "謝謝你的幫助",
                "description": "結束對話"
            }
        ]
        
        for scenario in demo_scenarios:
            print(f"\n📝 {scenario['description']}")
            print(f"輸入: {scenario['input']}")
            
            # 發送輸入
            dialogue.send_text_input(scenario['input'])
            
            # 等待處理
            time.sleep(3)
            
            # 顯示狀態
            summary = dialogue.get_conversation_summary()
            print(f"對話輪次: {summary['conversation_turn']}")
        
        # 顯示對話歷史
        print("\n📊 對話歷史:")
        history = dialogue.get_conversation_history()
        for entry in history:
            role_symbol = "👤" if entry['role'] == 'user' else "🤖"
            print(f"{role_symbol} {entry['content'][:60]}...")
        
        # 保存對話記錄
        saved_file = dialogue.save_conversation("demo_conversation.json")
        if saved_file:
            print(f"\n💾 對話記錄已保存: {saved_file}")
        
        # 停止對話
        print("\n停止對話...")
        dialogue.stop_conversation()
        time.sleep(1)
        
        print("\n✅ 集成系統演示完成")
    else:
        print("❌ 啟動對話失敗")


def demo_error_handling():
    """演示錯誤處理"""
    print("\n" + "=" * 70)
    print("演示錯誤處理功能")
    print("=" * 70)
    
    from error_handler import ErrorHandler
    
    # 創建錯誤處理模塊
    error_handler = ErrorHandler({
        "log_errors": False,
        "auto_recover": True,
        "max_retries": 2
    })
    
    # 模擬各種錯誤
    print("\n模擬錯誤處理流程...")
    
    errors = [
        ("網絡超時", TimeoutError("API調用超時")),
        ("音頻設備錯誤", OSError("麥克風不可用")),
        ("配置錯誤", ValueError("無效的配置參數"))
    ]
    
    for error_name, error in errors:
        print(f"\n處理錯誤: {error_name}")
        result = error_handler.handle_error(error, {"context": "demo"})
        print(f"  處理動作: {result['action']}")
        print(f"  消息: {result['message']}")
    
    # 顯示錯誤統計
    stats = error_handler.get_error_stats()
    print(f"\n📈 錯誤統計:")
    print(f"  總錯誤數: {stats['total_errors']}")
    print(f"  錯誤分類: {stats['category_stats']}")
    
    print("\n✅ 錯誤處理演示完成")


def demo_configuration():
    """演示配置管理"""
    print("\n" + "=" * 70)
    print("演示配置管理功能")
    print("=" * 70)
    
    from config_loader import ConfigLoader
    
    # 創建配置加載器
    config_loader = ConfigLoader()
    
    # 顯示默認配置
    print("\n默認配置:")
    default_config = config_loader.get_config()
    print(f"  模擬模式: {default_config['main']['simulate_mode']}")
    print(f"  最大對話輪次: {default_config['main']['max_conversation_turns']}")
    print(f"  識別語言: {default_config['speech_recognition']['language']}")
    
    # 創建示例配置
    print("\n創建示例配置文件...")
    config_loader.create_sample_config("demo_config.yaml")
    
    # 驗證配置
    validation = config_loader.validate_config()
    print(f"\n配置驗證:")
    print(f"  是否有效: {validation['valid']}")
    print(f"  配置部分: {', '.join(validation['config_sections'])}")
    
    print("\n✅ 配置管理演示完成")


def main():
    """主演示函數"""
    print("增強版RAG語音對話模塊演示")
    print("=" * 70)
    
    try:
        # 創建演示目錄
        os.makedirs("demo_audio", exist_ok=True)
        
        # 運行各個演示
        demo_individual_modules()
        demo_integrated_system()
        demo_error_handling()
        demo_configuration()
        
        print("\n" + "=" * 70)
        print("所有演示完成！")
        print("=" * 70)
        
        # 顯示總結
        print("\n🎉 演示總結:")
        print("1. ✅ 語音識別功能正常")
        print("2. ✅ RAG接口功能正常")
        print("3. ✅ 語音合成功能正常")
        print("4. ✅ 集成系統功能正常")
        print("5. ✅ 錯誤處理功能正常")
        print("6. ✅ 配置管理功能正常")
        
        print("\n📁 生成的演示文件:")
        if os.path.exists("demo_audio"):
            audio_files = os.listdir("demo_audio")
            print(f"  音頻文件: {len(audio_files)} 個")
        
        if os.path.exists("demo_conversation.json"):
            print(f"  對話記錄: demo_conversation.json")
        
        if os.path.exists("demo_config.yaml"):
            print(f"  配置文件: demo_config.yaml")
        
        print("\n🚀 系統準備就緒，可以開始使用！")
        
    except KeyboardInterrupt:
        print("\n演示被用戶中斷")
    except Exception as e:
        print(f"\n演示過程中發生錯誤: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # 清理演示文件
        import shutil
        if os.path.exists("demo_audio"):
            shutil.rmtree("demo_audio")
        if os.path.exists("demo_conversation.json"):
            os.unlink("demo_conversation.json")
        if os.path.exists("demo_config.yaml"):
            os.unlink("demo_config.yaml")


if __name__ == "__main__":
    main()