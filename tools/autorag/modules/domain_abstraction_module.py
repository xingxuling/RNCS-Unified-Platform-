#!/usr/bin/env python3
"""
領域抽象模塊
將具體項目特徵抽象為領域概念，提供領域自適應的優化建議
"""

import os
import json
import re
from pathlib import Path
from typing import Dict, List, Any, Optional, Set
import yaml

class DomainAbstractionModule:
    """領域抽象模塊"""
    
    def __init__(self, project_path: str):
        self.project_path = Path(project_path)
        self.domain_knowledge = self._load_domain_knowledge()
        self.detected_domains = []
        self.domain_patterns = {}
        
    def _load_domain_knowledge(self) -> Dict[str, Any]:
        """加載領域知識庫"""
        return {
            "web_application": {
                "description": "Web應用程序",
                "patterns": {
                    "frontend": ["package.json", "src/", "public/", "index.html", "App.js", "App.tsx"],
                    "backend": ["server.js", "app.py", "main.go", "pom.xml", "build.gradle"],
                    "database": ["models/", "migrations/", "schema.sql", "prisma/"],
                    "api": ["api/", "routes/", "controllers/", "endpoints/"]
                },
                "best_practices": [
                    "響應式設計",
                    "RESTful API設計",
                    "狀態管理",
                    "組件化架構",
                    "性能優化"
                ],
                "optimization_focus": ["性能", "安全性", "用戶體驗", "可維護性"]
            },
            "mobile_application": {
                "description": "移動應用程序",
                "patterns": {
                    "react_native": ["android/", "ios/", "App.js", "metro.config.js"],
                    "flutter": ["pubspec.yaml", "lib/", "android/", "ios/"],
                    "native_android": ["build.gradle", "AndroidManifest.xml", "MainActivity.kt"],
                    "native_ios": ["Podfile", "AppDelegate.swift", "Info.plist"]
                },
                "best_practices": [
                    "移動端性能優化",
                    "離線功能",
                    "推送通知",
                    "設備適配",
                    "電池優化"
                ],
                "optimization_focus": ["性能", "電池效率", "內存管理", "用戶體驗"]
            },
            "data_science": {
                "description": "數據科學項目",
                "patterns": {
                    "notebooks": [".ipynb", "notebooks/"],
                    "data": ["data/", "datasets/", "csv/", "json/"],
                    "ml_models": ["models/", "checkpoints/", "training/"],
                    "visualization": ["plots/", "charts/", "dashboards/"]
                },
                "best_practices": [
                    "數據版本控制",
                    "實驗跟蹤",
                    "模型可重現性",
                    "數據管道",
                    "可視化最佳實踐"
                ],
                "optimization_focus": ["性能", "可重現性", "可擴展性", "可維護性"]
            },
            "api_service": {
                "description": "API服務",
                "patterns": {
                    "api_docs": ["swagger.json", "openapi.yaml", "api-docs/"],
                    "endpoints": ["routes/", "controllers/", "handlers/"],
                    "middleware": ["middleware/", "interceptors/", "filters/"],
                    "authentication": ["auth/", "jwt/", "oauth/"]
                },
                "best_practices": [
                    "API版本控制",
                    "速率限制",
                    "認證授權",
                    "錯誤處理",
                    "文檔生成"
                ],
                "optimization_focus": ["安全性", "性能", "可靠性", "可擴展性"]
            },
            "cli_tool": {
                "description": "命令行工具",
                "patterns": {
                    "cli_entry": ["cli.py", "main.rs", "cmd/", "commands/"],
                    "argument_parsing": ["argparse", "click", "clap"],
                    "help_system": ["--help", "man pages", "README.md"],
                    "configuration": ["config/", ".env", "settings/"]
                },
                "best_practices": [
                    "清晰的幫助文檔",
                    "錯誤處理",
                    "配置管理",
                    "日誌記錄",
                    "進度指示"
                ],
                "optimization_focus": ["用戶體驗", "性能", "可維護性", "可擴展性"]
            }
        }
    
    def detect_domains(self, analysis_report: Dict[str, Any]) -> List[str]:
        """檢測項目所屬領域"""
        print("🔍 檢測項目領域...")
        
        detected = []
        project_files = self._get_project_files()
        
        for domain, knowledge in self.domain_knowledge.items():
            domain_score = 0
            matched_patterns = []
            
            # 檢查每個模式的匹配情況
            for pattern_type, patterns in knowledge["patterns"].items():
                for pattern in patterns:
                    if self._check_pattern_match(pattern, project_files):
                        domain_score += 1
                        matched_patterns.append({
                            "type": pattern_type,
                            "pattern": pattern
                        })
            
            # 如果匹配到足夠的模式，則認為屬於該領域
            if domain_score >= 2:  # 至少匹配2個模式
                detected.append(domain)
                self.domain_patterns[domain] = {
                    "score": domain_score,
                    "matched_patterns": matched_patterns,
                    "confidence": min(100, domain_score * 25)  # 每個模式25分，最多100分
                }
        
        self.detected_domains = detected
        return detected
    
    def _get_project_files(self) -> List[str]:
        """獲取項目文件列表"""
        files = []
        for root, dirs, filenames in os.walk(self.project_path):
            for filename in filenames:
                rel_path = os.path.relpath(os.path.join(root, filename), self.project_path)
                files.append(rel_path)
        return files
    
    def _check_pattern_match(self, pattern: str, files: List[str]) -> bool:
        """檢查模式是否匹配"""
        # 如果是文件模式
        if not pattern.endswith('/'):
            return pattern in files
        
        # 如果是目錄模式
        for file in files:
            if file.startswith(pattern):
                return True
        return False
    
    def analyze_domain_context(self, analysis_report: Dict[str, Any]) -> Dict[str, Any]:
        """分析領域上下文"""
        if not self.detected_domains:
            self.detect_domains(analysis_report)
        
        domain_context = {
            "detected_domains": self.detected_domains,
            "domain_patterns": self.domain_patterns,
            "primary_domain": self.detected_domains[0] if self.detected_domains else None,
            "domain_specific_insights": [],
            "optimization_recommendations": []
        }
        
        # 為每個檢測到的領域生成洞察和建議
        for domain in self.detected_domains:
            knowledge = self.domain_knowledge[domain]
            
            # 領域特定洞察
            insights = self._generate_domain_insights(domain, analysis_report)
            domain_context["domain_specific_insights"].extend(insights)
            
            # 優化建議
            recommendations = self._generate_domain_recommendations(domain, analysis_report)
            domain_context["optimization_recommendations"].extend(recommendations)
        
        return domain_context
    
    def _generate_domain_insights(self, domain: str, analysis_report: Dict[str, Any]) -> List[str]:
        """生成領域特定洞察"""
        insights = []
        knowledge = self.domain_knowledge[domain]
        
        # 基於領域特徵生成洞察
        if domain == "web_application":
            if "package.json" in self._get_project_files():
                insights.append("檢測到Web應用程序框架，建議實施組件化架構")
            if "src/" in self._get_project_files():
                insights.append("檢測到源代碼目錄，建議實施模塊化組織")
        
        elif domain == "mobile_application":
            if "android/" in self._get_project_files() or "ios/" in self._get_project_files():
                insights.append("檢測到移動應用程序，建議優化移動端性能和電池效率")
        
        elif domain == "data_science":
            if any(f.endswith('.ipynb') for f in self._get_project_files()):
                insights.append("檢測到Jupyter筆記本，建議實施實驗跟蹤和可重現性最佳實踐")
        
        elif domain == "api_service":
            if "api/" in self._get_project_files() or "routes/" in self._get_project_files():
                insights.append("檢測到API服務，建議實施API版本控制和速率限制")
        
        elif domain == "cli_tool":
            if any(f in ['cli.py', 'main.rs'] for f in self._get_project_files()):
                insights.append("檢測到命令行工具，建議優化用戶體驗和幫助文檔")
        
        return insights
    
    def _generate_domain_recommendations(self, domain: str, analysis_report: Dict[str, Any]) -> List[Dict[str, Any]]:
        """生成領域特定優化建議"""
        recommendations = []
        knowledge = self.domain_knowledge[domain]
        
        # 基於領域最佳實踐生成建議
        for practice in knowledge["best_practices"]:
            recommendations.append({
                "domain": domain,
                "practice": practice,
                "priority": "medium",
                "description": f"實施{practice}最佳實踐",
                "implementation_hint": self._get_implementation_hint(domain, practice)
            })
        
        # 基於領域優化重點生成建議
        for focus in knowledge["optimization_focus"]:
            recommendations.append({
                "domain": domain,
                "focus": focus,
                "priority": "high",
                "description": f"優化{domain}的{focus}",
                "implementation_hint": self._get_optimization_hint(domain, focus)
            })
        
        return recommendations
    
    def _get_implementation_hint(self, domain: str, practice: str) -> str:
        """獲取實施提示"""
        hints = {
            "web_application": {
                "響應式設計": "使用CSS媒體查詢和flexbox/grid布局",
                "RESTful API設計": "遵循REST原則，使用適當的HTTP方法",
                "狀態管理": "考慮使用Redux、Context API或MobX",
                "組件化架構": "創建可重用的組件，遵循單一職責原則"
            },
            "mobile_application": {
                "移動端性能優化": "使用虛擬化列表，優化圖片加載",
                "離線功能": "實現本地存儲和同步機制",
                "推送通知": "集成Firebase Cloud Messaging或APNs",
                "設備適配": "測試不同屏幕尺寸和操作系統版本"
            }
        }
        
        return hints.get(domain, {}).get(practice, "參考相關領域最佳實踐文檔")
    
    def _get_optimization_hint(self, domain: str, focus: str) -> str:
        """獲取優化提示"""
        hints = {
            "web_application": {
                "性能": "實施代碼分割、懶加載、圖片優化",
                "安全性": "實施CSP、XSS防護、CSRF令牌",
                "用戶體驗": "優化加載時間、添加加載狀態、錯誤處理",
                "可維護性": "實施類型檢查、代碼格式化、文檔生成"
            },
            "api_service": {
                "安全性": "實施JWT認證、速率限制、輸入驗證",
                "性能": "實施緩存、數據庫索引、異步處理",
                "可靠性": "實施重試機制、熔斷器、監控",
                "可擴展性": "實施微服務架構、消息隊列、負載均衡"
            }
        }
        
        return hints.get(domain, {}).get(focus, "實施相關領域的優化策略")
    
    def generate_domain_report(self, analysis_report: Dict[str, Any]) -> Dict[str, Any]:
        """生成領域分析報告"""
        domain_context = self.analyze_domain_context(analysis_report)
        
        report = {
            "project_info": {
                "path": str(self.project_path),
                "name": analysis_report.get("project_info", {}).get("name", "unknown")
            },
            "domain_analysis": {
                "detected_domains": domain_context["detected_domains"],
                "primary_domain": domain_context["primary_domain"],
                "domain_confidence": self.domain_patterns.get(domain_context["primary_domain"], {}).get("confidence", 0) if domain_context["primary_domain"] else 0,
                "matched_patterns": self.domain_patterns
            },
            "insights": {
                "domain_specific_insights": domain_context["domain_specific_insights"],
                "total_insights": len(domain_context["domain_specific_insights"])
            },
            "recommendations": {
                "domain_specific_recommendations": domain_context["optimization_recommendations"],
                "total_recommendations": len(domain_context["optimization_recommendations"])
            },
            "summary": {
                "has_domain_context": len(domain_context["detected_domains"]) > 0,
                "recommended_optimization_focus": self._get_recommended_focus(domain_context),
                "next_steps": self._get_domain_next_steps(domain_context)
            }
        }
        
        return report
    
    def _get_recommended_focus(self, domain_context: Dict[str, Any]) -> List[str]:
        """獲取推薦的優化重點"""
        focus_list = []
        
        for domain in domain_context["detected_domains"]:
            knowledge = self.domain_knowledge[domain]
            focus_list.extend(knowledge["optimization_focus"])
        
        # 去重並返回
        return list(set(focus_list))
    
    def _get_domain_next_steps(self, domain_context: Dict[str, Any]) -> List[str]:
        """獲取領域相關的下一步"""
        next_steps = []
        
        if domain_context["primary_domain"]:
            domain = domain_context["primary_domain"]
            knowledge = self.domain_knowledge[domain]
            
            next_steps.extend([
                f"1. 專注於{knowledge['description']}的最佳實踐",
                f"2. 優先實施{domain}領域的關鍵優化",
                f"3. 參考{domain}領域的特定模式和架構",
                f"4. 監控{domain}相關的關鍵指標"
            ])
        
        return next_steps
    
    def save_report(self, report: Dict[str, Any], filepath: str):
        """保存領域分析報告"""
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        print(f"✅ 領域分析報告已保存: {filepath}")


