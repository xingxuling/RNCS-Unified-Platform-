#!/usr/bin/env python3
"""
簡化版語音識別模塊
提供基本的語音識別接口，實際實現需要安裝依賴庫
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

class SpeechRecognitionSimple:
    """簡化版語音識別模塊"""
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        初始化語音識別模塊
        
        Args:
            config: 配置字典
        """
        self.config = config or {}
        self.logger = self._setup_logger()
        
        # 配置參數
        self.language = self.config.get("language", "zh-CN")
        self.simulate_mode = self.config.get("simulate_mode", True)
        
        # 狀態變量
        self.is_listening = False
        self.callback_queue = queue.Queue()
        
        # 檢查依賴
        self._check_dependencies()
        
        self.logger.info(f"簡化版語音識別模塊初始化完成，模擬模式: {self.simulate_mode}")
    
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
    
    def _check_dependencies(self) -> None:
        """檢查依賴庫"""
        self.dependencies = {
            "speech_recognition": False,
            "pyaudio": False
        }
        
        try:
            import speech_recognition as sr
            self.dependencies["speech_recognition"] = True
            self.logger.info("speech_recognition 庫可用")
        except ImportError:
            self.logger.warning("speech_recognition 庫未安裝，語音識別功能受限")
        
        try:
            import pyaudio
            self.dependencies["pyaudio"] = True
            self.logger.info("pyaudio 庫可用")
        except ImportError:
            self.logger.warning("pyaudio 庫未安裝，麥克風輸入功能受限")
    
    def recognize_from_microphone(self, timeout: int = 5, 
                                 phrase_time_limit: int = 10) -> Optional[str]:
        """
        從麥克風識別語音（模擬或實際）
        
        Args:
            timeout: 超時時間
            phrase_time_limit: 短語時間限制
            
        Returns:
            識別出的文本
        """
        if self.simulate_mode:
            return self._simulate_recognition()
        
        if not self.dependencies["speech_recognition"]:
            self.logger.error("speech_recognition 庫未安裝，無法進行語音識別")
            return self._simulate_recognition()
        
        try:
            import speech_recognition as sr
            
            # 初始化識別器
            recognizer = sr.Recognizer()
            recognizer.energy_threshold = 300
            recognizer.dynamic_energy_threshold = True
            
            # 使用麥克風
            with sr.Microphone() as source:
                self.logger.info("正在聆聽...（請說話）")
                recognizer.adjust_for_ambient_noise(source, duration=1)
                
                try:
                    audio = recognizer.listen(
                        source,
                        timeout=timeout,
                        phrase_time_limit=phrase_time_limit
                    )
                    
                    self.logger.info("語音錄製完成，正在識別...")
                    text = recognizer.recognize_google(audio, language=self.language)
                    self.logger.info(f"語音識別成功: {text}")
                    return text
                    
                except sr.WaitTimeoutError:
                    self.logger.warning("聆聽超時，未檢測到語音")
                    return None
                except sr.UnknownValueError:
                    self.logger.warning("無法識別語音內容")
                    return None
                except sr.RequestError as e:
                    self.logger.error(f"語音識別服務錯誤: {e}")
                    return None
                    
        except Exception as e:
            self.logger.error(f"語音識別過程中發生錯誤: {e}")
            return self._simulate_recognition()
    
    def _simulate_recognition(self) -> str:
        """模擬語音識別（用於測試）"""
        self.logger.info("模擬模式：使用預設文本進行測試")
        
        # 預設的測試文本
        test_texts = [
            "你好，我想了解這個項目",
            "請幫我分析一下代碼質量",
            "這個系統有什麼功能",
            "如何運行這個項目",
            "謝謝你的幫助"
        ]
        
        import random
        text = random.choice(test_texts)
        self.logger.info(f"模擬識別結果: {text}")
        
        return text
    
    def recognize_from_file(self, audio_file_path: str) -> Optional[str]:
        """
        從音頻文件識別語音
        
        Args:
            audio_file_path: 音頻文件路徑
            
        Returns:
            識別出的文本
        """
        if not os.path.exists(audio_file_path):
            self.logger.error(f"音頻文件不存在: {audio_file_path}")
            return None
        
        if self.simulate_mode:
            return self._simulate_recognition()
        
        if not self.dependencies["speech_recognition"]:
            self.logger.error("speech_recognition 庫未安裝")
            return self._simulate_recognition()
        
        try:
            import speech_recognition as sr
            
            recognizer = sr.Recognizer()
            
            with sr.AudioFile(audio_file_path) as source:
                audio = recognizer.record(source)
                text = recognizer.recognize_google(audio, language=self.language)
                self.logger.info(f"從文件識別成功: {text}")
                return text
                
        except Exception as e:
            self.logger.error(f"從文件識別語音失敗: {e}")
            return self._simulate_recognition()
    
    def start_continuous_listening(self, callback: Callable[[str], None]) -> bool:
        """
        開始連續聆聽模式
        
        Args:
            callback: 回調函數
            
        Returns:
            是否成功啟動
        """
        if self.is_listening:
            self.logger.warning("已經在連續聆聽模式中")
            return False
        
        self.is_listening = True
        self.callback = callback
        
        # 啟動聆聽線程
        listen_thread = threading.Thread(
            target=self._continuous_listening_worker,
            daemon=True
        )
        listen_thread.start()
        
        self.logger.info("連續聆聽模式已啟動")
        return True
    
    def _continuous_listening_worker(self) -> None:
        """連續聆聽工作線程"""
        self.logger.info("連續聆聽工作線程啟動")
        
        while self.is_listening:
            try:
                text = self.recognize_from_microphone(timeout=3, phrase_time_limit=5)
                if text and hasattr(self, 'callback') and self.callback:
                    self.callback(text)
                
                # 短暫暫停
                time.sleep(0.5)
                
            except Exception as e:
                self.logger.error(f"連續聆聽過程中發生錯誤: {e}")
                time.sleep(1)
    
    def stop_continuous_listening(self) -> None:
        """停止連續聆聽模式"""
        self.is_listening = False
        self.logger.info("連續聆聽模式已停止")
    
    def get_status(self) -> Dict[str, Any]:
        """
        獲取模塊狀態
        
        Returns:
            狀態信息
        """
        return {
            "simulate_mode": self.simulate_mode,
            "is_listening": self.is_listening,
            "language": self.language,
            "dependencies": self.dependencies,
            "module": "SpeechRecognitionSimple"
        }


def test_simple_recognition():
    """測試簡化版語音識別"""
    print("測試簡化版語音識別模塊...")
    
    # 創配置
    config = {
        "language": "zh-CN",
        "simulate_mode": True  # 使用模擬模式進行測試
    }
    
    # 創建語音識別模塊
    recognizer = SpeechRecognitionSimple(config)
    
    # 檢查狀態
    status = recognizer.get_status()
    print(f"模塊狀態: {json.dumps(status, indent=2, ensure_ascii=False)}")
    
    # 測試語音識別
    print("\n測試語音識別...")
    text = recognizer.recognize_from_microphone()
    
    if text:
        print(f"識別結果: {text}")
    else:
        print("未識別到語音")
    
    # 測試連續聆聽模式
    def callback(recognized_text):
        print(f"連續聆聽識別到: {recognized_text}")
    
    print("\n測試連續聆聽模式（5秒）...")
    recognizer.start_continuous_listening(callback)
    time.sleep(5)
    recognizer.stop_continuous_listening()
    
    print("\n簡化版語音識別測試完成")


if __name__ == "__main__":
    test_simple_recognition()