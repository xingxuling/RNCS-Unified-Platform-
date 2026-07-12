#!/usr/bin/env python3
"""
處理模塊 - 簡化版
負責數據處理、轉換和優化
"""

import os
import json
import re
import shutil
from pathlib import Path
from typing import Dict, List, Any
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
            "quality_metrics": {},
            "optimizations": []
        }
        
        # 1. 數據清理和標準化
        print("  🧹 數據清理和標準化...")
        cleaned_data = self._clean_and_normalize(analysis_data)
        results["processing_summary"]["data_cleaned"] = True
        
        # 2. 代碼質量處理
        print("  📊 代碼質量處理...")
        quality_results = self._process_code_quality(cleaned_data)
        results["quality_metrics"] = quality_results
        
        # 3. 結構優化處理
        print("  🏗️  結構優化處理...")
        structure_results = self._process_structure(cleaned_data)
        results["optimizations"] = structure_results
        
        # 4. 生成處理報告
        print("  📄 生成處理報告...")
        report_path = self._generate_processing_report(results)
        results["processing_summary"]["report_path"] = str(report_path)
        
        self.processed_data["files_processed"] = 1
        self.processed_data["optimizations_made"] = len(results["optimizations"])
        
        return results
    
    def optimize_project(self, optimizations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """優化項目結構和配置"""
        print("⚡ 優化項目...")
        
        results = {
            "optimizations_applied": 0,
            "files_created": [],
            "errors": []
        }
        
        for optimization in optimizations[:3]:  # 只處理前3個優化
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
                
            except Exception as e:
                results["errors"].append({
                    "optimization": optimization.get("type", "unknown"),
                    "error": str(e)
                })
        
        return results
    
    def validate_processing(self) -> Dict[str, Any]:
        """驗證處理結果"""
        validation_results = {
            "is_valid": True,
            "issues_found": [],
            "success_rate": 0
        }
        
        # 檢查處理數據
        if self.processed_data["errors_found"] > 0:
            validation_results["issues_found"].append(
                f"發現 {self.processed_data['errors_found']} 個處理錯誤"
            )
            validation_results["is_valid"] = False
        
        # 計算成功率
        total_operations = self.processed_data["files_processed"] + self.processed_data["optimizations_made"]
        if total_operations > 0:
            successful_operations = self.processed_data["optimizations_made"]
            validation_results["success_rate"] = (successful_operations / total_operations) * 100
        
        return validation_results
    
    def _clean_and_normalize(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """清理和標準化數據"""
        cleaned = data.copy()
        
        # 移除空值
        for key in list(cleaned.keys()):
            if cleaned[key] is None or cleaned[key] == "":
                del cleaned[key]
        
        # 標準化路徑
        if "project_info" in cleaned:
            project_info = cleaned["project_info"]
            if "path" in project_info:
                project_info["path"] = str(Path(project_info["path"]).resolve())
        
        # 標準化分數
        if "overall_assessment" in cleaned:
            assessment = cleaned["overall_assessment"]
            if "overall_score" in assessment:
                assessment["overall_score"] = max(0, min(100, assessment["overall_score"]))
        
        return cleaned
    
    def _process_code_quality(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """處理代碼質量數據"""
        quality_metrics = {
            "overall_score": 0,
            "recommendations": []
        }
        
        if "code_quality_analysis" in data:
            cqa = data["code_quality_analysis"]
            quality_metrics["overall_score"] = cqa.get("overall_score", 0)
            
            # 生成推薦
            score = quality_metrics["overall_score"]
            if score < 60:
                quality_metrics["recommendations"].append("代碼質量較低，建議進行代碼審查和重構")
            elif score < 80:
                quality_metrics["recommendations"].append("代碼質量中等，建議添加更多測試和文檔")
            else:
                quality_metrics["recommendations"].append("代碼質量良好，建議保持並優化性能")
        
        return quality_metrics
    
    def _process_structure(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """處理項目結構數據"""
        optimizations = []
        
        if "project_structure" in data:
            structure = data["project_structure"]
            
            # 檢查缺失的標準目錄
            missing_dirs = structure.get("missing_standard_dirs", [])
            for dir_path in missing_dirs[:2]:  # 只處理前2個
                optimizations.append({
                    "type": "create_directory",
                    "path": dir_path,
                    "reason": "標準項目結構",
                    "priority": "medium"
                })
            
            # 檢查配置文件
            missing_configs = structure.get("missing_config_files", [])
            for config in missing_configs:
                if config == ".eslintrc.js":
                    optimizations.append({
                        "type": "create_config_file",
                        "file_path": ".eslintrc.js",
                        "content": self._get_eslint_config(),
                        "reason": "代碼質量檢查",
                        "priority": "high"
                    })
        
        return optimizations
    
    def _create_directory(self, dir_path: str) -> bool:
        """創建目錄"""
        try:
            full_path = self.project_path / dir_path
            
            if full_path.exists():
                print(f"    ⚠️  目錄已存在: {dir_path}")
                return False
            
            full_path.mkdir(parents=True, exist_ok=True)
            print(f"    ✅ 創建目錄: {dir_path}")
            return True
            
        except Exception as e:
            print(f"    ❌ 創建目錄失敗: {e}")
            return False
    
    def _create_config_file(self, file_path: str, content: str) -> bool:
        """創建配置文件"""
        try:
            full_path = self.project_path / file_path
            
            if full_path.exists():
                print(f"    ⚠️  配置文件已存在: {file_path}")
                return False
            
            full_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"    ✅ 創建配置文件: {file_path}")
            return True
            
        except Exception as e:
            print(f"    ❌ 創建配置文件失敗: {e}")
            return False
    
    def _generate_processing_report(self, results: Dict[str, Any]) -> Path:
        """生成處理報告"""
        report_path = self.project_path / "processing_report.json"
        
        report_data = {
            "timestamp": datetime.now().isoformat(),
            "project_path": str(self.project_path),
            "processing_results": results,
            "processed_data": self.processed_data
        }
        
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, indent=2, ensure_ascii=False)
        
        print(f"    ✅ 處理報告已保存: {report_path}")
        return report_path
    
    def _get_eslint_config(self) -> str:
        """獲取 ESLint 配置"""
        return """module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    'prettier/prettier': 'error',
  },
};"""


def main():
    """主函數"""
    import sys
    
    if len(sys.argv) < 2:
        print("用法: python processing_module_simple.py <項目路徑>")
        sys.exit(1)
    
    project_path = sys.argv[1]
    
    if not os.path.exists(project_path):
        print(f"錯誤: 項目路徑不存在: {project_path}")
        sys.exit(1)
    
    print(f"⚙️  啟動處理模塊: {project_path}")
    
    processor = ProcessingModule(project_path)
    
    # 示例數據
    sample_data = {
        "project_info": {"name": "測試項目", "path": project_path},
        "overall_assessment": {"overall_score": 75},
        "code_quality_analysis": {"overall_score": 70},
        "project_structure": {
            "missing_standard_dirs": ["src/components", "src/utils"],
            "missing_config_files": [".eslintrc.js"]
        }
    }
    
    # 處理項目數據
    results = processor.process_project(sample_data)
    
    # 應用優化
    if results["optimizations"]:
        optimization_results = processor.optimize_project(results["optimizations"])
        print(f"優化應用: {optimization_results['optimizations_applied']} 個")
    
    # 驗證處理結果
    validation = processor.validate_processing()
    print(f"驗證結果: {'✅ 有效' if validation['is_valid'] else '❌ 無效'}")
    
    print("🎉 處理模塊執行完成!")


if __name__ == "__main__":
    main()