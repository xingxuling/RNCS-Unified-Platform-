#!/usr/bin/env python3
"""
RAG 分析模塊
用於分析項目結構、代碼質量、識別改進點
"""

import os
import json
import re
import hashlib
from pathlib import Path
from typing import Dict, List, Any, Optional
import subprocess
import sys

class ProjectAnalyzer:
    """項目分析器"""
    
    def __init__(self, project_path: str):
        self.project_path = Path(project_path)
        self.analysis_results = {}
        
        # 文件和目录忽略列表
        self.ignore_patterns = [
            '__pycache__',
            '.git',
            '.github',
            'node_modules',
            'venv',
            '.venv',
            'env',
            '.env',
            'dist',
            'build',
            'target',
            'bin',
            'obj',
            '.pytest_cache',
            '.mypy_cache',
            '.tox',
            'coverage',
            '.coverage',
            'htmlcov',
            '.idea',
            '.vscode',
            '*.pyc',
            '*.pyo',
            '*.pyd',
            '*.so',
            '*.dylib',
            '*.dll',
            '*.exe',
            '*.zip',
            '*.tar.gz',
            '*.rar',
            '*.7z',
        ]
    
    def _should_ignore(self, name: str) -> bool:
        """
        檢查是否應該忽略該文件或目錄
        
        Args:
            name: 文件或目錄名稱
        
        Returns:
            bool: 如果應該忽略返回True
        """
        import fnmatch
        
        for pattern in self.ignore_patterns:
            if fnmatch.fnmatch(name, pattern):
                return True
        
        return False
        
    def analyze_project_structure(self) -> Dict[str, Any]:
        """分析項目結構"""
        print("🔍 分析項目結構...")
        
        structure = {
            "total_files": 0,
            "file_types": {},
            "directories": [],
            "missing_files": [],
            "project_size": 0
        }
        
        # 檢查關鍵文件
        critical_files = [
            "package.json",
            "README.md",
            "src/",
            "android/",
            "ios/",
            ".github/workflows/"
        ]
        
        for file in critical_files:
            file_path = self.project_path / file
            if file_path.exists():
                structure["directories"].append(file)
            else:
                structure["missing_files"].append(file)
        
        # 統計文件類型和數量
        for root, dirs, files in os.walk(self.project_path):
            # 過濾掉忽略的目錄
            dirs[:] = [d for d in dirs if not self._should_ignore(d)]
            
            for file in files:
                # 跳過忽略的文件
                if self._should_ignore(file):
                    continue
                
                structure["total_files"] += 1
                ext = os.path.splitext(file)[1]
                structure["file_types"][ext] = structure["file_types"].get(ext, 0) + 1
                
                # 計算文件大小
                file_path = os.path.join(root, file)
                try:
                    structure["project_size"] += os.path.getsize(file_path)
                except (OSError, PermissionError):
                    # 跳過無法訪問的文件
                    pass
        
        structure["project_size_mb"] = structure["project_size"] / (1024 * 1024)
        
        return structure
    
    def analyze_code_quality(self) -> Dict[str, Any]:
        """分析代碼質量"""
        print("📊 分析代碼質量...")
        
        quality = {
            "typescript_files": 0,
            "react_components": 0,
            "has_tests": False,
            "has_linting": False,
            "has_build_scripts": False,
            "code_complexity": "low",
            "issues_found": []
        }
        
        # 檢查 TypeScript 文件
        ts_files = list(self.project_path.rglob("*.ts")) + list(self.project_path.rglob("*.tsx"))
        quality["typescript_files"] = len(ts_files)
        
        # 檢查 React 組件
        for ts_file in ts_files[:10]:  # 檢查前10個文件
            try:
                with open(ts_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if "React.FC" in content or "function " in content and "return (" in content:
                        quality["react_components"] += 1
            except UnicodeDecodeError:
                # 嘗試GBK編碼（Windows中文系統）
                try:
                    with open(ts_file, 'r', encoding='gbk') as f:
                        content = f.read()
                        if "React.FC" in content or "function " in content and "return (" in content:
                            quality["react_components"] += 1
                except:
                    pass
            except:
                pass
        
        # 檢查測試文件
        test_files = list(self.project_path.rglob("*test*")) + list(self.project_path.rglob("*spec*"))
        quality["has_tests"] = len(test_files) > 0
        
        # 檢查構建配置
        package_json = self.project_path / "package.json"
        if package_json.exists():
            try:
                with open(package_json, 'r', encoding='utf-8') as f:
                    package_data = json.load(f)
            except UnicodeDecodeError:
                try:
                    with open(package_json, 'r', encoding='gbk') as f:
                        package_data = json.load(f)
                except:
                    pass
                    scripts = package_data.get("scripts", {})
                    quality["has_build_scripts"] = any("build" in key.lower() for key in scripts.keys())
                    
                    # 檢查依賴
                    dependencies = package_data.get("dependencies", {})
                    dev_dependencies = package_data.get("devDependencies", {})
                    
                    if "eslint" in dev_dependencies or "prettier" in dev_dependencies:
                        quality["has_linting"] = True
            except:
                pass
        
        # 簡單的代碼複雜度分析
        if quality["typescript_files"] > 20:
            quality["code_complexity"] = "high"
        elif quality["typescript_files"] > 10:
            quality["code_complexity"] = "medium"
        
        return quality
    
    def analyze_permission_features(self) -> Dict[str, Any]:
        """分析權限管理功能"""
        print("🔐 分析權限管理功能...")
        
        features = {
            "permission_types": [],
            "has_permission_service": False,
            "has_ui_components": False,
            "has_automation": False,
            "missing_features": []
        }
        
        # 檢查權限服務
        service_files = list(self.project_path.rglob("*PermissionService*"))
        if service_files:
            features["has_permission_service"] = True
            
            # 分析支持的權限類型
            try:
                with open(service_files[0], 'r', encoding='utf-8') as f:
                    content = f.read()
            except UnicodeDecodeError:
                try:
                    with open(service_files[0], 'r', encoding='gbk') as f:
                        content = f.read()
                except:
                    content = ""
            except:
                content = ""
            
            if content:
                # 查找權限類型定義
                permission_patterns = [
                    r"'camera'", r"'location'", r"'microphone'", 
                    r"'contacts'", r"'calendar'", r"'photos'",
                    r"'notifications'", r"'storage'"
                ]
                
                for pattern in permission_patterns:
                    if re.search(pattern, content):
                        perm = pattern.strip("'")
                        features["permission_types"].append(perm)
        
        # 檢查 UI 組件
        component_files = list(self.project_path.rglob("*PermissionCard*")) + \
                         list(self.project_path.rglob("*Screen*"))
        features["has_ui_components"] = len(component_files) > 0
        
        # 檢查自動化配置
        workflow_files = list(self.project_path.rglob("*.yml")) + list(self.project_path.rglob("*.yaml"))
        features["has_automation"] = len(workflow_files) > 0
        
        # 識別缺失的功能
        expected_features = [
            "權限狀態持久化",
            "權限使用統計",
            "批量權限管理",
            "權限教育界面",
            "自動化測試"
        ]
        
        # 簡單的檢查邏輯
        features["missing_features"] = expected_features  # 簡化版本
        
        return features
    
    def analyze_build_automation(self) -> Dict[str, Any]:
        """分析構建自動化"""
        print("⚙️  分析構建自動化...")
        
        automation = {
            "has_github_actions": False,
            "has_build_scripts": False,
            "has_deployment": False,
            "ci_cd_maturity": "basic",
            "improvement_opportunities": []
        }
        
        # 檢查 GitHub Actions
        workflows_dir = self.project_path / ".github" / "workflows"
        if workflows_dir.exists():
            automation["has_github_actions"] = True
            workflow_files = list(workflows_dir.glob("*.yml")) + list(workflows_dir.glob("*.yaml"))
            
            if workflow_files:
                automation["ci_cd_maturity"] = "intermediate"
                
                # 檢查部署配置
                for workflow in workflow_files:
                    try:
                        with open(workflow, 'r', encoding='utf-8') as f:
                            content = f.read()
                    except UnicodeDecodeError:
                        try:
                            with open(workflow, 'r', encoding='gbk') as f:
                                content = f.read()
                        except:
                            continue
                    except:
                        continue
                    
                    if "release" in content.lower() or "deploy" in content.lower():
                        automation["has_deployment"] = True
        
        # 檢查構建腳本
        scripts_dir = self.project_path / "scripts"
        if scripts_dir.exists():
            build_scripts = list(scripts_dir.glob("*build*")) + list(scripts_dir.glob("*deploy*"))
            automation["has_build_scripts"] = len(build_scripts) > 0
        
        # 識別改進機會
        improvements = []
        if not automation["has_github_actions"]:
            improvements.append("添加 GitHub Actions 自動化")
        if not automation["has_deployment"]:
            improvements.append("添加自動部署配置")
        if automation["ci_cd_maturity"] == "basic":
            improvements.append("增強 CI/CD 流程")
        
        automation["improvement_opportunities"] = improvements
        
        return automation
    
    def generate_analysis_report(self) -> Dict[str, Any]:
        """生成完整的分析報告"""
        print("📈 生成分析報告...")
        
        report = {
            "project_info": {
                "path": str(self.project_path),
                "name": self.project_path.name,
                "analysis_timestamp": self._get_timestamp()
            },
            "structure_analysis": self.analyze_project_structure(),
            "code_quality_analysis": self.analyze_code_quality(),
            "feature_analysis": self.analyze_permission_features(),
            "automation_analysis": self.analyze_build_automation(),
            "overall_assessment": {},
            "recommendations": []
        }
        
        # 生成總體評估
        report["overall_assessment"] = self._generate_overall_assessment(report)
        
        # 生成推薦
        report["recommendations"] = self._generate_recommendations(report)
        
        return report
    
    def _generate_overall_assessment(self, report: Dict[str, Any]) -> Dict[str, Any]:
        """生成總體評估"""
        assessment = {
            "completeness_score": 0,
            "quality_score": 0,
            "automation_score": 0,
            "overall_score": 0,
            "maturity_level": "beginner",
            "readiness_for_production": False
        }
        
        # 計算完整性分數（0-100）
        structure = report["structure_analysis"]
        completeness = 0
        
        # 文件完整性
        total_expected = 8  # 預期的關鍵文件/目錄數量
        missing = len(structure["missing_files"])
        completeness += ((total_expected - missing) / total_expected) * 40
        
        # 功能完整性
        features = report["feature_analysis"]
        if features["has_permission_service"]:
            completeness += 20
        if features["has_ui_components"]:
            completeness += 20
        if features["has_automation"]:
            completeness += 20
        
        assessment["completeness_score"] = min(100, completeness)
        
        # 計算質量分數
        quality = report["code_quality_analysis"]
        quality_score = 0
        
        if quality["has_tests"]:
            quality_score += 25
        if quality["has_linting"]:
            quality_score += 25
        if quality["has_build_scripts"]:
            quality_score += 25
        if quality["code_complexity"] == "medium":
            quality_score += 15
        elif quality["code_complexity"] == "low":
            quality_score += 25
        
        assessment["quality_score"] = quality_score
        
        # 計算自動化分數
        automation = report["automation_analysis"]
        automation_score = 0
        
        if automation["has_github_actions"]:
            automation_score += 40
        if automation["has_build_scripts"]:
            automation_score += 30
        if automation["has_deployment"]:
            automation_score += 30
        
        assessment["automation_score"] = automation_score
        
        # 計算總分
        overall = (
            assessment["completeness_score"] * 0.4 +
            assessment["quality_score"] * 0.3 +
            assessment["automation_score"] * 0.3
        )
        assessment["overall_score"] = overall
        
        # 確定成熟度等級
        if overall >= 80:
            assessment["maturity_level"] = "advanced"
            assessment["readiness_for_production"] = True
        elif overall >= 60:
            assessment["maturity_level"] = "intermediate"
            assessment["readiness_for_production"] = True
        elif overall >= 40:
            assessment["maturity_level"] = "basic"
        else:
            assessment["maturity_level"] = "beginner"
        
        return assessment
    
    def _generate_recommendations(self, report: Dict[str, Any]) -> List[Dict[str, Any]]:
        """生成改進建議"""
        recommendations = []
        
        # 基於結構分析
        structure = report["structure_analysis"]
        if structure["missing_files"]:
            recommendations.append({
                "category": "structure",
                "priority": "high",
                "description": f"添加缺失的文件/目錄: {', '.join(structure['missing_files'][:3])}",
                "impact": "提高項目完整性"
            })
        
        # 基於代碼質量分析
        quality = report["code_quality_analysis"]
        if not quality["has_tests"]:
            recommendations.append({
                "category": "testing",
                "priority": "high",
                "description": "添加單元測試和集成測試",
                "impact": "提高代碼質量和可靠性"
            })
        
        if not quality["has_linting"]:
            recommendations.append({
                "category": "code_quality",
                "priority": "medium",
                "description": "添加 ESLint 和 Prettier 配置",
                "impact": "統一代碼風格，減少錯誤"
            })
        
        # 基於功能分析
        features = report["feature_analysis"]
        if len(features["permission_types"]) < 5:
            recommendations.append({
                "category": "features",
                "priority": "medium",
                "description": "擴展支持的權限類型",
                "impact": "增強應用功能"
            })
        
        # 基於自動化分析
        automation = report["automation_analysis"]
        for opportunity in automation["improvement_opportunities"][:2]:
            recommendations.append({
                "category": "automation",
                "priority": "medium",
                "description": opportunity,
                "impact": "提高開發效率"
            })
        
        # 根據總分添加建議
        assessment = report["overall_assessment"]
        if assessment["overall_score"] < 60:
            recommendations.append({
                "category": "overall",
                "priority": "high",
                "description": "進行全面的項目重構和優化",
                "impact": "提升項目整體質量"
            })
        
        return recommendations
    
    def _get_timestamp(self) -> str:
        """獲取時間戳"""
        from datetime import datetime
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    def save_report(self, report: Dict[str, Any], output_path: str = None) -> str:
        """保存分析報告"""
        if output_path is None:
            output_path = self.project_path.parent / "analysis_report.json"
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"✅ 分析報告已保存: {output_path}")
        return str(output_path)


def main():
    """主函數"""
    if len(sys.argv) < 2:
        print("用法: python rag_analyzer.py <項目路徑>")
        sys.exit(1)
    
    project_path = sys.argv[1]
    
    if not os.path.exists(project_path):
        print(f"錯誤: 項目路徑不存在: {project_path}")
        sys.exit(1)
    
    print(f"🎯 開始分析項目: {project_path}")
    print("=" * 50)
    
    analyzer = ProjectAnalyzer(project_path)
    report = analyzer.generate_analysis_report()
    
    # 保存報告
    output_file = analyzer.save_report(report)
    
    # 打印摘要
    print("\n" + "=" * 50)
    print("📋 分析摘要:")
    print(f"項目名稱: {report['project_info']['name']}")
    print(f"總體分數: {report['overall_assessment']['overall_score']:.1f}/100")
    print(f"成熟度等級: {report['overall_assessment']['maturity_level']}")
    print(f"生產就緒: {'✅' if report['overall_assessment']['readiness_for_production'] else '❌'}")
    print(f"建議數量: {len(report['recommendations'])}")
    print(f"詳細報告: {output_file}")
    print("=" * 50)


if __name__ == "__main__":
    main()