def main():
    """主函數（用於獨立測試）"""
    import sys
    
    if len(sys.argv) < 2:
        print("用法: python domain_abstraction_module.py <項目路徑>")
        print("示例: python domain_abstraction_module.py /path/to/your/project")
        sys.exit(1)
    
    project_path = sys.argv[1]
    
    if not os.path.exists(project_path):
        print(f"錯誤: 項目路徑不存在: {project_path}")
        sys.exit(1)
    
    # 創建並運行領域抽象模塊
    module = DomainAbstractionModule(project_path)
    
    # 創建一個簡單的分析報告用於測試
    test_report = {
        "project_info": {
            "name": Path(project_path).name,
            "path": project_path
        }
    }
    
    # 檢測領域
    domains = module.detect_domains(test_report)
    print(f"檢測到的領域: {domains}")
    
    # 生成領域報告
    report = module.generate_domain_report(test_report)
    
    # 打印摘要
    print("\n📊 領域分析摘要:")
    print(f"主要領域: {report['domain_analysis']['primary_domain']}")
    print(f"領域置信度: {report['domain_analysis']['domain_confidence']}%")
    print(f"洞察數量: {report['insights']['total_insights']}")
    print(f"建議數量: {report['recommendations']['total_recommendations']}")
    
    # 保存報告
    output_dir = Path(__file__).parent.parent / "output" / "domain_analysis"
    output_dir.mkdir(parents=True, exist_ok=True)
    report_path = output_dir / f"domain_report_{Path(project_path).name}.json"
    module.save_report(report, str(report_path))


if __name__ == "__main__":
    main()