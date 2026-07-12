#!/usr/bin/env python3
"""
配置加載器
加載和管理語音對話模塊的配置
"""

import os
import sys
import json
import yaml
from pathlib import Path
from typing import Dict, Any, Optional, Union
import logging

class ConfigLoader:
    """配置加載器"""
    
    def __init__(self, config_path: str = None):
        """
        初始化配置加載器
        
        Args:
            config_path: 配置文件路徑
        """
        self.logger = logging.getLogger(__name__)
        self.config_path = config_path
        self.config = {}
        self.default_config = self._get_default_config()
        
        # 加載配置
        self.load_config()
    
    def _get_default_config(self) -> Dict[str, Any]:
        """獲取默認配置"""
        return {
            "main": {
                "simulate_mode": True,
                "auto_start": False,
                "max_conversation_turns": 20,
                "log_level": "INFO",
                "log_file": "voice_dialogue.log",
                "enable_console_log": True,
                "processing_timeout": 30,
                "audio_cache_size": 10,
                "save_conversations": True,
                "conversation_history_dir": "conversations"
            },
            "speech_recognition": {
                "language": "zh-CN",
                "simulate_mode": True,
                "device_index": None,
                "sample_rate": 16000,
                "chunk_size": 1024,
                "energy_threshold": 300,
                "timeout": 5,
                "phrase_time_limit": 10,
                "pause_threshold": 0.8,
                "dynamic_energy_threshold": True,
                "adjust_for_ambient_noise": True,
                "ambient_duration": 1.0
            },
            "rag_interface": {
                "rag_system_path": ".",
                "simulate_mode": True,
                "timeout": 30,
                "max_retries": 3,
                "max_query_length": 500,
                "enable_context": True,
                "context_size": 3,
                "enable_cache": True,
                "cache_size": 100,
                "cache_ttl": 3600
            },
            "speech_synthesis": {
                "language": "zh",
                "simulate_mode": True,
                "rate": 150,
                "volume": 0.9,
                "voice": "default",
                "output_dir": "audio_output",
                "keep_audio_files": False,
                "audio_format": "mp3",
                "engine_priority": ["pyttsx3", "gtts", "system"]
            },
            "dialogue_management": {
                "enable_welcome": True,
                "enable_goodbye": True,
                "enable_notifications": True,
                "listening_timeout": 60,
                "speaking_timeout": 30,
                "max_errors": 5,
                "error_cooldown": 10,
                "response_delay": 0.5,
                "thinking_indicator": True
            },
            "error_handling": {
                "log_errors": True,
                "show_user_errors": True,
                "auto_recover": True,
                "max_retries": 3,
                "retry_delay": 2.0,
                "exponential_backoff": True,
                "handle_timeout": True,
                "handle_network": True,
                "handle_audio": True
            }
        }
    
    def load_config(self, config_path: str = None) -> bool:
        """
        加載配置文件
        
        Args:
            config_path: 配置文件路徑
            
        Returns:
            是否加載成功
        """
        if config_path:
            self.config_path = config_path
        
        # 如果沒有指定配置文件，使用默認配置
        if not self.config_path:
            self.config = self.default_config.copy()
            self.logger.info("使用默認配置")
            return True
        
        # 檢查配置文件是否存在
        if not os.path.exists(self.config_path):
            self.logger.warning(f"配置文件不存在: {self.config_path}，使用默認配置")
            self.config = self.default_config.copy()
            return False
        
        try:
            # 根據文件擴展名選擇加載方式
            file_ext = os.path.splitext(self.config_path)[1].lower()
            
            if file_ext in ['.yaml', '.yml']:
                self._load_yaml_config()
            elif file_ext == '.json':
                self._load_json_config()
            else:
                self.logger.error(f"不支持的配置文件格式: {file_ext}")
                return False
            
            # 合併默認配置（確保所有必要的配置項都存在）
            self._merge_with_defaults()
            
            self.logger.info(f"配置文件加載成功: {self.config_path}")
            return True
            
        except Exception as e:
            self.logger.error(f"加載配置文件失敗: {e}")
            self.config = self.default_config.copy()
            return False
    
    def _load_yaml_config(self) -> None:
        """加載YAML配置文件"""
        with open(self.config_path, 'r', encoding='utf-8') as f:
            loaded_config = yaml.safe_load(f)
        
        if loaded_config:
            self.config = loaded_config
    
    def _load_json_config(self) -> None:
        """加載JSON配置文件"""
        with open(self.config_path, 'r', encoding='utf-8') as f:
            loaded_config = json.load(f)
        
        if loaded_config:
            self.config = loaded_config
    
    def _merge_with_defaults(self) -> None:
        """合併加載的配置和默認配置"""
        def deep_merge(default: Dict, custom: Dict) -> Dict:
            """深度合併兩個字典"""
            result = default.copy()
            
            for key, value in custom.items():
                if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                    result[key] = deep_merge(result[key], value)
                else:
                    result[key] = value
            
            return result
        
        self.config = deep_merge(self.default_config, self.config)
    
    def get_config(self, section: str = None, key: str = None) -> Any:
        """
        獲取配置值
        
        Args:
            section: 配置部分
            key: 配置鍵
            
        Returns:
            配置值
        """
        if not self.config:
            self.load_config()
        
        if section is None:
            return self.config
        
        if section not in self.config:
            self.logger.warning(f"配置部分不存在: {section}")
            return None
        
        if key is None:
            return self.config[section]
        
        if key not in self.config[section]:
            self.logger.warning(f"配置鍵不存在: {section}.{key}")
            return None
        
        return self.config[section][key]
    
    def set_config(self, section: str, key: str, value: Any) -> bool:
        """
        設置配置值
        
        Args:
            section: 配置部分
            key: 配置鍵
            value: 配置值
            
        Returns:
            是否設置成功
        """
        if section not in self.config:
            self.config[section] = {}
        
        self.config[section][key] = value
        return True
    
    def save_config(self, config_path: str = None) -> bool:
        """
        保存配置到文件
        
        Args:
            config_path: 配置文件路徑
            
        Returns:
            是否保存成功
        """
        if config_path:
            self.config_path = config_path
        
        if not self.config_path:
            self.logger.error("未指定配置文件路徑")
            return False
        
        try:
            # 創建目錄（如果不存在）
            os.makedirs(os.path.dirname(os.path.abspath(self.config_path)), exist_ok=True)
            
            # 根據文件擴展名選擇保存格式
            file_ext = os.path.splitext(self.config_path)[1].lower()
            
            if file_ext in ['.yaml', '.yml']:
                self._save_yaml_config()
            elif file_ext == '.json':
                self._save_json_config()
            else:
                # 默認使用YAML格式
                if not self.config_path.endswith('.yaml'):
                    self.config_path += '.yaml'
                self._save_yaml_config()
            
            self.logger.info(f"配置文件保存成功: {self.config_path}")
            return True
            
        except Exception as e:
            self.logger.error(f"保存配置文件失敗: {e}")
            return False
    
    def _save_yaml_config(self) -> None:
        """保存為YAML格式"""
        with open(self.config_path, 'w', encoding='utf-8') as f:
            yaml.dump(self.config, f, default_flow_style=False, allow_unicode=True)
    
    def _save_json_config(self) -> None:
        """保存為JSON格式"""
        with open(self.config_path, 'w', encoding='utf-8') as f:
            json.dump(self.config, f, indent=2, ensure_ascii=False)
    
    def validate_config(self) -> Dict[str, Any]:
        """
        驗證配置
        
        Returns:
            驗證結果
        """
        errors = []
        warnings = []
        
        # 驗證主配置
        main_config = self.get_config("main")
        if not main_config:
            errors.append("主配置缺失")
        
        # 驗證必要配置項
        required_sections = ["speech_recognition", "rag_interface", "speech_synthesis"]
        for section in required_sections:
            if section not in self.config:
                errors.append(f"必要配置部分缺失: {section}")
        
        # 檢查模擬模式
        if self.get_config("main", "simulate_mode"):
            warnings.append("運行在模擬模式，部分功能可能受限")
        
        # 檢查路徑配置
        rag_path = self.get_config("rag_interface", "rag_system_path")
        if rag_path and not os.path.exists(rag_path):
            warnings.append(f"RAG系統路徑不存在: {rag_path}")
        
        # 檢查輸出目錄
        output_dir = self.get_config("speech_synthesis", "output_dir")
        if output_dir:
            try:
                os.makedirs(output_dir, exist_ok=True)
            except Exception as e:
                errors.append(f"無法創建輸出目錄 {output_dir}: {e}")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "config_sections": list(self.config.keys())
        }
    
    def create_sample_config(self, config_path: str) -> bool:
        """
        創建示例配置文件
        
        Args:
            config_path: 配置文件路徑
            
        Returns:
            是否創建成功
        """
        try:
            # 使用默認配置作為示例
            sample_config = self.default_config.copy()
            
            # 添加註釋（YAML格式）
            if config_path.endswith('.yaml') or config_path.endswith('.yml'):
                with open(config_path, 'w', encoding='utf-8') as f:
                    f.write("# 語音對話模塊示例配置文件\n")
                    f.write("# 請根據需要修改以下配置\n\n")
                    yaml.dump(sample_config, f, default_flow_style=False, allow_unicode=True)
            
            # 添加註釋（JSON格式）
            elif config_path.endswith('.json'):
                with open(config_path, 'w', encoding='utf-8') as f:
                    f.write("// 語音對話模塊示例配置文件\n")
                    f.write("// 請根據需要修改以下配置\n\n")
                    json.dump(sample_config, f, indent=2, ensure_ascii=False)
            
            else:
                # 默認使用YAML格式
                config_path = config_path + '.yaml'
                with open(config_path, 'w', encoding='utf-8') as f:
                    f.write("# 語音對話模塊示例配置文件\n")
                    f.write("# 請根據需要修改以下配置\n\n")
                    yaml.dump(sample_config, f, default_flow_style=False, allow_unicode=True)
            
            self.logger.info(f"示例配置文件已創建: {config_path}")
            return True
            
        except Exception as e:
            self.logger.error(f"創建示例配置文件失敗: {e}")
            return False


