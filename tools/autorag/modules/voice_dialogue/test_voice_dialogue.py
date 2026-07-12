#!/usr/bin/env python3
"""
語音對話模塊測試腳本
測試完整的功能流程
"""

import os
import sys
import json
import time
import tempfile
from pathlib import Path

# 添加當前目錄到路徑
sys.path.insert(0, str(Path(__file__).parent))

def test_individual_modules():
    """測試各個子模塊"""
    print("=" * 70)
    print("測試各個子模塊")
    print("=" * 70)
    
    # 測試語音識別模塊
    print("\n1. 測試語音識別模塊...")
    try:
        from speech_recognition_simple import SpeechRecognitionSimple
        
        recognizer = SpeechRecognitionSimple({"simulate_mode": True})
        status = recognizer.get_status()
        print(f"  狀態: {json.dumps(status, indent=2)}")
        
        # 測試識別
        text = recognizer.recognize_from_microphone()
        print(f"  識別測試: {text}")
        
        print("  ✅ 語音識別模塊測試通過")
    except Exception as e:
        print(f"  ❌ 語音識別模塊測試失敗: {e}")
    
    # 測試RAG接口模塊
    print("\n2. 測試RAG接口模塊...")
    try:
        from rag_interface_simple import RAGInterfaceSimple
        
        rag_interface = RAGInterfaceSimple({"simulate_mode": True})
        status = rag_interface.get_status()
        print(f"  狀態: {json.dumps(status, indent=2)}")
        
        # 測試查詢
        result = rag_interface.query("測試查詢")
        print(f"  查詢測試: {result.get('response', '')[:50]}...")
        
        print("  ✅ RAG接口模塊測試通過")
    except Exception as e:
        print(f"  ❌ RAG接口模塊測試失敗: {e}")
    
    # 測試語音合成模塊
    print("\n3. 測試語音合成模塊...")
    try:
        from speech_synthesis_simple import SpeechSynthesisSimple
        
        synthesizer = SpeechSynthesisSimple({
            "simulate_mode": True,
            "output_dir": "test_audio"
        })
        status = synthesizer.get_status()
        print(f"  狀態: {json.dumps(status, indent=2)}")
        
        # 測試語音合成
        audio_file = synthesizer.speak("測試語音合成", blocking=False)
        print(f"  合成測試: {audio_file}")
        
        # 清理測試文件
        synthesizer.cleanup_old_files(max_age_hours=0)
        
        print("  ✅ 語音合成模塊測試通過")
    except Exception as e:
        print(f"  ❌ 語音合成模塊測試失敗: {e}")
    
    # 測試配置加載器
    print("\n4. 測試配置加載器...")
    try:
        from config_loader import ConfigLoader
        
        # 創建臨時配置文件
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
            config_content = """
main:
  simulate_mode: true
  auto_start: false
"""
            f.write(config_content)
            config_file = f.name
        
        loader = ConfigLoader(config_file)
        
        # 測試配置加載
        config = loader.get_config()
        print(f"  加載的配置: simulate_mode={config.get('main', {}).get('simulate_mode')}")
        
        # 測試配置驗證
        validation = loader.validate_config()
        print(f"  配置驗證: valid={validation['valid']}")
        
        # 清理
        os.unlink(config_file)
        
        print("  ✅ 配置加載器測試通過")
    except Exception as e:
        print(f"  ❌ 配置加載器測試失敗: {e}")
        if 'config_file' in locals() and os.path.exists(config_file):
            os.unlink(config_file)
    
    # 測試錯誤處理模塊
    print("\n5. 測試錯誤處理模塊...")
    try:
        from error_handler import ErrorHandler
        
        error_handler = ErrorHandler({
            "log_errors": False,
            "auto_recover": True
        })
        
        # 測試錯誤處理
        try:
            raise ValueError("測試錯誤")
        except ValueError as e:
            result = error_handler.handle_error(e, {"test": True})
            print(f"  錯誤處理測試: action={result['action']}")
        
        # 測試統計
        stats = error_handler.get_error_stats()
        print(f"  錯誤統計: total_errors={stats['total_errors']}")
        
        print("  ✅ 錯誤處理模塊測試通過")
    except Exception as e:
        print(f"  ❌ 錯誤處理模塊測試失敗: {e}")


