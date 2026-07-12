#!/usr/bin/env python3
"""
帝級以太語言系統
一個高級的多語言處理和對話數據壓縮系統
專為RAG人工智能系統設計
"""

import os
import json
import zlib
import hashlib
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
import re


class ImperialEtherLanguageSystem:
    """帝級以太語言系統"""
    
    def __init__(self, config_path: str = None):
        """
        初始化帝級以太語言系統
        
        Args:
            config_path: 配置文件路徑
        """
        self.config = self._load_config(config_path)
        self.cache_dir = Path(self.config.get("cache_dir", "~/.cache/imperial_ether"))
        self.cache_dir = Path(os.path.expanduser(str(self.cache_dir)))
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        # 初始化子系統
        self.compression_engine = CompressionEngine(self.config.get("compression", {}))
        self.language_processor = LanguageProcessor(self.config.get("language", {}))
        self.dialogue_analyzer = DialogueAnalyzer(self.config.get("dialogue", {}))
        
        # 統計信息
        self.stats = {
            "total_processed": 0,
            "compression_ratio": 0.0,
            "language_detections": 0,
            "dialogue_analyses": 0
        }
    
    def _load_config(self, config_path: str = None) -> Dict[str, Any]:
        """加載配置"""
        default_config = {
            "system_name": "帝級以太語言系統",
            "version": "1.0.0",
            "cache_dir": "~/.cache/imperial_ether",
            "compression": {
                "algorithm": "zlib",
                "level": 6,
                "enable_deduplication": True
            },
            "language": {
                "supported_languages": ["zh-CN", "en-US", "ja-JP", "ko-KR"],
                "default_language": "zh-CN",
                "enable_sentiment": True
            },
            "dialogue": {
                "max_history": 100,
                "enable_summarization": True,
                "enable_intent_detection": True,
                "enable_entity_extraction": True
            }
        }
        
        if config_path and os.path.exists(config_path):
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    user_config = json.load(f)
                    default_config.update(user_config)
            except Exception as e:
                print(f"⚠️  無法加載配置文件: {e}")
        
        return default_config
    
    def process_dialogue(self, dialogue_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        處理對話數據
        
        Args:
            dialogue_data: 對話數據，包含用戶輸入、系統響應等
            
        Returns:
            處理後的對話數據
        """
        self.stats["total_processed"] += 1
        
        # 1. 語言處理
        processed = self.language_processor.process(dialogue_data)
        
        # 2. 對話分析
        analyzed = self.dialogue_analyzer.analyze(processed)
        
        # 3. 壓縮存儲
        compressed = self.compression_engine.compress(analyzed)
        
        # 更新統計
        original_size = len(json.dumps(dialogue_data, ensure_ascii=False).encode('utf-8'))
        compressed_size = len(compressed["compressed_data"])
        if original_size > 0:
            ratio = compressed_size / original_size
            self.stats["compression_ratio"] = (self.stats["compression_ratio"] * (self.stats["total_processed"] - 1) + ratio) / self.stats["total_processed"]
        
        return {
            "original": dialogue_data,
            "processed": processed,
            "analyzed": analyzed,
            "compressed": compressed,
            "metadata": {
                "processing_time": datetime.now().isoformat(),
                "original_size": original_size,
                "compressed_size": compressed_size,
                "compression_ratio": ratio if original_size > 0 else 0.0
            }
        }
    
    def decompress_dialogue(self, compressed_data: bytes) -> Dict[str, Any]:
        """
        解壓縮對話數據
        
        Args:
            compressed_data: 壓縮的對話數據
            
        Returns:
            解壓縮後的對話數據
        """
        return self.compression_engine.decompress(compressed_data)
    
    def get_system_stats(self) -> Dict[str, Any]:
        """獲取系統統計信息"""
        return {
            "system": self.config["system_name"],
            "version": self.config["version"],
            "stats": self.stats,
            "subsystems": {
                "compression": self.compression_engine.get_stats(),
                "language": self.language_processor.get_stats(),
                "dialogue": self.dialogue_analyzer.get_stats()
            },
            "timestamp": datetime.now().isoformat()
        }


class CompressionEngine:
    """壓縮引擎"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.deduplication_cache = {}
        self.stats = {
            "total_compressed": 0,
            "total_decompressed": 0,
            "total_bytes_saved": 0,
            "deduplication_hits": 0
        }
    
    def compress(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """壓縮數據"""
        # 序列化數據
        serialized = json.dumps(data, ensure_ascii=False).encode('utf-8')
        
        # 去重檢查
        data_hash = hashlib.md5(serialized).hexdigest()
        if self.config.get("enable_deduplication", False) and data_hash in self.deduplication_cache:
            self.stats["deduplication_hits"] += 1
            return {
                "compressed_data": self.deduplication_cache[data_hash],
                "hash": data_hash,
                "deduplicated": True
            }
        
        # 使用zlib壓縮
        compressed = zlib.compress(serialized, level=self.config.get("level", 6))
        
        # 緩存結果
        if self.config.get("enable_deduplication", False):
            self.deduplication_cache[data_hash] = compressed
        
        self.stats["total_compressed"] += 1
        self.stats["total_bytes_saved"] += len(serialized) - len(compressed)
        
        return {
            "compressed_data": compressed,
            "hash": data_hash,
            "deduplicated": False
        }
    
    def decompress(self, compressed_data: bytes) -> Dict[str, Any]:
        """解壓縮數據"""
        try:
            decompressed = zlib.decompress(compressed_data)
            data = json.loads(decompressed.decode('utf-8'))
            self.stats["total_decompressed"] += 1
            return data
        except Exception as e:
            print(f"❌ 解壓縮失敗: {e}")
            return {}
    
    def get_stats(self) -> Dict[str, Any]:
        """獲取統計信息"""
        return self.stats


class LanguageProcessor:
    """語言處理器"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.stats = {
            "total_processed": 0,
            "language_detections": {},
            "sentiment_analyses": 0
        }
    
    def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """處理數據"""
        result = data.copy()
        
        # 檢測語言
        if "text" in data:
            language = self.detect_language(data["text"])
            result["detected_language"] = language
            
            # 更新統計
            self.stats["language_detections"][language] = self.stats["language_detections"].get(language, 0) + 1
        
        # 情感分析
        if self.config.get("enable_sentiment", False) and "text" in data:
            sentiment = self.analyze_sentiment(data["text"])
            result["sentiment"] = sentiment
            self.stats["sentiment_analyses"] += 1
        
        self.stats["total_processed"] += 1
        return result
    
    def detect_language(self, text: str) -> str:
        """檢測語言"""
        # 簡單的語言檢測邏輯
        if re.search(r'[\u4e00-\u9fff]', text):  # 中文字符
            return "zh-CN"
        elif re.search(r'[ぁ-んァ-ン]', text):  # 日文字符
            return "ja-JP"
        elif re.search(r'[가-힣]', text):  # 韓文字符
            return "ko-KR"
        else:
            return "en-US"  # 默認英語
    
    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """分析情感"""
        # 簡單的情感分析邏輯
        positive_words = ["好", "優秀", "完美", "喜歡", "愛", "開心", "高興"]
        negative_words = ["壞", "糟糕", "討厭", "恨", "傷心", "難過", "生氣"]
        
        text_lower = text.lower()
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        total = positive_count + negative_count
        if total == 0:
            score = 0.5  # 中性
        else:
            score = positive_count / total
        
        if score > 0.7:
            sentiment = "positive"
        elif score < 0.3:
            sentiment = "negative"
        else:
            sentiment = "neutral"
        
        return {
            "score": score,
            "sentiment": sentiment,
            "positive_count": positive_count,
            "negative_count": negative_count
        }
    
    def get_stats(self) -> Dict[str, Any]:
        """獲取統計信息"""
        return self.stats


class DialogueAnalyzer:
    """對話分析器"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.dialogue_history = []
        self.stats = {
            "total_analyzed": 0,
            "intents_detected": {},
            "entities_extracted": 0,
            "summarizations": 0
        }
    
    def analyze(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """分析對話"""
        result = data.copy()
        
        # 意圖檢測
        if self.config.get("enable_intent_detection", False) and "text" in data:
            intent = self.detect_intent(data["text"])
            result["intent"] = intent
            self.stats["intents_detected"][intent] = self.stats["intents_detected"].get(intent, 0) + 1
        
        # 實體提取
        if self.config.get("enable_entity_extraction", False) and "text" in data:
            entities = self.extract_entities(data["text"])
            result["entities"] = entities
            self.stats["entities_extracted"] += len(entities)
        
        # 對話摘要
        if self.config.get("enable_summarization", False):
            self.dialogue_history.append(data)
            if len(self.dialogue_history) > self.config.get("max_history", 100):
                self.dialogue_history.pop(0)
            
            # 定期生成摘要
            if len(self.dialogue_history) % 10 == 0:
                summary = self.generate_summary()
                result["dialogue_summary"] = summary
                self.stats["summarizations"] += 1
        
        self.stats["total_analyzed"] += 1
        return result
    
    def detect_intent(self, text: str) -> str:
        """檢測意圖"""
        # 簡單的意圖檢測邏輯
        text_lower = text.lower()
        
        if any(word in text_lower for word in ["幫助", "幫忙", "協助", "help", "assist"]):
            return "help"
        elif any(word in text_lower for word in ["查詢", "搜索", "查找", "search", "query"]):
            return "search"
        elif any(word in text_lower for word in ["分析", "評估", "檢查", "analyze", "evaluate"]):
            return "analyze"
        elif any(word in text_lower for word in ["設置", "配置", "設定", "configure", "setup"]):
            return "configure"
        else:
            return "general"
    
    def extract_entities(self, text: str) -> List[Dict[str, Any]]:
        """提取實體"""
        entities = []
        
        # 提取日期
        date_patterns = [
            r'\d{4}年\d{1,2}月\d{1,2}日',
            r'\d{4}-\d{1,2}-\d{1,2}',
            r'\d{1,2}/\d{1,2}/\d{4}'
        ]
        
        for pattern in date_patterns:
            for match in re.finditer(pattern, text):
                entities.append({
                    "type": "date",
                    "value": match.group(),
                    "start": match.start(),
                    "end": match.end()
                })
        
        # 提取數字
        number_pattern = r'\b\d+\b'
        for match in re.finditer(number_pattern, text):
            entities.append({
                "type": "number",
                "value": match.group(),
                "start": match.start(),
                "end": match.end()
            })
        
        return entities
    
    def generate_summary(self) -> str:
        """生成對話摘要"""
        if not self.dialogue_history:
            return "無對話歷史"
        
        # 簡單的摘要生成邏輯
        recent_dialogues = self.dialogue_history[-5:]  # 最近5條對話
        intents = [d.get("intent", "unknown") for d in recent_dialogues if "intent" in d]
        
        if intents:
            most_common_intent = max(set(intents), key=intents.count)
            return f"最近對話主要意圖: {most_common_intent}，共{len(recent_dialogues)}條對話"
        else:
            return f"最近{len(recent_dialogues)}條對話，無明顯意圖模式"
    
    def get_stats(self) -> Dict[str, Any]:
        """獲取統計信息"""
        return self.stats


# 示例使用
if __name__ == "__main__":
    # 創建系統實例
    system = ImperialEtherLanguageSystem()
    
    # 示例對話數據
    dialogue_data = {
        "user_id": "user123",
        "text": "你好，請幫我分析這個項目，我覺得它很好！",
        "timestamp": datetime.now().isoformat()
    }
    
    # 處理對話
    result = system.process_dialogue(dialogue_data)
    
    print("=" * 60)
    print("帝級以太語言系統 - 示例運行")
    print("=" * 60)
    print(f"原始數據大小: {result['metadata']['original_size']} 字節")
    print(f"壓縮後大小: {result['metadata']['compressed_size']} 字節")
    print(f"壓縮率: {result['metadata']['compression_ratio']:.2%}")
    print(f"檢測語言: {result['processed'].get('detected_language', '未知')}")
    print(f"情感分析: {result['processed'].get('sentiment', {}).get('sentiment', '未知')}")
    print(f"意圖檢測: {result['analyzed'].get('intent', '未知')}")
    print("=" * 60)
    
    # 顯示系統統計
    stats = system.get_system_stats()
    print(f"系統統計: 已處理 {stats['stats']['total_processed']} 條對話")
    print("=" * 60)