def test_config_loader():
    """測試配置加載器"""
    import tempfile
    
    print("測試配置加載器...")
    
    # 創建臨時配置文件
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
        config_content = """
main:
  simulate_mode: false
  auto_start: true
  
speech_recognition:
  language: "en-US"
  
rag_interface:
  rag_system_path: "/path/to/rag"
  
speech_synthesis:
  rate: 200
"""
        f.write(config_content)
        config_file = f.name
    
    try:
        # 測試加載配置
        loader = ConfigLoader(config_file)
        
        # 獲取配置
        main_config = loader.get_config("main")
        print(f"主配置: {json.dumps(main_config, indent=2)}")
        
        # 獲取特定值
        simulate_mode = loader.get_config("main", "simulate_mode")
        print(f"模擬模式: {simulate_mode}")
        
        # 設置配置
        loader.set_config("main", "max_conversation_turns", 50)
        new_turns = loader.get_config("main", "max_conversation_turns")
        print(f"設置後的對話輪次: {new_turns}")
        
        # 驗證配置
        validation = loader.validate_config()
        print(f"配置驗證: {json.dumps(validation, indent=2)}")
        
        # 測試保存配置
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            save_file = f.name
        
        if loader.save_config(save_file):
            print(f"配置已保存到: {save_file}")
            
            # 檢查保存的文件
            with open(save_file, 'r') as f:
                saved_content = json.load(f)
                print(f"保存的配置內容: {json.dumps(saved_content['main'], indent=2)}")
        
        # 測試創建示例配置
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
            sample_file = f.name
        
        if loader.create_sample_config(sample_file):
            print(f"示例配置已創建: {sample_file}")
            
    finally:
        # 清理臨時文件
        for file in [config_file, save_file, sample_file]:
            if 'file' in locals() and os.path.exists(file):
                os.unlink(file)
    
    print("\n配置加載器測試完成")


if __name__ == "__main__":
    test_config_loader()