def test_integration():
    """測試模塊集成"""
    print("\n" + "=" * 70)
    print("測試模塊集成")
    print("=" * 70)
    
    try:
        from voice_dialogue_module import VoiceDialogueModule
        
        # 創建配置
        config = {
            "simulate_mode": True,
            "auto_start": False,
            "max_conversation_turns": 3,
            
            "speech_recognition": {
                "simulate_mode": True
            },
            
            "rag_interface": {
                "simulate_mode": True,
                "rag_system_path": "."
            },
            
            "speech_synthesis": {
                "simulate_mode": True,
                "output_dir": "test_audio"
            }
        }
        
        # 創建語音對話模塊
        print("\n創建語音對話模塊...")
        dialogue = VoiceDialogueModule(config)
        
        # 檢查狀態
        status = dialogue.get_status()
        print(f"模塊狀態: 運行中={status['main_module']['is_running']}")
        
        # 開始對話
        print("\n開始對話...")
        if dialogue.start_conversation():
            print("對話已開始")
            
            # 等待歡迎語音
            time.sleep(2)
            
            # 測試對話流程
            test_scenarios = [
                {
                    "input": "請分析這個項目",
                    "description": "項目分析查詢"
                },
                {
                    "input": "代碼質量怎麼樣",
                    "description": "代碼質量查詢"
                },
                {
                    "input": "謝謝你的幫助",
                    "description": "結束對話"
                }
            ]
            
            for i, scenario in enumerate(test_scenarios, 1):
                print(f"\n測試場景 {i}: {scenario['description']}")
                print(f"輸入: {scenario['input']}")
                
                # 發送輸入
                dialogue.send_text_input(scenario['input'])
                
                # 等待處理
                time.sleep(3)
                
                # 檢查狀態
                summary = dialogue.get_conversation_summary()
                print(f"對話狀態: 輪次={summary['conversation_turn']}")
            
            # 獲取對話歷史
            print("\n對話歷史:")
            history = dialogue.get_conversation_history()
            for entry in history:
                role_symbol = "👤" if entry['role'] == 'user' else "🤖"
                print(f"{role_symbol} {entry['content'][:60]}...")
            
            # 保存對話記錄
            saved_file = dialogue.save_conversation("test_conversation.json")
            if saved_file:
                print(f"\n對話記錄已保存: {saved_file}")
            
            # 停止對話
            print("\n停止對話...")
            dialogue.stop_conversation()
            time.sleep(1)
            
            print("\n✅ 模塊集成測試通過")
        else:
            print("❌ 啟動對話失敗")
            
    except Exception as e:
        print(f"❌ 模塊集成測試失敗: {e}")
        import traceback
        traceback.print_exc()


def test_performance():
    """測試性能"""
    print("\n" + "=" * 70)
    print("測試性能")
    print("=" * 70)
    
    try:
        from voice_dialogue_module import VoiceDialogueModule
        
        # 創建配置
        config = {
            "simulate_mode": True,
            "auto_start": False,
            "max_conversation_turns": 5
        }
        
        # 創建模塊
        dialogue = VoiceDialogueModule(config)
        
        # 開始性能測試
        print("\n開始性能測試...")
        start_time = time.time()
        
        # 啟動對話
        dialogue.start_conversation()
        time.sleep(1)
        
        # 發送多個測試輸入
        test_inputs = [
            "測試輸入1",
            "測試輸入2",
            "測試輸入3",
            "測試輸入4",
            "測試輸入5"
        ]
        
        for i, input_text in enumerate(test_inputs, 1):
            dialogue.send_text_input(input_text)
            time.sleep(1)  # 等待處理
        
        # 停止對話
        dialogue.stop_conversation()
        
        # 計算性能指標
        end_time = time.time()
        total_time = end_time - start_time
        
        # 獲取狀態
        status = dialogue.get_status()
        history = dialogue.get_conversation_history()
        
        print(f"\n性能測試結果:")
        print(f"  總時間: {total_time:.2f} 秒")
        print(f"  對話輪次: {status['main_module']['conversation_turn']}")
        print(f"  歷史記錄: {len(history)} 條")
        print(f"  平均響應時間: {total_time / len(test_inputs):.2f} 秒/輪")
        
        # 清理測試文件
        import shutil
        if os.path.exists("test_audio"):
            shutil.rmtree("test_audio")
        if os.path.exists("test_conversation.json"):
            os.unlink("test_conversation.json")
        
        print("\n✅ 性能測試完成")
        
    except Exception as e:
        print(f"❌ 性能測試失敗: {e}")


def test_error_recovery():
    """測試錯誤恢復"""
    print("\n" + "=" * 70)
    print("測試錯誤恢復")
    print("=" * 70)
    
    try:
        # 測試錯誤處理
        from error_handler import ErrorHandler
        
        error_handler = ErrorHandler({
            "max_retries": 2,
            "retry_delay": 0.5,
            "auto_recover": True
        })
        
        print("\n測試錯誤恢復流程...")
        
        # 模擬一系列錯誤
        test_errors = [
            TimeoutError("第一次超時"),
            ConnectionError("網絡錯誤"),
            ValueError("配置錯誤")
        ]
        
        for i, error in enumerate(test_errors, 1):
            print(f"\n錯誤 {i}: {type(error).__name__}")
            result = error_handler.handle_error(error)
            print(f"  處理動作: {result['action']}")
            print(f"  消息: {result['message']}")
        
        # 檢查錯誤統計
        stats = error_handler.get_error_stats()
        print(f"\n錯誤統計:")
        print(f"  總錯誤數: {stats['total_errors']}")
        print(f"  恢復嘗試: {stats['recovery_attempts']}")
        
        # 檢查是否可以繼續
        can_continue = error_handler.can_continue()
        print(f"  可以繼續運行: {can_continue}")
        
        print("\n✅ 錯誤恢復測試完成")
        
    except Exception as e:
        print(f"❌ 錯誤恢復測試失敗: {e}")


def main():
    """主測試函數"""
    print("語音對話模塊完整測試")
    print("=" * 70)
    
    # 創建測試目錄
    os.makedirs("test_audio", exist_ok=True)
    
    try:
        # 運行各個測試
        test_individual_modules()
        test_integration()
        test_performance()
        test_error_recovery()
        
        print("\n" + "=" * 70)
        print("所有測試完成！")
        print("=" * 70)
        
        # 清理
        import shutil
        if os.path.exists("test_audio"):
            shutil.rmtree("test_audio")
        if os.path.exists("test_conversation.json"):
            os.unlink("test_conversation.json")
        
    except KeyboardInterrupt:
        print("\n測試被用戶中斷")
    except Exception as e:
        print(f"\n測試過程中發生錯誤: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # 確保清理
        if os.path.exists("test_audio"):
            import shutil
            shutil.rmtree("test_audio")


if __name__ == "__main__":
    main()