#!/usr/bin/env python3
"""
語音對話模塊主運行腳本
啟動完整的語音對話系統
"""

import os
import sys
import json
import time
import argparse
from pathlib import Path

# 添加當前目錄到路徑
sys.path.insert(0, str(Path(__file__).parent))

def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description="增強版RAG語音對話系統",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  # 使用默認配置啟動
  python run_voice_dialogue.py
  
  # 使用指定配置文件
  python run_voice_dialogue.py --config config.yaml
  
  # 啟用實際語音模式（需要安裝依賴）
  python run_voice_dialogue.py --real-mode
  
  # 測試模式
  python run_voice_dialogue.py --test
  
  # 查看系統狀態
  python run_voice_dialogue.py --status
        """
    )
    
    parser.add_argument(
        "--config",
        type=str,
        default="config.yaml",
        help="配置文件路徑 (默認: config.yaml)"
    )
    
    parser.add_argument(
        "--real-mode",
        action="store_true",
        help="啟用實際語音模式（禁用模擬模式）"
    )
    
    parser.add_argument(
        "--test",
        action="store_true",
        help="運行測試模式"
    )
    
    parser.add_argument(
        "--status",
        action="store_true",
        help="顯示系統狀態"
    )
    
    parser.add_argument(
        "--interactive",
        action="store_true",
        help="交互式模式"
    )
    
    parser.add_argument(
        "--max-turns",
        type=int,
        default=20,
        help="最大對話輪次 (默認: 20)"
    )
    
    parser.add_argument(
        "--output-dir",
        type=str,
        default="conversations",
        help="輸出目錄 (默認: conversations)"
    )
    
    args = parser.parse_args()
    
    print("=" * 70)
    print("增強版RAG語音對話系統")
    print("=" * 70)
    
    try:
        # 導入模塊
        from config_loader import ConfigLoader
        from voice_dialogue_module import VoiceDialogueModule
        
        # 測試模式
        if args.test:
            print("\n運行測試模式...")
            import test_voice_dialogue
            test_voice_dialogue.main()
            return
        
        # 狀態檢查模式
        if args.status:
            print("\n檢查系統狀態...")
            _check_system_status()
            return
        
        # 加載配置
        print(f"\n加載配置文件: {args.config}")
        config_loader = ConfigLoader(args.config)
        
        # 如果配置文件不存在，創建示例配置
        if not os.path.exists(args.config):
            print(f"配置文件不存在，創建示例配置: {args.config}")
            config_loader.create_sample_config(args.config)
            config_loader.load_config(args.config)
        
        # 獲取配置
        config = config_loader.get_config()
        
        # 根據命令行參數更新配置
        if args.real_mode:
            config["main"]["simulate_mode"] = False
            config["speech_recognition"]["simulate_mode"] = False
            config["rag_interface"]["simulate_mode"] = False
            config["speech_synthesis"]["simulate_mode"] = False
        
        config["main"]["max_conversation_turns"] = args.max_turns
        config["speech_synthesis"]["output_dir"] = args.output_dir
        
        # 驗證配置
        validation = config_loader.validate_config()
        if not validation["valid"]:
            print("❌ 配置驗證失敗:")
            for error in validation["errors"]:
                print(f"  - {error}")
            return
        
        if validation["warnings"]:
            print("⚠️  配置警告:")
            for warning in validation["warnings"]:
                print(f"  - {warning}")
        
        # 創建語音對話模塊
        print("\n初始化語音對話模塊...")
        dialogue = VoiceDialogueModule(config)
        
        # 顯示系統信息
        _display_system_info(dialogue, config)
        
        # 交互式模式
        if args.interactive:
            _run_interactive_mode(dialogue)
            return
        
        # 正常啟動
        print("\n啟動語音對話系統...")
        print("按 Ctrl+C 停止對話")
        
        if dialogue.start_conversation():
            try:
                # 主循環
                while True:
                    time.sleep(1)
                    
                    # 檢查對話狀態
                    summary = dialogue.get_conversation_summary()
                    if not summary["is_running"]:
                        print("\n對話已結束")
                        break
                    
                    # 顯示狀態（每10秒）
                    if int(time.time()) % 10 == 0:
                        _display_conversation_status(dialogue)
                        
            except KeyboardInterrupt:
                print("\n\n收到停止信號，正在停止對話...")
                
            finally:
                # 停止對話
                dialogue.stop_conversation()
                
                # 保存對話記錄
                if config["main"].get("save_conversations", True):
                    saved_file = dialogue.save_conversation()
                    if saved_file:
                        print(f"\n對話記錄已保存: {saved_file}")
                
                # 顯示總結
                _display_conversation_summary(dialogue)
        
        else:
            print("❌ 啟動對話失敗")
            
    except ImportError as e:
        print(f"❌ 導入模塊失敗: {e}")
        print("請確保所有依賴已安裝")
        
    except Exception as e:
        print(f"❌ 運行過程中發生錯誤: {e}")
        import traceback
        traceback.print_exc()


def _check_system_status():
    """檢查系統狀態"""
    try:
        # 檢查Python版本
        python_version = sys.version_info
        print(f"Python版本: {python_version.major}.{python_version.minor}.{python_version.micro}")
        
        # 檢查必要模塊
        required_modules = [
            ("speech_recognition_simple", "語音識別"),
            ("rag_interface_simple", "RAG接口"),
            ("speech_synthesis_simple", "語音合成"),
            ("voice_dialogue_module", "對話管理"),
            ("config_loader", "配置加載"),
            ("error_handler", "錯誤處理")
        ]
        
        print("\n模塊檢查:")
        for module_name, module_desc in required_modules:
            try:
                __import__(module_name)
                print(f"  ✅ {module_desc}: 可用")
            except ImportError:
                print(f"  ❌ {module_desc}: 不可用")
        
        # 檢查目錄權限
        print("\n目錄權限檢查:")
        directories = [".", "audio_output", "conversations"]
        for directory in directories:
            try:
                os.makedirs(directory, exist_ok=True)
                test_file = os.path.join(directory, ".test_write")
                with open(test_file, 'w') as f:
                    f.write("test")
                os.unlink(test_file)
                print(f"  ✅ {directory}: 可寫入")
            except Exception as e:
                print(f"  ❌ {directory}: 不可寫入 ({e})")
        
        print("\n系統狀態檢查完成")
        
    except Exception as e:
        print(f"檢查系統狀態失敗: {e}")


def _display_system_info(dialogue, config):
    """顯示系統信息"""
    print("\n" + "=" * 70)
    print("系統信息")
    print("=" * 70)
    
    # 獲取模塊狀態
    status = dialogue.get_status()
    
    print(f"運行模式: {'實際語音模式' if not config['main']['simulate_mode'] else '模擬模式'}")
    print(f"最大對話輪次: {config['main']['max_conversation_turns']}")
    print(f"輸出目錄: {config['speech_synthesis']['output_dir']}")
    
    print("\n模塊狀態:")
    print(f"  語音識別: {'可用' if status['speech_recognition'].get('initialized', True) else '不可用'}")
    print(f"  RAG接口: {'可用' if status['rag_interface'].get('initialized', True) else '不可用'}")
    print(f"  語音合成: {'可用' if status['speech_synthesis'].get('initialized', True) else '不可用'}")
    
    print("\n配置摘要:")
    print(f"  語言: {config['speech_recognition']['language']}")
    print(f"  RAG系統路徑: {config['rag_interface']['rag_system_path']}")
    print(f"  語速: {config['speech_synthesis']['rate']}")
    
    print("=" * 70)


def _run_interactive_mode(dialogue):
    """運行交互式模式"""
    print("\n交互式模式")
    print("=" * 70)
    print("可用命令:")
    print("  start    - 開始對話")
    print("  stop     - 停止對話")
    print("  status   - 顯示狀態")
    print("  history  - 顯示對話歷史")
    print("  save     - 保存對話記錄")
    print("  text <內容> - 發送文本輸入")
    print("  exit     - 退出程序")
    print("=" * 70)
    
    dialogue_started = False
    
    while True:
        try:
            command = input("\n> ").strip().lower()
            
            if not command:
                continue
                
            if command == "exit":
                if dialogue_started:
                    dialogue.stop_conversation()
                print("再見！")
                break
                
            elif command == "start":
                if dialogue.start_conversation():
                    dialogue_started = True
                    print("對話已開始")
                else:
                    print("啟動對話失敗")
                    
            elif command == "stop":
                if dialogue_started:
                    dialogue.stop_conversation()
                    dialogue_started = False
                    print("對話已停止")
                else:
                    print("對話未在進行中")
                    
            elif command == "status":
                summary = dialogue.get_conversation_summary()
                print(f"對話狀態: 運行中={summary['is_running']}, 輪次={summary['conversation_turn']}")
                
            elif command == "history":
                history = dialogue.get_conversation_history()
                if history:
                    print("\n對話歷史:")
                    for entry in history[-10:]:  # 顯示最近10條
                        role_symbol = "👤" if entry['role'] == 'user' else "🤖"
                        print(f"{role_symbol} {entry['content'][:80]}...")
                else:
                    print("沒有對話歷史")
                    
            elif command == "save":
                saved_file = dialogue.save_conversation()
                if saved_file:
                    print(f"對話記錄已保存: {saved_file}")
                else:
                    print("保存對話記錄失敗")
                    
            elif command.startswith("text "):
                if not dialogue_started:
                    print("請先開始對話")
                    continue
                    
                text = command[5:].strip()
                if text:
                    if dialogue.send_text_input(text):
                        print(f"已發送: {text}")
                    else:
                        print("發送失敗")
                else:
                    print("請輸入文本內容")
                    
            else:
                print(f"未知命令: {command}")
                print("可用命令: start, stop, status, history, save, text <內容>, exit")
                
        except KeyboardInterrupt:
            print("\n收到中斷信號")
            if dialogue_started:
                dialogue.stop_conversation()
            break
        except Exception as e:
            print(f"命令執行錯誤: {e}")


def _display_conversation_status(dialogue):
    """顯示對話狀態"""
    summary = dialogue.get_conversation_summary()
    
    status_line = f"對話輪次: {summary['conversation_turn']}"
    
    if summary['is_listening']:
        status_line += " | 🎤 聆聽中"
    if summary['is_processing']:
        status_line += " | ⚙️  處理中"
    if summary['is_speaking']:
        status_line += " | 🔊 說話中"
    
    print(f"\r{status_line}", end="", flush=True)


def _display_conversation_summary(dialogue):
    """顯示對話總結"""
    print("\n" + "=" * 70)
    print("對話總結")
    print("=" * 70)
    
    summary = dialogue.get_conversation_summary()
    history = dialogue.get_conversation_history()
    
    print(f"總對話輪次: {summary['conversation_turn']}")
    print(f"對話記錄數: {len(history)}")
    
    if history:
        print("\n最後幾條對話:")
        for entry in history[-3:]:
            role = "用戶" if entry['role'] == 'user' else "系統"
            print(f"  {role}: {entry['content'][:60]}...")
    
    print("=" * 70)
    print("增強版RAG語音對話系統 - 對話結束")
    print("=" * 70)


if __name__ == "__main__":
    main()