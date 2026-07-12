#!/usr/bin/env python3
"""
語音識別模塊
實現實時語音轉文字功能
支持麥克風輸入和音頻文件處理
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

# 嘗試導入語音識別庫
try:
    import speech_recognition as sr
    SPEECH_RECOGNITION_AVAILABLE = True
except ImportError:
    SPEECH_RECOGNITION_AVAILABLE = False
    print("警告: speech_recognition 庫未安裝，語音識別功能將不可用")

# 嘗試導入音頻處理庫
try:
    import pyaudio
    import wave
    PYAUDIO_AVAILABLE = True
except ImportError:
    PYAUDIO_AVAILABLE = False
    print("警告: pyaudio 庫未安裝，麥克風輸入功能將不可用")

class SpeechRecognitionModule:
    """語音識別模塊"""
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        初始化語音識別模塊
        
        Args:
            config: 配置字典，包含語音識別參數
        """
        self.config = config or {}
        self.logger = self._setup_logger()
        
        # 語音識別配置
        self.language = self.config.get("language", "zh-CN")
        self.energy_threshold = self.config.get("energy_threshold", 300)
        self.timeout = self.config.get("timeout", 5)
        self.phrase_time_limit = self.config.get("phrase_time_limit", 10)
        self.pause_threshold = self.config.get("pause_threshold", 0.8)
        
        # 麥克風配置
        self.device_index = self.config.get("device_index", None)
        self.sample_rate = self.config.get("sample_rate", 16000)
        self.chunk_size = self.config.get("chunk_size", 1024)
        
        # 狀態變量
        self.recognizer = None
        self.microphone = None
        self.is_listening = False
        self.audio_queue = queue.Queue()
        self.callback_queue = queue.Queue()
        
        # 初始化語音識別器
        self._initialize_recognizer()
        
        self.logger.info(f"語音識別模塊初始化完成，語言: {self.language}")
    
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
    
    def _initialize_recognizer(self) -> None:
        """初始化語音識別器"""
        if not SPEECH_RECOGNITION_AVAILABLE:
            self.logger.error("speech_recognition 庫未安裝，無法初始化語音識別器")
            return
        
        try:
            self.recognizer = sr.Recognizer()
            self.recognizer.energy_threshold = self.energy_threshold
            self.recognizer.dynamic_energy_threshold = True
            self.recognizer.pause_threshold = self.pause_threshold
            
            # 初始化麥克風
            if PYAUDIO_AVAILABLE:
                self.microphone = sr.Microphone(device_index=self.device_index,
                                               sample_rate=self.sample_rate)
                # 調整環境噪音
                with self.microphone as source:
                    self.recognizer.adjust_for_ambient_noise(source, duration=1)
                    self.logger.info(f"環境噪音調整完成，能量閾值: {self.recognizer.energy_threshold}")
            
            self.logger.info("語音識別器初始化成功")
            
        except Exception as e:
            self.logger.error(f"初始化語音識別器失敗: {e}")
            self.recognizer = None
    
    def recognize_from_microphone(self, timeout: int = None, 
                                 phrase_time_limit: int = None) -> Optional[str]:
        """
        從麥克風識別語音
        
        Args:
            timeout: 超時時間（秒）
            phrase_time_limit: 短語時間限制（秒）
            
        Returns:
            識別出的文本，如果失敗則返回None
        """
        if not self.recognizer or not self.microphone:
            self.logger.error("語音識別器或麥克風未初始化")
            return None
        
        timeout = timeout or self.timeout
        phrase_time_limit = phrase_time_limit or self.phrase_time_limit
        
        try:
            self.logger.info("正在聆聽...（請說話）")
            
            with self.microphone as source:
                audio = self.recognizer.listen(
                    source,
                    timeout=timeout,
                    phrase_time_limit=phrase_time_limit
                )
            
            self.logger.info("語音錄製完成，正在識別...")
            return self._recognize_audio(audio)
            
        except sr.WaitTimeoutError:
            self.logger.warning("聆聽超時，未檢測到語音")
            return None
        except sr.RequestError as e:
            self.logger.error(f"語音識別服務請求失敗: {e}")
            return None
        except sr.UnknownValueError:
            self.logger.warning("無法識別語音內容")
            return None
        except Exception as e:
            self.logger.error(f"語音識別過程中發生錯誤: {e}")
            return None
    
    def recognize_from_file(self, audio_file_path: str) -> Optional[str]:
        """
        從音頻文件識別語音
        
        Args:
            audio_file_path: 音頻文件路徑
            
        Returns:
            識別出的文本，如果失敗則返回None
        """
        if not self.recognizer:
            self.logger.error("語音識別器未初始化")
            return None
        
        if not os.path.exists(audio_file_path):
            self.logger.error(f"音頻文件不存在: {audio_file_path}")
            return None
        
        try:
            self.logger.info(f"從文件識別語音: {audio_file_path}")
            
            with sr.AudioFile(audio_file_path) as source:
                audio = self.recognizer.record(source)
            
            return self._recognize_audio(audio)
            
        except Exception as e:
            self.logger.error(f"從文件識別語音失敗: {e}")
            return None
    
    def _recognize_audio(self, audio: sr.AudioData) -> Optional[str]:
        """
        識別音頻數據
        
        Args:
            audio: 音頻數據
            
        Returns:
            識別出的文本
        """
        if not self.recognizer:
            return None
        
        try:
            # 嘗試使用Google語音識別
            text = self.recognizer.recognize_google(
                audio,
                language=self.language
            )
            
            self.logger.info(f"語音識別成功: {text}")
            return text
            
        except sr.UnknownValueError:
            self.logger.warning("Google語音識別無法理解音頻")
            
            # 嘗試其他識別引擎
            return self._try_alternative_recognition(audio)
            
        except sr.RequestError as e:
            self.logger.error(f"Google語音識別服務錯誤: {e}")
            return None
    
    def _try_alternative_recognition(self, audio: sr.AudioData) -> Optional[str]:
        """嘗試其他語音識別引擎"""
        alternatives = []
        
        # 可以添加其他語音識別引擎的嘗試
        # 例如: recognize_sphinx (離線), recognize_bing, recognize_whisper等
        
        self.logger.info("嘗試其他語音識別引擎...")
        
        # 這裡可以實現降級策略
        # 目前返回None，實際應用中可以實現離線識別
        
        return None
    
    def start_continuous_listening(self, callback: Callable[[str], None]) -> bool:
        """
        開始連續聆聽模式
        
        Args:
            callback: 識別到語音時的回調函數
            
        Returns:
            是否成功啟動
        """
        if not self.recognizer or not self.microphone:
            self.logger.error("語音識別器或麥克風未初始化")
            return False
        
        if self.is_listening:
            self.logger.warning("已經在連續聆聽模式中")
            return False
        
        self.is_listening = True
        self.callback_queue.put(callback)
        
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
        callback = self.callback_queue.get()
        
        while self.is_listening:
            try:
                text = self.recognize_from_microphone()
                if text and callback:
                    callback(text)
                
                # 短暫暫停避免CPU過載
                time.sleep(0.1)
                
            except Exception as e:
                self.logger.error(f"連續聆聽過程中發生錯誤: {e}")
                time.sleep(1)  # 錯誤後等待1秒再重試
    
    def stop_continuous_listening(self) -> None:
        """停止連續聆聽模式"""
        self.is_listening = False
        self.logger.info("連續聆聽模式已停止")
    
    def record_audio(self, duration: int = 5, output_path: str = None) -> Optional[str]:
        """
        錄製音頻
        
        Args:
            duration: 錄製時長（秒）
            output_path: 輸出文件路徑
            
        Returns:
            錄製的音頻文件路徑，如果失敗則返回None
        """
        if not PYAUDIO_AVAILABLE:
            self.logger.error("pyaudio 庫未安裝，無法錄製音頻")
            return None
        
        if not output_path:
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            output_path = f"recording_{timestamp}.wav"
        
        try:
            audio = pyaudio.PyAudio()
            
            # 打開音頻流
            stream = audio.open(
                format=pyaudio.paInt16,
                channels=1,
                rate=self.sample_rate,
                input=True,
                frames_per_buffer=self.chunk_size
            )
            
            self.logger.info(f"開始錄製音頻，時長: {duration}秒")
            frames = []
            
            # 錄製音頻
            for i in range(0, int(self.sample_rate / self.chunk_size * duration)):
                data = stream.read(self.chunk_size)
                frames.append(data)
            
            # 停止錄製
            stream.stop_stream()
            stream.close()
            audio.terminate()
            
            # 保存音頻文件
            with wave.open(output_path, 'wb') as wf:
                wf.setnchannels(1)
                wf.setsampwidth(audio.get_sample_size(pyaudio.paInt16))
                wf.setframerate(self.sample_rate)
                wf.writeframes(b''.join(frames))
            
            self.logger.info(f"音頻錄製完成，保存到: {output_path}")
            return output_path
            
        except Exception as e:
            self.logger.error(f"錄製音頻失敗: {e}")
            return None
    
    def get_available_microphones(self) -> List[Dict[str, Any]]:
        """
        獲取可用的麥克風設備
        
        Returns:
            麥克風設備列表
        """
        if not PYAUDIO_AVAILABLE:
            return []
        
        try:
            audio = pyaudio.PyAudio()
            devices = []
            
            for i in range(audio.get_device_count()):
                device_info = audio.get_device_info_by_index(i)
                if device_info['maxInputChannels'] > 0:
                    devices.append({
                        'index': i,
                        'name': device_info['name'],
                        'channels': device_info['maxInputChannels'],
                        'sample_rate': int(device_info['defaultSampleRate'])
                    })
            
            audio.terminate()
            return devices
            
        except Exception as e:
            self.logger.error(f"獲取麥克風設備失敗: {e}")
            return []
    
    def get_status(self) -> Dict[str, Any]:
        """
        獲取模塊狀態
        
        Returns:
            狀態信息字典
        """
        return {
            "initialized": self.recognizer is not None,
            "microphone_available": self.microphone is not None,
            "is_listening": self.is_listening,
            "language": self.language,
            "energy_threshold": self.energy_threshold,
            "available_microphones": len(self.get_available_microphones()),
            "speech_recognition_available": SPEECH_RECOGNITION_AVAILABLE,
            "pyaudio_available": PYAUDIO_AVAILABLE
        }


