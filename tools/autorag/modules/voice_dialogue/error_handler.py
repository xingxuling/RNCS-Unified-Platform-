#!/usr/bin/env python3
"""
錯誤處理模塊
處理語音對話模塊中的各種錯誤
"""

import os
import sys
import time
import traceback
from typing import Dict, Any, Optional, Callable, List
import logging

class ErrorHandler:
    """錯誤處理模塊"""
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        初始化錯誤處理模塊
        
        Args:
            config: 配置字典
        """
        self.config = config or {}
        self.logger = logging.getLogger(__name__)
        
        # 錯誤處理配置
        self.log_errors = self.config.get("log_errors", True)
        self.show_user_errors = self.config.get("show_user_errors", True)
        self.auto_recover = self.config.get("auto_recover", True)
        
        # 重試策略
        self.max_retries = self.config.get("max_retries", 3)
        self.retry_delay = self.config.get("retry_delay", 2.0)
        self.exponential_backoff = self.config.get("exponential_backoff", True)
        
        # 錯誤類型處理
        self.handle_timeout = self.config.get("handle_timeout", True)
        self.handle_network = self.config.get("handle_network", True)
        self.handle_audio = self.config.get("handle_audio", True)
        
        # 錯誤統計
        self.error_count = 0
        self.error_history = []
        self.last_error_time = 0
        
        # 恢復狀態
        self.recovery_attempts = 0
        self.is_recovering = False
        
        self.logger.info("錯誤處理模塊初始化完成")
    
    def handle_error(self, error: Exception, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        處理錯誤
        
        Args:
            error: 異常對象
            context: 錯誤上下文
            
        Returns:
            處理結果
        """
        self.error_count += 1
        self.last_error_time = time.time()
        
        # 記錄錯誤
        error_info = self._analyze_error(error, context)
        
        # 添加到歷史
        self.error_history.append(error_info)
        if len(self.error_history) > 100:  # 限制歷史長度
            self.error_history = self.error_history[-100:]
        
        # 記錄錯誤日誌
        if self.log_errors:
            self._log_error(error_info)
        
        # 決定處理策略
        strategy = self._determine_strategy(error_info)
        
        # 執行處理
        result = self._execute_strategy(strategy, error_info)
        
        return result
    
    def _analyze_error(self, error: Exception, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """分析錯誤"""
        error_type = type(error).__name__
        error_message = str(error)
        traceback_info = traceback.format_exc()
        
        # 分類錯誤
        error_category = self._categorize_error(error, error_message)
        
        # 嚴重性評估
        severity = self._assess_severity(error_category, error_message)
        
        return {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "error_type": error_type,
            "error_message": error_message,
            "error_category": error_category,
            "severity": severity,
            "context": context or {},
            "traceback": traceback_info if severity in ["high", "critical"] else None
        }
    
    def _categorize_error(self, error: Exception, error_message: str) -> str:
        """分類錯誤"""
        error_message_lower = error_message.lower()
        
        # 超時錯誤
        timeout_keywords = ["timeout", "timed out", "time out"]
        if any(keyword in error_message_lower for keyword in timeout_keywords):
            return "timeout"
        
        # 網絡錯誤
        network_keywords = ["connection", "network", "http", "socket", "request failed"]
        if any(keyword in error_message_lower for keyword in network_keywords):
            return "network"
        
        # 音頻錯誤
        audio_keywords = ["audio", "microphone", "speaker", "play", "record", "sound"]
        if any(keyword in error_message_lower for keyword in audio_keywords):
            return "audio"
        
        # 資源錯誤
        resource_keywords = ["memory", "disk", "resource", "out of", "full"]
        if any(keyword in error_message_lower for keyword in resource_keywords):
            return "resource"
        
        # 配置錯誤
        config_keywords = ["config", "setting", "parameter", "invalid", "missing"]
        if any(keyword in error_message_lower for keyword in config_keywords):
            return "configuration"
        
        # 權限錯誤
        permission_keywords = ["permission", "access denied", "forbidden"]
        if any(keyword in error_message_lower for keyword in permission_keywords):
            return "permission"
        
        # 未知錯誤
        return "unknown"
    
    def _assess_severity(self, category: str, message: str) -> str:
        """評估錯誤嚴重性"""
        message_lower = message.lower()
        
        # 關鍵錯誤
        critical_keywords = ["fatal", "critical", "cannot", "unable to", "failed to initialize"]
        if any(keyword in message_lower for keyword in critical_keywords):
            return "critical"
        
        # 高級錯誤（影響核心功能）
        if category in ["timeout", "network", "audio"]:
            return "high"
        
        # 中級錯誤（影響部分功能）
        if category in ["resource", "configuration"]:
            return "medium"
        
        # 低級錯誤（不影響核心功能）
        return "low"
    
    def _determine_strategy(self, error_info: Dict[str, Any]) -> Dict[str, Any]:
        """確定處理策略"""
        category = error_info["error_category"]
        severity = error_info["severity"]
        
        strategy = {
            "action": "continue",  # continue, retry, fallback, stop
            "message": None,
            "user_message": None,
            "recovery_action": None
        }
        
        # 根據錯誤類別和嚴重性決定策略
        if severity == "critical":
            strategy["action"] = "stop"
            strategy["message"] = "關鍵錯誤，停止系統"
            strategy["user_message"] = "系統遇到嚴重錯誤，需要重啟"
            
        elif severity == "high":
            if self.auto_recover and self.recovery_attempts < self.max_retries:
                strategy["action"] = "retry"
                strategy["message"] = f"高級錯誤，嘗試恢復 (嘗試 {self.recovery_attempts + 1}/{self.max_retries})"
                strategy["user_message"] = "遇到問題，正在嘗試恢復..."
            else:
                strategy["action"] = "fallback"
                strategy["message"] = "高級錯誤，切換到降級模式"
                strategy["user_message"] = "系統遇到問題，已切換到基本模式"
                
        elif severity == "medium":
            strategy["action"] = "fallback"
            strategy["message"] = "中級錯誤，使用備用方案"
            strategy["user_message"] = None  # 不向用戶顯示
            
        else:  # low severity
            strategy["action"] = "continue"
            strategy["message"] = "低級錯誤，繼續運行"
            strategy["user_message"] = None
        
        # 根據錯誤類別添加特定恢復動作
        if category == "timeout" and self.handle_timeout:
            strategy["recovery_action"] = "increase_timeout"
        elif category == "network" and self.handle_network:
            strategy["recovery_action"] = "check_connection"
        elif category == "audio" and self.handle_audio:
            strategy["recovery_action"] = "switch_audio_device"
        
        return strategy
    
    def _execute_strategy(self, strategy: Dict[str, Any], error_info: Dict[str, Any]) -> Dict[str, Any]:
        """執行處理策略"""
        action = strategy["action"]
        
        result = {
            "success": False,
            "action": action,
            "message": strategy["message"],
            "user_message": strategy["user_message"] if self.show_user_errors else None,
            "error_info": error_info,
            "recovery_action": strategy["recovery_action"]
        }
        
        try:
            if action == "retry":
                result = self._execute_retry(result)
            elif action == "fallback":
                result = self._execute_fallback(result)
            elif action == "stop":
                result = self._execute_stop(result)
            else:  # continue
                result["success"] = True
            
            # 執行恢復動作
            if strategy["recovery_action"]:
                self._execute_recovery_action(strategy["recovery_action"])
            
        except Exception as e:
            self.logger.error(f"執行錯誤處理策略失敗: {e}")
            result["success"] = False
            result["error"] = str(e)
        
        return result
    
    def _execute_retry(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """執行重試策略"""
        self.recovery_attempts += 1
        
        # 計算延遲時間
        if self.exponential_backoff:
            delay = self.retry_delay * (2 ** (self.recovery_attempts - 1))
        else:
            delay = self.retry_delay
        
        self.logger.info(f"重試 {self.recovery_attempts}/{self.max_retries}，等待 {delay} 秒")
        time.sleep(delay)
        
        result["success"] = True
        result["retry_count"] = self.recovery_attempts
        result["delay"] = delay
        
        return result
    
    def _execute_fallback(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """執行降級策略"""
        self.logger.info("切換到降級模式")
        
        # 這裡可以實現具體的降級邏輯
        # 例如：切換到模擬模式、使用本地語音合成等
        
        result["success"] = True
        result["fallback_mode"] = "enabled"
        
        return result
    
    def _execute_stop(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """執行停止策略"""
        self.logger.error("由於嚴重錯誤，停止系統")
        
        result["success"] = False
        result["system_stopped"] = True
        
        return result
    
    def _execute_recovery_action(self, action: str) -> None:
        """執行恢復動作"""
        try:
            if action == "increase_timeout":
                self.logger.info("增加操作超時時間")
                # 這裡可以實現增加超時時間的邏輯
                
            elif action == "check_connection":
                self.logger.info("檢查網絡連接")
                # 這裡可以實現檢查網絡連接的邏輯
                
            elif action == "switch_audio_device":
                self.logger.info("切換音頻設備")
                # 這裡可以實現切換音頻設備的邏輯
                
        except Exception as e:
            self.logger.error(f"執行恢復動作失敗: {e}")
    
    def _log_error(self, error_info: Dict[str, Any]) -> None:
        """記錄錯誤日誌"""
        log_message = (
            f"錯誤 [{error_info['error_category']}/{error_info['severity']}]: "
            f"{error_info['error_type']} - {error_info['error_message']}"
        )
        
        if error_info["severity"] in ["critical", "high"]:
            self.logger.error(log_message)
            if error_info.get("traceback"):
                self.logger.debug(f"錯誤跟踪: {error_info['traceback']}")
        elif error_info["severity"] == "medium":
            self.logger.warning(log_message)
        else:
            self.logger.info(log_message)
    
    def get_error_stats(self) -> Dict[str, Any]:
        """獲取錯誤統計"""
        # 按類別統計
        category_stats = {}
        severity_stats = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        
        for error in self.error_history:
            category = error["error_category"]
            severity = error["severity"]
            
            category_stats[category] = category_stats.get(category, 0) + 1
            severity_stats[severity] = severity_stats.get(severity, 0) + 1
        
        return {
            "total_errors": self.error_count,
            "recovery_attempts": self.recovery_attempts,
            "last_error_time": self.last_error_time,
            "category_stats": category_stats,
            "severity_stats": severity_stats,
            "recent_errors": self.error_history[-5:] if self.error_history else []
        }
    
    def reset_stats(self) -> None:
        """重置統計數據"""
        self.error_count = 0
        self.error_history = []
        self.recovery_attempts = 0
        self.last_error_time = 0
        self.logger.info("錯誤統計已重置")
    
    def can_continue(self) -> bool:
        """檢查是否可以繼續運行"""
        # 檢查最近錯誤頻率
        recent_errors = 0
        current_time = time.time()
        
        for error in self.error_history[-10:]:  # 檢查最近10個錯誤
            # 這裡需要解析時間戳，簡化處理
            recent_errors += 1
        
        # 如果最近錯誤太多，建議停止
        if recent_errors >= 5 and (current_time - self.last_error_time) < 60:
            self.logger.warning("錯誤頻率過高，建議檢查系統")
            return False
        
        return True


def test_error_handler():
    """測試錯誤處理模塊"""
    print("測試錯誤處理模塊...")
    
    # 創配置
    config = {
        "log_errors": True,
        "show_user_errors": True,
        "auto_recover": True,
        "max_retries": 3,
        "retry_delay": 1.0,
        "exponential_backoff": True
    }
    
    # 創建錯誤處理模塊
    error_handler = ErrorHandler(config)
    
    # 測試不同類型的錯誤
    test_errors = [
        {
            "error": TimeoutError("操作超時"),
            "context": {"operation": "speech_recognition", "timeout": 5}
        },
        {
            "error": ConnectionError("網絡連接失敗"),
            "context": {"service": "google_tts", "url": "https://api.google.com"}
        },
        {
            "error": OSError("音頻設備不可用"),
            "context": {"device": "microphone", "action": "record"}
        },
        {
            "error": ValueError("無效的配置參數"),
            "context": {"parameter": "sample_rate", "value": -1}
        }
    ]
    
    for i, test in enumerate(test_errors, 1):
        print(f"\n測試錯誤 {i}: {type(test['error']).__name__}")
        
        result = error_handler.handle_error(test["error"], test["context"])
        
        print(f"  分類: {result['error_info']['error_category']}")
        print(f"  嚴重性: {result['error_info']['severity']}")
        print(f"  處理動作: {result['action']}")
        print(f"  消息: {result['message']}")
        
        if result.get("user_message"):
            print(f"  用戶消息: {result['user_message']}")
    
    # 獲取錯誤統計
    stats = error_handler.get_error_stats()
    print(f"\n錯誤統計:")
    print(f"  總錯誤數: {stats['total_errors']}")
    print(f"  恢復嘗試: {stats['recovery_attempts']}")
    print(f"  錯誤分類統計: {stats['category_stats']}")
    
    # 檢查是否可以繼續
    can_continue = error_handler.can_continue()
    print(f"\n可以繼續運行: {can_continue}")
    
    # 重置統計
    error_handler.reset_stats()
    stats_after_reset = error_handler.get_error_stats()
    print(f"\n重置後總錯誤數: {stats_after_reset['total_errors']}")
    
    print("\n錯誤處理模塊測試完成")


if __name__ == "__main__":
    test_error_handler()