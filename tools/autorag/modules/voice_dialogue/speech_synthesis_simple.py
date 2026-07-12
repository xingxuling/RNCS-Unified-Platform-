#!/usr/bin/env python3
"""
簡化版語音合成模塊
實現文本轉語音功能
支持多種語音引擎和輸出格式
"""

import os
import sys
import time
import tempfile
import threading
import queue
from pathlib import Path
from typing import Dict, Any, Optional, Callable, List
import logging

class SpeechSynthesisSimple:
    """簡化版語音合成模塊"""
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        初始化語音合成模塊
        
        Args:
            config: 配置字典
        """
        self.config = config or {}
        self.logger = self._setup_logger()
        
        # 配置參數
        self.language = self.config.get("language", "zh")
        self.rate = self.config.get("rate", 150)  # 語速
        self.volume = self.config.get("volume", 0.9)  # 音量
        self.voice = self.config.get("voice", "default")
        self.simulate_mode = self.config.get("simulate_mode", True)
        
        # 輸出配置
        self.output_dir = self.config.get("output_dir", "audio_output")
        self.keep_audio_files = self.config.get("keep_audio_files", False)
        
        # 狀態變量
        self.is_speaking = False
        self.audio_queue = queue.Queue()
        self.current_audio_file = None
        
        # 檢查依賴
        self._check_dependencies()
        
        # 創建輸出目錄
        os.makedirs(self.output_dir, exist_ok=True)
        
        self.logger.info(f"語音合成模塊初始化完成，語言: {self.language}")
    
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
            "pyttsx3": False,
            "gtts": False,
            "playsound": False
        }
        
        try:
            import pyttsx3
            self.dependencies["pyttsx3"] = True
            self.logger.info("pyttsx3 庫可用")
        except ImportError:
            self.logger.warning("pyttsx3 庫未安裝，部分語音合成功能受限")
        
        try:
            from gtts import gTTS
            self.dependencies["gtts"] = True
            self.logger.info("gTTS 庫可用")
        except ImportError:
            self.logger.warning("gTTS 庫未安裝，Google TTS功能不可用")
        
        try:
            import playsound
            self.dependencies["playsound"] = True
            self.logger.info("playsound 庫可用")
        except ImportError:
            self.logger.warning("playsound 庫未安裝，音頻播放功能受限")
    
    def speak(self, text: str, blocking: bool = True) -> Optional[str]:
        """
        將文本轉換為語音並播放
        
        Args:
            text: 要轉換的文本
            blocking: 是否阻塞直到播放完成
            
        Returns:
            音頻文件路徑，如果失敗則返回None
        """
        if self.simulate_mode:
            return self._simulate_speech(text, blocking)
        
        # 嘗試不同的語音合成引擎
        methods = [
            self._speak_with_pyttsx3,
            self._speak_with_gtts,
            self._speak_with_system
        ]
        
        for method in methods:
            try:
                audio_file = method(text)
                if audio_file and blocking:
                    self._play_audio(audio_file)
                return audio_file
            except Exception as e:
                self.logger.warning(f"語音合成方法失敗: {e}")
                continue
        
        # 所有方法都失敗，使用模擬模式
        self.logger.warning("所有語音合成方法都失敗了，使用模擬模式")
        return self._simulate_speech(text, blocking)
    
    def _speak_with_pyttsx3(self, text: str) -> Optional[str]:
        """使用pyttsx3進行語音合成"""
        if not self.dependencies["pyttsx3"]:
            raise ImportError("pyttsx3 庫未安裝")
        
        try:
            import pyttsx3
            
            # 初始化引擎
            engine = pyttsx3.init()
            
            # 設置參數
            engine.setProperty('rate', self.rate)
            engine.setProperty('volume', self.volume)
            
            # 設置語言（如果支持）
            try:
                voices = engine.getProperty('voices')
                if voices:
                    # 嘗試找到中文語音
                    for voice in voices:
                        if 'chinese' in voice.name.lower() or 'zh' in voice.name.lower():
                            engine.setProperty('voice', voice.id)
                            break
            except:
                pass  # 忽略語音設置錯誤
            
            # 生成音頻文件
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            audio_file = os.path.join(self.output_dir, f"speech_{timestamp}.mp3")
            
            # 保存到文件
            engine.save_to_file(text, audio_file)
            engine.runAndWait()
            
            self.logger.info(f"pyttsx3語音合成完成: {audio_file}")
            return audio_file
            
        except Exception as e:
            self.logger.error(f"pyttsx3語音合成失敗: {e}")
            raise
    
    def _speak_with_gtts(self, text: str) -> Optional[str]:
        """使用gTTS（Google Text-to-Speech）進行語音合成"""
        if not self.dependencies["gtts"]:
            raise ImportError("gTTS 庫未安裝")
        
        try:
            from gtts import gTTS
            
            # 創建gTTS對象
            tts = gTTS(text=text, lang=self.language, slow=False)
            
            # 生成音頻文件
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            audio_file = os.path.join(self.output_dir, f"speech_{timestamp}.mp3")
            
            # 保存音頻文件
            tts.save(audio_file)
            
            self.logger.info(f"gTTS語音合成完成: {audio_file}")
            return audio_file
            
        except Exception as e:
            self.logger.error(f"gTTS語音合成失敗: {e}")
            raise
    
    def _speak_with_system(self, text: str) -> Optional[str]:
        """使用系統命令進行語音合成"""
        # 這是一個備用方法，使用系統的文本轉語音命令
        # 不同系統有不同的命令
        
        system = sys.platform.lower()
        
        if system.startswith('win'):
            # Windows系統
            try:
                import win32com.client
                speaker = win32com.client.Dispatch("SAPI.SpVoice")
                speaker.Speak(text)
                self.logger.info("使用Windows SAPI進行語音合成")
                return None  # Windows SAPI不生成文件
            except:
                pass
                
        elif system.startswith('darwin'):
            # macOS系統
            try:
                # 使用say命令
                import subprocess
                subprocess.run(['say', text])
                self.logger.info("使用macOS say命令進行語音合成")
                return None
            except:
                pass
                
        elif system.startswith('linux'):
            # Linux系統
            try:
                # 嘗試使用espeak
                import subprocess
                
                # 生成音頻文件
                timestamp = time.strftime("%Y%m%d_%H%M%S")
                audio_file = os.path.join(self.output_dir, f"speech_{timestamp}.wav")
                
                # 使用espeak生成音頻
                cmd = ['espeak', '-v', 'zh', text, '--stdout']
                result = subprocess.run(cmd, capture_output=True)
                
                if result.returncode == 0:
                    with open(audio_file, 'wb') as f:
                        f.write(result.stdout)
                    self.logger.info(f"espeak語音合成完成: {audio_file}")
                    return audio_file
            except:
                pass
        
        raise Exception("系統語音合成不可用")
    
    def _play_audio(self, audio_file: str) -> bool:
        """
        播放音頻文件
        
        Args:
            audio_file: 音頻文件路徑
            
        Returns:
            是否播放成功
        """
        if not os.path.exists(audio_file):
            self.logger.error(f"音頻文件不存在: {audio_file}")
            return False
        
        if self.simulate_mode:
            self.logger.info(f"模擬播放音頻: {audio_file}")
            time.sleep(2)  # 模擬播放時間
            return True
        
        # 嘗試使用playsound播放
        if self.dependencies["playsound"]:
            try:
                import playsound
                playsound.playsound(audio_file)
                self.logger.info(f"播放音頻完成: {audio_file}")
                return True
            except Exception as e:
                self.logger.error(f"playsound播放失敗: {e}")
        
        # 嘗試使用系統命令播放
        system = sys.platform.lower()
        
        try:
            if system.startswith('win'):
                import subprocess
                subprocess.run(['start', audio_file], shell=True)
            elif system.startswith('darwin'):
                import subprocess
                subprocess.run(['afplay', audio_file])
            elif system.startswith('linux'):
                import subprocess
                subprocess.run(['aplay', audio_file])
            
            self.logger.info(f"系統命令播放音頻: {audio_file}")
            return True
            
        except Exception as e:
            self.logger.error(f"系統命令播放失敗: {e}")
            return False
    
    def _simulate_speech(self, text: str, blocking: bool = True) -> Optional[str]:
        """模擬語音合成（用於測試）"""
        self.logger.info(f"模擬語音合成: {text[:50]}...")
        
        # 創建模擬音頻文件
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        audio_file = os.path.join(self.output_dir, f"simulated_{timestamp}.txt")
        
        # 保存文本到文件（模擬音頻文件）
        with open(audio_file, 'w', encoding='utf-8') as f:
            f.write(f"模擬語音內容: {text}\n")
            f.write(f"生成時間: {timestamp}\n")
            f.write(f"文本長度: {len(text)} 字符\n")
        
        if blocking:
            # 模擬播放時間（基於文本長度）
            sleep_time = min(len(text) / 50, 5)  # 最多5秒
            self.logger.info(f"模擬播放 {sleep_time:.1f} 秒...")
            time.sleep(sleep_time)
        
        self.logger.info(f"模擬語音合成完成: {audio_file}")
        return audio_file
    
    def speak_async(self, text: str, callback: Callable[[str], None] = None) -> None:
        """
        異步語音合成
        
        Args:
            text: 要轉換的文本
            callback: 完成後的回調函數
        """
        def async_worker():
            try:
                audio_file = self.speak(text, blocking=True)
                if callback and audio_file:
                    callback(audio_file)
            except Exception as e:
                self.logger.error(f"異步語音合成失敗: {e}")
        
        # 啟動工作線程
        thread = threading.Thread(target=async_worker, daemon=True)
        thread.start()
        
        self.logger.info(f"異步語音合成已啟動: {text[:30]}...")
    
    def stop_speaking(self) -> None:
        """停止當前語音播放"""
        self.is_speaking = False
        self.logger.info("語音播放已停止")
    
    def cleanup_old_files(self, max_age_hours: int = 24) -> int:
        """
        清理舊的音頻文件
        
        Args:
            max_age_hours: 最大保留時間（小時）
            
        Returns:
            刪除的文件數量
        """
        if not os.path.exists(self.output_dir):
            return 0
        
        deleted_count = 0
        current_time = time.time()
        max_age_seconds = max_age_hours * 3600
        
        for filename in os.listdir(self.output_dir):
            filepath = os.path.join(self.output_dir, filename)
            
            # 檢查文件年齡
            try:
                file_age = current_time - os.path.getmtime(filepath)
                if file_age > max_age_seconds:
                    os.remove(filepath)
                    deleted_count += 1
                    self.logger.debug(f"刪除舊文件: {filename}")
            except Exception as e:
                self.logger.error(f"清理文件失敗 {filename}: {e}")
        
        if deleted_count > 0:
            self.logger.info(f"清理完成，刪除了 {deleted_count} 個舊文件")
        
        return deleted_count
    
    def get_status(self) -> Dict[str, Any]:
        """獲取模塊狀態"""
        audio_files = []
        if os.path.exists(self.output_dir):
            audio_files = [f for f in os.listdir(self.output_dir) if f.endswith(('.mp3', '.wav', '.txt'))]
        
        return {
            "simulate_mode": self.simulate_mode,
            "is_speaking": self.is_speaking,
            "language": self.language,
            "rate": self.rate,
            "volume": self.volume,
            "output_dir": self.output_dir,
            "audio_file_count": len(audio_files),
            "dependencies": self.dependencies,
            "module": "SpeechSynthesisSimple"
        }


def test_speech_synthesis():
    """測試語音合成功能"""
    print("測試語音合成模塊...")
    
    # 創配置
    config = {
        "language": "zh",
        "rate": 150,
        "volume": 0.9,
        "simulate_mode": True,  # 使用模擬模式進行測試
        "output_dir": "test_audio"
    }
    
    # 創建語音合成模塊
    synthesizer = SpeechSynthesisSimple(config)
    
    # 檢查狀態
    status = synthesizer.get_status()
    print(f"模塊狀態: {json.dumps(status, indent=2, ensure_ascii=False)}")
    
    # 測試語音合成
    test_texts = [
        "你好，我是增強版RAG系統的語音助手",
        "我可以幫助您分析項目和代碼質量",
        "請告訴我您需要什麼幫助",
        "測試語音合成功能正常"
    ]
    
    for i, text in enumerate(test_texts, 1):
        print(f"\n測試 {i}: {text}")
        
        # 同步合成
        audio_file = synthesizer.speak(text, blocking=True)
        
        if audio_file:
            print(f"音頻文件: {audio_file}")
        else:
            print("語音合成失敗")
    
    # 測試異步合成
    def callback(audio_file):
        print(f"異步合成完成: {audio_file}")
    
    print("\n測試異步語音合成...")
    synthesizer.speak_async("這是異步語音合成測試", callback)
    time.sleep(3)  # 等待異步任務完成
    
    # 清理測試文件
    print("\n清理測試文件...")
    deleted = synthesizer.cleanup_old_files(max_age_hours=0)  # 刪除所有舊文件
    print(f"刪除了 {deleted} 個文件")
    
    print("\n語音合成測試完成")


if __name__ == "__main__":
    import json
    test_speech_synthesis()