def test_speech_recognition():
    """測試語音識別功能"""
    print("測試語音識別模塊...")
    
    # 創配置
    config = {
        "language": "zh-CN",
        "energy_threshold": 300,
        "timeout": 5,
        "phrase_time_limit": 10
    }
    
    # 創建語音識別模塊
    recognizer = SpeechRecognitionModule(config)
    
    # 檢查狀態
    status = recognizer.get_status()
    print(f"模塊狀態: {json.dumps(status, indent=2, ensure_ascii=False)}")
    
    if not status["initialized"]:
        print("語音識別模塊初始化失敗，跳過測試")
        return
    
    # 測試麥克風列表
    mics = recognizer.get_available_microphones()
    print(f"可用麥克風: {len(mics)} 個")
    for mic in mics:
        print(f"  - {mic['index']}: {mic['name']}")
    
    # 測試語音識別
    print("\n請說話（5秒內）...")
    text = recognizer.recognize_from_microphone()
    
    if text:
        print(f"識別結果: {text}")
    else:
        print("未識別到語音或識別失敗")
    
    # 測試連續聆聽模式
    def callback(recognized_text):
        print(f"連續聆聽識別到: {recognized_text}")
    
    print("\n測試連續聆聽模式（按Ctrl+C停止）...")
    try:
        recognizer.start_continuous_listening(callback)
        time.sleep(10)  # 聆聽10秒
        recognizer.stop_continuous_listening()
    except KeyboardInterrupt:
        recognizer.stop_continuous_listening()
        print("\n連續聆聽已停止")
    
    print("\n語音識別測試完成")


if __name__ == "__main__":
    test_speech_recognition()