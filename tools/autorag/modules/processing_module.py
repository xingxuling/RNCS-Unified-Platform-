#!/usr/bin/env python3
"""
處理模塊
負責數據處理、轉換和優化
"""

import os
import json
import re
import shutil
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime


class ProcessingModule:
    """處理模塊"""
    
    def __init__(self, project_path: str):
        self.project_path = Path(project_path)
        self.processed_data = {
            "files_processed": 0,
            "transformations_applied": 0,
            "optimizations_made": 0,
            "errors_found": 0
        }
    
    def process_project(self, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """處理項目數據"""
        print("⚙️  處理項目數據...")
        
        results = {
            "processing_summary": {},
            "transformations": [],
            "optimizations": [],
            "quality_metrics": {}
        }
        
        # 1. 數據清理和標準化
        print("  🧹 數據清理和標準化...")
        cleaned_data = self._clean_and_normalize(analysis_data)
        results["processing_summary"]["data_cleaned"] = True
        
        # 2. 代碼質量處理
        print("  📊 代碼質量處理...")
        quality_results = self._process_code_quality(cleaned_data)
        results["quality_metrics"] = quality_results
        
        # 3. 依賴分析處理
        print("  📦 依賴分析處理...")
        dependency_results = self._process_dependencies(cleaned_data)
        results["processing_summary"]["dependencies_analyzed"] = True
        
        # 4. 結構優化處理
        print("  🏗️  結構優化處理...")
        structure_results = self._process_structure(cleaned_data)
        results["optimizations"] = structure_results
        
        # 5. 生成處理報告
        print("  📄 生成處理報告...")
        report_path = self._generate_processing_report(results)
        results["processing_summary"]["report_path"] = str(report_path)
        
        self.processed_data["files_processed"] = 1  # 處理了分析報告
        self.processed_data["transformations_applied"] = len(results["transformations"])
        self.processed_data["optimizations_made"] = len(results["optimizations"])
        
        return results
    
    def apply_transformations(self, transformations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """應用轉換到實際項目"""
        print("🔄 應用轉換到項目...")
        
        results = {
            "transformations_applied": 0,
            "files_modified": [],
            "errors": []
        }
        
        for transform in transformations:
            try:
                if transform["type"] == "file_rename":
                    success = self._rename_file(transform["old_path"], transform["new_path"])
                    if success:
                        results["transformations_applied"] += 1
                        results["files_modified"].append(transform["new_path"])
                
                elif transform["type"] == "file_move":
                    success = self._move_file(transform["old_path"], transform["new_path"])
                    if success:
                        results["transformations_applied"] += 1
                        results["files_modified"].append(transform["new_path"])
                
                elif transform["type"] == "content_update":
                    success = self._update_file_content(
                        transform["file_path"],
                        transform["old_content"],
                        transform["new_content"]
                    )
                    if success:
                        results["transformations_applied"] += 1
                        results["files_modified"].append(transform["file_path"])
                
            except Exception as e:
                results["errors"].append({
                    "transformation": transform.get("type", "unknown"),
                    "error": str(e)
                })
        
        return results
    
    def optimize_project(self, optimizations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """優化項目結構和配置"""
        print("⚡ 優化項目...")
        
        results = {
            "optimizations_applied": 0,
            "files_created": [],
            "configs_updated": [],
            "errors": []
        }
        
        for optimization in optimizations:
            try:
                if optimization["type"] == "create_directory":
                    success = self._create_directory(optimization["path"])
                    if success:
                        results["optimizations_applied"] += 1
                
                elif optimization["type"] == "create_config_file":
                    success = self._create_config_file(
                        optimization["file_path"],
                        optimization["content"]
                    )
                    if success:
                        results["optimizations_applied"] += 1
                        results["files_created"].append(optimization["file_path"])
                
                elif optimization["type"] == "update_package_json":
                    success = self._update_package_json(optimization["updates"])
                    if success:
                        results["optimizations_applied"] += 1
                        results["configs_updated"].append("package.json")
                
                elif optimization["type"] == "add_gitignore":
                    success = self._add_gitignore_patterns(optimization["patterns"])
                    if success:
                        results["optimizations_applied"] += 1
                        results["configs_updated"].append(".gitignore")
                
            except Exception as e:
                results["errors"].append({
                    "optimization": optimization.get("type", "unknown"),
                    "error": str(e)
                })
        
        return results