#!/usr/bin/env python3
"""
語音對話模塊主類
實現完整的語音對話流程：語音輸入 → RAG處理 → 語音輸出
"""

import os
import sys
import json
import time
import threading
import queue
from pathlib import Path
from typing import Dict, Any, Optional, Callable, List
import logging

# 導入子模塊
try:
    from .speech_recognition_simple import SpeechRecognitionSimple
    from .rag_interface_simple import RAGInterfaceSimple
    from .speech_synthesis_simple import SpeechSynthesisSimple
except ImportError:
    # 如果相對導入失敗，嘗試絕對導入
    from speech_recognition_simple import SpeechRecognitionSimple
    from rag_interface_simple import RAGInterfaceSimple
    from speech_synthesis_simple import SpeechSynthesisSimple

class VoiceDialogueModule:
    """語音對話模塊主類"""
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        初始化語音對話模塊
        
        Args:
            config: 配置字典
        """
        self.config = config or {}
        self.logger = self._setup_logger()
        
        # 模塊配置
        self.simulate_mode = self.config.get("simulate_mode", True)
        self.auto_start = self.config.get("auto_start", False)
        self.max_conversation_turns = self.config.get("max_conversation_turns", 20)
        
        # 狀態變量
        self.is_running = False
        self.is_listening = False
        self.is_processing = False
        self.is_speaking = False
        self.conversation_turn = 0
        self.conversation_history = []
        
        # 消息隊列
        self.input_queue = queue.Queue()
        self.output_queue = queue.Queue()
        
        # 初始化子模塊
        self._initialize_modules()
        
        self.logger.info("語音對話模塊初始化完成")
    
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
    
    def _initialize_modules(self) -> None:
        """初始化所有子模塊"""
        # 語音識別模塊
        speech_config = self.config.get("speech_recognition", {})
        speech_config["simulate_mode"] = self.simulate_mode
        self.speech_recognizer = SpeechRecognitionSimple(speech_config)
        
        # RAG接口模塊
        rag_config = self.config.get("rag_interface", {})
        rag_config["simulate_mode"] = self.simulate_mode
        rag_config["rag_system_path"] = self.config.get("rag_system_path", ".")
        self.rag_interface = RAGInterfaceSimple(rag_config)
        
        # 語音合成模塊
        synthesis_config = self.config.get("speech_synthesis", {})
        synthesis_config["simulate_mode"] = self.simulate_mode
        self.speech_synthesizer = SpeechSynthesisSimple(synthesis_config)
        
        self.logger.info("所有子模塊初始化完成")
    
    def start_conversation(self) -> bool:
        """
        開始對話
        
        Returns:
            是否成功啟動
        """
        if self.is_running:
            self.logger.warning("對話已經在進行中")
            return False
        
        self.is_running = True
        self.conversation_turn = 0
        self.conversation_history = []
        
        # 啟動對話線程
        self.conversation_thread = threading.Thread(
            target=self._conversation_loop,
            daemon=True
        )
        self.conversation_thread.start()
        
        # 播放歡迎語音
        welcome_text = "歡迎使用增強版RAG語音助手。請告訴我您需要什麼幫助？"
        self._speak_response(welcome_text)
        
        self.logger.info("對話已開始")
        return True
    
    def stop_conversation(self) -> None:
        """停止對話"""
        if not self.is_running:
            self.logger.warning("對話未在進行中")
            return
        
        self.is_running = False
        self.is_listening = False
        self.is_processing = False
        self.is_speaking = False
        
        # 停止語音識別
        self.speech_recognizer.stop_continuous_listening()
        
        # 停止語音合成
        self.speech_synthesizer.stop_speaking()
        
        # 等待線程結束
        if hasattr(self, 'conversation_thread') and self.conversation_thread.is_alive():
            self.conversation_thread.join(timeout=2)
        
        # 播放結束語音
        goodbye_text = "對話結束，感謝使用增強版RAG語音助手。"
        self._speak_response(goodbye_text, blocking=True)
        
        self.logger.info("對話已停止")
    
    def _conversation_loop(self) -> None:
        """對話主循環"""
        self.logger.info("對話循環開始")
        
        # 開始連續聆聽
        self.speech_recognizer.start_continuous_listening(self._on_speech_recognized)
        self.is_listening = True
        
        while self.is_running:
            try:
                # 檢查對話輪次限制
                if self.conversation_turn >= self.max_conversation_turns:
                    self.logger.info("達到最大對話輪次，自動結束對話")
                    self.stop_conversation()
                    break
                
                # 處理輸入隊列
                if not self.input_queue.empty():
                    user_input = self.input_queue.get()
                    self._process_user_input(user_input)
                
                # 短暫休息避免CPU過載
                time.sleep(0.1)
                
            except Exception as e:
                self.logger.error(f"對話循環錯誤: {e}")
                time.sleep(1)  # 錯誤後等待1秒
        
        self.logger.info("對話循環結束")
    
    def _on_speech_recognized(self, text: str) -> None:
        """
        語音識別回調函數
        
        Args:
            text: 識別出的文本
        """
        if not text or not self.is_running:
            return
        
        self.logger.info(f"識別到語音: {text}")
        
        # 添加到輸入隊列
        self.input_queue.put(text)
    
    def _process_user_input(self, user_input: str) -> None:
        """
        處理用戶輸入
        
        Args:
            user_input: 用戶輸入文本
        """
        if self.is_processing or self.is_speaking:
            self.logger.warning("系統正忙，忽略輸入")
            return
        
        self.is_processing = True
        self.conversation_turn += 1
        
        try:
            # 記錄用戶輸入
            self._add_to_history("user", user_input)
            
            # 播放確認音效（可選）
            self._play_notification("received")
            
            # 處理查詢
            self.logger.info(f"處理用戶查詢: {user_input}")
            rag_response = self.rag_interface.query(user_input)
            
            if rag_response:
                response_text = rag_response.get("response", "")
                confidence = rag_response.get("confidence", 0)
                
                self.logger.info(f"RAG響應 (置信度: {confidence:.2f}): {response_text[:50]}...")
                
                # 記錄系統響應
                self._add_to_history("system", response_text, confidence)
                
                # 語音輸出
                self._speak_response(response_text)
            else:
                error_text = "抱歉，無法處理您的查詢。請稍後再試。"
                self._add_to_history("system", error_text, 0.0)
                self._speak_response(error_text)
                
        except Exception as e:
            self.logger.error(f"處理用戶輸入失敗: {e}")
            error_text = f"處理時發生錯誤: {str(e)[:50]}..."
            self._add_to_history("system", error_text, 0.0)
            self._speak_response("抱歉，處理時發生錯誤。")
            
        finally:
            self.is_processing = False
    
    def _speak_response(self, text: str, blocking: bool = False) -> None:
        """
        語音輸出響應
        
        Args:
            text: 要輸出的文本
            blocking: 是否阻塞
        """
        if not text:
            return
        
        self.is_speaking = True
        
        try:
            # 播放開始音效（可選）
            self._play_notification("speaking")
            
            # 語音合成
            audio_file = self.speech_synthesizer.speak(text, blocking=blocking)
            
            if audio_file:
                self.logger.info(f"語音輸出完成: {audio_file}")
            else:
                self.logger.warning("語音輸出未生成文件")
                
        except Exception as e:
            self.logger.error(f"語音輸出失敗: {e}")
            
        finally:
            self.is_speaking = False
    
    def _play_notification(self, notification_type: str) -> None:
        """
        播放通知音效
        
        Args:
            notification_type: 通知類型
        """
        # 這裡可以實現不同的通知音效
        # 例如：收到消息、開始說話、錯誤等
        
        if notification_type == "received":
            self.logger.debug("播放收到消息音效")
        elif notification_type == "speaking":
            self.logger.debug("播放開始說話音效")
        elif notification_type == "error":
            self.logger.debug("播放錯誤音效")
    
    def _add_to_history(self, role: str, content: str, confidence: float = 1.0) -> None:
        """
        添加到對話歷史
        
        Args:
            role: 角色 (user/system)
            content: 內容
            confidence: 置信度
        """
        history_entry = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "turn": self.conversation_turn,
            "role": role,
            "content": content,
            "confidence": confidence
        }
        
        self.conversation_history.append(history_entry)
        
        # 限制歷史長度
        if len(self.conversation_history) > 50:
            self.conversation_history = self.conversation_history[-50:]
    
    def send_text_input(self, text: str) -> bool:
        """
        發送文本輸入（用於測試或非語音輸入）
        
        Args:
            text: 輸入文本
            
        Returns:
            是否成功發送
        """
        if not self.is_running:
            self.logger.warning("對話未在進行中，無法發送輸入")
            return False
        
        if not text or not text.strip():
            self.logger.warning("輸入文本為空")
            return False
        
        self.input_queue.put(text.strip())
        self.logger.info(f"文本輸入已發送: {text[:50]}...")
        return True
    
    def get_conversation_summary(self) -> Dict[str, Any]:
        """獲取對話摘要"""
        return {
            "is_running": self.is_running,
            "conversation_turn": self.conversation_turn,
            "history_length": len(self.conversation_history),
            "is_listening": self.is_listening,
            "is_processing": self.is_processing,
            "is_speaking": self.is_speaking,
            "simulate_mode": self.simulate_mode
        }
    
    def get_conversation_history(self, max_entries: int = 10) -> List[Dict[str, Any]]:
        """
        獲取對話歷史
        
        Args:
            max_entries: 最大條目數
            
        Returns:
            對話歷史列表
        """
        if not self.conversation_history:
            return []
        
        return self.conversation_history[-max_entries:]
    
    def save_conversation(self, filepath: str = None) -> Optional[str]:
        """
        保存對話記錄
        
        Args:
            filepath: 文件路徑
            
        Returns:
            保存的文件路徑，如果失敗則返回None
        """
        if not self.conversation_history:
            self.logger.warning("沒有對話歷史可保存")
            return None
        
        if not filepath:
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            filepath = f"conversation_{timestamp}.json"
        
        try:
            data = {
                "metadata": {
                    "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                    "total_turns": self.conversation_turn,
                    "simulate_mode": self.simulate_mode
                },
                "conversation": self.conversation_history
            }
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            self.logger.info(f"對話記錄已保存: {filepath}")
            return filepath
            
        except Exception as e:
            self.logger.error(f"保存對話記錄失敗: {e}")
            return None
    
    def get_status(self) -> Dict[str, Any]:
        """獲取模塊狀態"""
        # 獲取各子模塊狀態
        speech_status = self.speech_recognizer.get_status()
        rag_status = self.rag_interface.get_status()
        synthesis_status = self.speech_synthesizer.get_status()
        
        return {
            "main_module": {
                "is_running": self.is_running,
                "conversation_turn": self.conversation_turn,
                "history_length": len(self.conversation_history),
                "simulate_mode": self.simulate_mode
            },
            "speech_recognition": speech_status,
            "rag_interface": rag_status,
            "speech_synthesis": synthesis_status
        }


def test_voice_dialogue():
    """測試語音對話模塊"""
    print("測試語音對話模塊...")
    
    # 創配置
    config = {
        "simulate_mode": True,
        "auto_start": False,
        "max_conversation_turns": 5,
        
        "speech_recognition": {
            "language": "zh-CN",
            "simulate_mode": True
        },
        
        "rag_interface": {
            "rag_system_path": ".",
            "simulate_mode": True
        },
        
        "speech_synthesis": {
            "language": "zh",
            "rate": 150,
            "simulate_mode": True,
            "output_dir": "test_audio"
        }
    }
    
    # 創建語音對話模塊
    dialogue = VoiceDialogueModule(config)
    
    # 檢查狀態
    status = dialogue.get_status()
    print(f"模塊狀態: {json.dumps(status, indent=2, ensure_ascii=False)}")
    
    # 開始對話
    print("\n開始對話...")
    if dialogue.start_conversation():
        print("對話已開始")
        
        # 等待歡迎語音
        time.sleep(3)
        
        # 發送測試輸入
        test_inputs = [
            "請分析這個項目",
            "代碼質量怎麼樣",
            "謝謝你的幫助"
        ]
        
        for i, input_text in enumerate(test_inputs, 1):
            print(f"\n測試輸入 {i}: {input_text}")
            dialogue.send_text_input(input_text)
            
            # 等待處理
            time.sleep(5)
            
            # 檢查狀態
            summary = dialogue.get_conversation_summary()
            print(f"對話狀態: 輪次={summary['conversation_turn']}, 處理中={summary['is_processing']}")
        
        # 獲取對話歷史
        print("\n對話歷史:")
        history = dialogue.get_conversation_history()
        for entry in history:
            print(f"{entry['timestamp']} [{entry['role']}]: {entry['content'][:50]}...")
        
        # 保存對話記錄
        saved_file = dialogue.save_conversation()
        if saved_file:
            print(f"對話記錄已保存到: {saved_file}")
        
        # 停止對話
        print("\n停止對話...")
        dialogue.stop_conversation()
        time.sleep(2)
        
    else:
        print("啟動對話失敗")
    
    print("\n語音對話模塊測試完成")


if __name__ == "__main__":
    test_voice_dialogue()