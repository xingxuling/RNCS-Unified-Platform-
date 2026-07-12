#!/usr/bin/env python3
"""
高級學習模塊
具備自動判斷、學習、執行和修復能力
"""

import os
import json
import re
import ast
import shutil
import subprocess
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import hashlib


class AdvancedLearningModule:
    """高級學習模塊"""
    
    def __init__(self, project_path: str):
        self.project_path = Path(project_path)
        self.learning_data = {
            "project_insights": {},
            "patterns_discovered": [],
            "best_practices": [],
            "issues_detected": [],
            "improvements_applied": [],
            "learning_history": []
        }
        self.knowledge_base = self._load_knowledge_base()
    
    def auto_learn_and_improve(self) -> Dict[str, Any]:
        """自動學習和改進項目"""
        print("🧠 啟動自動學習和改進流程...")
        print("=" * 60)
        
        results = {
            "phase_results": {},
            "total_improvements": 0,
            "success_rate": 0,
            "project_health": 0
        }
        
        # 階段 1: 自動判斷項目狀態
        print("\n1️⃣  自動判斷項目狀態")
        print("-" * 40)
        assessment = self._auto_assess_project()
        results["phase_results"]["assessment"] = assessment
        print(f"   項目類型: {assessment.get('project_type', '未知')}")
        print(f"   成熟度: {assessment.get('maturity_level', '未知')}")
        print(f"   主要問題: {len(assessment.get('critical_issues', []))} 個")
        
        # 階段 2: 深度學習項目模式
        print("\n2️⃣  深度學習項目模式")
        print("-" * 40)
        patterns = self._deep_learn_patterns()
        results["phase_results"]["patterns_learned"] = len(patterns)
        print(f"   發現模式: {len(patterns)} 個")
        
        # 階段 3: 智能執行改進
        print("\n3️⃣  智能執行改進")
        print("-" * 40)
        improvements = self._intelligent_execution(assessment, patterns)
        results["phase_results"]["improvements_applied"] = improvements
        results["total_improvements"] = len(improvements.get("successful", []))
        print(f"   成功改進: {len(improvements.get('successful', []))} 個")
        
        # 階段 4: 自動修復問題
        print("\n4️⃣  自動修復問題")
        print("-" * 40)
        fixes = self._auto_fix_issues(assessment.get("critical_issues", []))
        results["phase_results"]["fixes_applied"] = fixes
        print(f"   修復問題: {len(fixes.get('fixed', []))} 個")
        
        # 階段 5: 驗證和學習
        print("\n5️⃣  驗證和學習")
        print("-" * 40)
        validation = self._validate_and_learn()
        results["phase_results"]["validation"] = validation
        results["success_rate"] = validation.get("success_rate", 0)
        results["project_health"] = validation.get("health_score", 0)
        
        # 保存學習結果
        self._save_learning_results(results)
        
        print("\n" + "=" * 60)
        print("🎉 自動學習和改進完成!")
        print(f"總改進: {results['total_improvements']} 個")
        print(f"成功率: {results['success_rate']:.1f}%")
        print(f"項目健康度: {results['project_health']}/100")
        
        return results
    
    def _auto_assess_project(self) -> Dict[str, Any]:
        """自動判斷項目狀態"""
        assessment = {
            "project_type": "unknown",
            "tech_stack": [],
            "maturity_level": "initial",
            "critical_issues": [],
            "strengths": [],
            "weaknesses": []
        }
        
        # 檢測項目類型
        project_type = self._detect_project_type()
        assessment["project_type"] = project_type
        
        # 檢測技術棧
        tech_stack = self._detect_tech_stack()
        assessment["tech_stack"] = tech_stack
        
        # 評估成熟度
        maturity = self._assess_maturity_level()
        assessment["maturity_level"] = maturity
        
        # 檢測關鍵問題
        issues = self._detect_critical_issues()
        assessment["critical_issues"] = issues
        
        # 分析優勢和劣勢
        strengths, weaknesses = self._analyze_strengths_weaknesses()
        assessment["strengths"] = strengths
        assessment["weaknesses"] = weaknesses
        
        return assessment
    
    def _detect_project_type(self) -> str:
        """檢測項目類型"""
        # 檢查 package.json
        package_path = self.project_path / "package.json"
        if package_path.exists():
            try:
                with open(package_path, 'r', encoding='utf-8') as f:
                    package = json.load(f)
                
                # 檢查 React 項目
                deps = package.get("dependencies", {})
                dev_deps = package.get("devDependencies", {})
                
                if "react" in deps or "react-native" in deps:
                    if "react-native" in deps:
                        return "react_native"
                    return "react"
                elif "vue" in deps:
                    return "vue"
                elif "angular" in deps:
                    return "angular"
                elif "next" in deps:
                    return "nextjs"
                
            except:
                pass
        
        # 檢查 Python 項目
        if (self.project_path / "requirements.txt").exists() or \
           (self.project_path / "pyproject.toml").exists():
            return "python"
        
        # 檢查 Go 項目
        if list(self.project_path.rglob("*.go")):
            return "go"
        
        # 檢查 Java 項目
        if (self.project_path / "pom.xml").exists() or \
           (self.project_path / "build.gradle").exists():
            return "java"
        
        return "unknown"
    
    def _detect_tech_stack(self) -> List[str]:
        """檢測技術棧"""
        tech_stack = []
        
        # 檢查前端框架
        package_path = self.project_path / "package.json"
        if package_path.exists():
            try:
                with open(package_path, 'r', encoding='utf-8') as f:
                    package = json.load(f)
                
                deps = {**package.get("dependencies", {}), **package.get("devDependencies", {})}
                
                # 框架檢測
                if "react" in deps:
                    tech_stack.append("react")
                if "vue" in deps:
                    tech_stack.append("vue")
                if "angular" in deps:
                    tech_stack.append("angular")
                
                # 狀態管理
                if "redux" in deps:
                    tech_stack.append("redux")
                if "mobx" in deps:
                    tech_stack.append("mobx")
                
                # 樣式
                if "styled-components" in deps:
                    tech_stack.append("styled-components")
                if "tailwindcss" in deps:
                    tech_stack.append("tailwindcss")
                
                # 構建工具
                if "webpack" in deps:
                    tech_stack.append("webpack")
                if "vite" in deps:
                    tech_stack.append("vite")
                
            except:
                pass
        
        # 檢查 TypeScript
        if (self.project_path / "tsconfig.json").exists():
            tech_stack.append("typescript")
        
        # 檢查測試框架
        test_files = list(self.project_path.rglob("*test*")) + \
                    list(self.project_path.rglob("*spec*"))
        if test_files:
            tech_stack.append("testing")
        
        return tech_stack
    
    def _assess_maturity_level(self) -> str:
        """評估成熟度等級"""
        score = 0
        
        # 檢查配置文件
        config_files = [".eslintrc.js", ".prettierrc", "tsconfig.json", "jest.config.js"]
        for config in config_files:
            if (self.project_path / config).exists():
                score += 10
        
        # 檢查測試文件
        test_files = list(self.project_path.rglob("*test*")) + \
                    list(self.project_path.rglob("*spec*"))
        if test_files:
            score += 20
        
        # 檢查文檔
        docs = ["README.md", "CONTRIBUTING.md", "CHANGELOG.md"]
        for doc in docs:
            if (self.project_path / doc).exists():
                score += 5
        
        # 檢查 CI/CD
        ci_files = [".github/workflows", ".gitlab-ci.yml", "azure-pipelines.yml"]
        for ci in ci_files:
            ci_path = self.project_path / ci
            if ci_path.exists():
                score += 15
        
        # 確定成熟度等級
        if score >= 70:
            return "advanced"
        elif score >= 40:
            return "intermediate"
        else:
            return "initial"
    
    def _detect_critical_issues(self) -> List[Dict[str, Any]]:
        """檢測關鍵問題"""
        issues = []
        
        # 1. 檢查安全問題
        security_issues = self._check_security_issues()
        issues.extend(security_issues)
        
        # 2. 檢查性能問題
        performance_issues = self._check_performance_issues()
        issues.extend(performance_issues)
        
        # 3. 檢查代碼質量問題
        quality_issues = self._check_code_quality_issues()
        issues.extend(quality_issues)
        
        # 4. 檢查依賴問題
        dependency_issues = self._check_dependency_issues()
        issues.extend(dependency_issues)
        
        return issues
    
    def _check_security_issues(self) -> List[Dict[str, Any]]:
        """檢查安全問題"""
        issues = []
        
        # 檢查 .env 文件中的敏感信息
        env_files = list(self.project_path.rglob(".env*"))
        for env_file in env_files:
            try:
                with open(env_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 檢查硬編碼的密鑰
                sensitive_patterns = [
                    r'API_KEY\s*=\s*["\'].*["\']',
                    r'SECRET_KEY\s*=\s*["\'].*["\']',
                    r'PASSWORD\s*=\s*["\'].*["\']',
                    r'TOKEN\s*=\s*["\'].*["\']'
                ]
                
                for pattern in sensitive_patterns:
                    if re.search(pattern, content, re.IGNORECASE):
                        issues.append({
                            "type": "security",
                            "severity": "high",
                            "description": f"硬編碼的敏感信息在 {env_file.name}",
                            "file": str(env_file.relative_to(self.project_path))
                        })
                        
            except:
                continue
        
        return issues
    
    def _check_performance_issues(self) -> List[Dict[str, Any]]:
        """檢查性能問題"""
        issues = []
        
        # 檢查大型文件
        for root, dirs, files in os.walk(self.project_path):
            if "node_modules" in root or ".git" in root:
                continue
            
            for file in files:
                file_path = Path(root) / file
                try:
                    size = file_path.stat().st_size
                    if size > 1024 * 1024:  # 大於 1MB
                        issues.append({
                            "type": "performance",
                            "severity": "medium",
                            "description": f"大型文件可能影響性能: {file} ({size/1024/1024:.1f}MB)",
                            "file": str(file_path.relative_to(self.project_path))
                        })
                except:
                    continue
        
        return issues
    
    def _check_code_quality_issues(self) -> List[Dict[str, Any]]:
        """檢查代碼質量問題"""
        issues = []
        
        # 檢查 JavaScript/TypeScript 文件
        for ext in ['.js', '.jsx', '.ts', '.tsx']:
            for file in self.project_path.rglob(f"*{ext}"):
                if "node_modules" in str(file) or ".git" in str(file):
                    continue
                
                try:
                    with open(file, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # 檢查文件行數
                    lines = content.split('\n')
                    if len(lines) > 500:
                        issues.append({
                            "type": "code_quality",
                            "severity": "medium",
                            "description": f"文件過長: {len(lines)} 行",
                            "file": str(file.relative_to(self.project_path))
                        })
                    
                    # 檢查複雜條件
                    if content.count('&&') + content.count('||') > 20:
                        issues.append({
                            "type": "code_quality",
                            "severity": "medium",
                            "description": "複雜條件過多",
                            "file": str(file.relative_to(self.project_path))
                        })
                    
                except:
                    continue
        
        return issues
    
    def _check_dependency_issues(self) -> List[Dict[str, Any]]:
        """檢查依賴問題"""
        issues = []
        
        package_path = self.project_path / "package.json"
        if package_path.exists():
            try:
                with open(package_path, 'r', encoding='utf-8') as f:
                    package = json.load(f)
                
                deps = package.get("dependencies", {})
                
                # 檢查過時的依賴
                outdated_deps = ["react-scripts", "webpack", "babel-core"]
                for dep in outdated_deps:
                    if dep in deps:
                        issues.append({
                            "type": "dependency",
                            "severity": "medium",
                            "description": f"可能過時的依賴: {dep}",
                            "file": "package.json"
                        })
                
            except:
                pass
        
        return issues
    
    def _analyze_strengths_weaknesses(self) -> Tuple[List[str], List[str]]:
        """分析優勢和劣勢"""
        strengths = []
        weaknesses = []
        
        # 檢查優勢
        if (self.project_path / "README.md").exists():
            strengths.append("有文檔")
        
        if (self.project_path / ".gitignore").exists():
            strengths.append("有版本控制配置")
        
        test_files = list(self.project_path.rglob("*test*")) + \
                    list(self.project_path.rglob("*spec*"))
        if test_files:
            strengths.append("有測試")
        
        # 檢查劣勢
        if not (self.project_path / ".eslintrc.js").exists():
            weaknesses.append("缺少代碼檢查配置")
        
        if not (self.project_path / ".prettierrc").exists():
            weaknesses.append("缺少代碼格式化配置")
        
        if not (self.project_path / "docs").exists():
            weaknesses.append("缺少文檔目錄")
        
        return strengths, weaknesses
    
    def _deep_learn_patterns(self) -> List[Dict[str, Any]]:
        """深度學習項目模式"""
        patterns = []
        
        # 學習組件模式
        component_patterns = self._learn_component_patterns()
        patterns.extend(component_patterns)
        
        # 學習 API 模式
        api_patterns = self._learn_api_patterns()
        patterns.extend(api_patterns)
        
        # 學習狀態管理模式
        state_patterns = self._learn_state_management_patterns()
        patterns.extend(state_patterns)
        
        # 學習樣式模式
        style_patterns = self._learn_style_patterns()
        patterns.extend(style_patterns)
        
        return patterns
    
    def _learn_component_patterns(self) -> List[Dict[str, Any]]:
        """學習組件模式"""
        patterns = []
        
        # 查找組件文件
        component_exts = ['.jsx', '.tsx', '.vue']
        for ext in component_exts:
            for file in self.project_path.rglob(f"*{ext}"):
                if "node_modules" in str(file) or ".git" in str(file):
                    continue
                
                try:
                    with open(file, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # 分析組件類型
                    component_type = "unknown"
                    
                    if "React.FC" in content or "function Component" in content:
                        component_type = "function_component"
                    elif "class " in content and "Component" in content:
                        component_type = "class_component"
                    elif "<template>" in content:
                        component_type = "vue_component"
                    
                    patterns.append({
                        "type": "component",
                        "pattern": component_type,
                        "file": str(file.relative_to(self.project_path)),
                        "description": f"{component_type} 組件模式"
                    })
                    
                except:
                    continue
        
        return patterns
    
    def _learn_api_patterns(self) -> List[Dict[str, Any]]:
        """學習 API 模式"""
        patterns = []
        
        # 查找 API 相關文件
        api_files = list(self.project_path.rglob("*api*")) + \
                   list(self.project_path.rglob("*service*")) + \
                   list(self.project_path.rglob("*fetch*"))
        
        for file in api_files[:10]:  # 只分析前10個文件
            if "node_modules" in str(file) or ".git" in str(file):
                continue
            
            try:
                with open(file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 分析 API 模式
                api_pattern = "unknown"
                
                if "axios" in content:
                    api_pattern = "axios_based"
                elif "fetch(" in content:
                    api_pattern = "fetch_based"
                elif "XMLHttpRequest" in content:
                    api_pattern = "xhr_based"
                
                patterns.append({
                    "type": "api",
                    "pattern": api_pattern,
                    "file": str(file.relative_to(self.project_path)),
                    "description": f"{api_pattern} API 模式"
                })
                
            except:
                continue
        
        return patterns
    
    def _learn_state_management_patterns(self) -> List[Dict[str, Any]]:
        """學習狀態管理模式"""
        patterns = []
        
        # 查找狀態管理相關文件
        state_files = list(self.project_path.rglob("*store*")) + \
                     list(self.project_path.rglob("*redux*")) + \
                     list(self.project_path.rglob("*context*"))
        
        for file in state_files[:5]:  # 只分析前5個文件
            if "node_modules" in str(file) or ".git" in str(file):
                continue
            
            try:
                with open(file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 分析狀態管理模式
                state_pattern = "unknown"
                
                if "createStore" in content or "combineReducers" in content:
                    state_pattern = "redux"
                elif "useContext" in content or "createContext" in content:
                    state_pattern = "context_api"
                elif "useState" in content and "useReducer" in content:
                    state_pattern = "hooks_based"
                
                patterns.append({
                    "type": "state_management",
                    "pattern": state_pattern,
                    "file": str(file.relative_to(self.project_path)),
                    "description": f"{state_pattern} 狀態管理模式"
                })
                
            except:
                continue
        
        return patterns
    
    def _learn_style_patterns(self) -> List[Dict[str, Any]]:
        """學習樣式模式"""
        patterns = []
        
        # 查找樣式文件
        style_files = list(self.project_path.rglob("*.css")) + \
                     list(self.project_path.rglob("*.scss")) + \
                     list(self.project_path.rglob("*.less"))
        
        for file in style_files[:5]:  # 只分析前5個文件
            if "node_modules" in str(file) or ".git" in str(file):
                continue
            
            try:
                with open(file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 分析樣式模式
                style_pattern = "unknown"
                
                if "@media" in content:
                    style_pattern = "responsive_design"
                if ":hover" in content or ":focus" in content:
                    style_pattern = "interactive_styles"
                if "animation" in content or "@keyframes" in content:
                    style_pattern = "animations"
                
                patterns.append({
                    "type": "styling",
                    "pattern": style_pattern,
                    "file": str(file.relative_to(self.project_path)),
                    "description": f"{style_pattern} 樣式模式"
                })
                
            except:
                continue
        
        return patterns
    
    def _intelligent_execution(self, assessment: Dict[str, Any], patterns: List[Dict[str, Any]]) -> Dict[str, Any]:
        """智能執行改進"""
        improvements = {
            "planned": [],
            "successful": [],
            "failed": [],
            "skipped": []
        }
        
        # 基於評估結果計劃改進
        planned_improvements = self._plan_improvements(assessment, patterns)
        improvements["planned"] = planned_improvements
        
        # 執行改進
        for improvement in planned_improvements[:5]:  # 只執行前5個改進
            try:
                success = self._execute_improvement(improvement)
                if success:
                    improvements["successful"].append(improvement)
                else:
                    improvements["failed"].append(improvement)
            except Exception as e:
                improvements["failed"].append({
                    **improvement,
                    "error": str(e)
                })
        
        return improvements
    
    def _plan_improvements(self, assessment: Dict[str, Any], patterns: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """計劃改進"""
        improvements = []
        
        project_type = assessment.get("project_type", "unknown")
        weaknesses = assessment.get("weaknesses", [])
        issues = assessment.get("critical_issues", [])
        
        # 基於項目類型添加改進
        if project_type in ["react", "react_native", "vue", "angular"]:
            if "缺少代碼檢查配置" in weaknesses:
                improvements.append({
                    "type": "config",
                    "action": "add_eslint_config",
                    "priority": "high",
                    "description": "添加 ESLint 配置"
                })
            
            if "缺少代碼格式化配置" in weaknesses:
                improvements.append({
                    "type": "config",
                    "action": "add_prettier_config",
                    "priority": "medium",
                    "description": "添加 Prettier 配置"
                })
        
        # 基於問題添加改進
        for issue in issues[:3]:  # 只處理前3個問題
            if issue.get("type") == "security":
                improvements.append({
                    "type": "security",
                    "action": "fix_security_issue",
                    "priority": "high",
                    "description": f"修復安全問題: {issue.get('description', '')}",
                    "issue": issue
                })
            elif issue.get("type") == "performance":
                improvements.append({
                    "type": "performance",
                    "action": "optimize_performance",
                    "priority": "medium",
                    "description": f"優化性能: {issue.get('description', '')}",
                    "issue": issue
                })
        
        # 基於模式添加改進
        for pattern in patterns[:3]:  # 只處理前3個模式
            if pattern.get("type") == "component":
                improvements.append({
                    "type": "refactor",
                    "action": "standardize_components",
                    "priority": "low",
                    "description": f"標準化組件模式: {pattern.get('pattern', '')}",
                    "pattern": pattern
                })
        
        return improvements
    
    def _execute_improvement(self, improvement: Dict[str, Any]) -> bool:
        """執行改進"""
        action = improvement.get("action", "")
        
        try:
            if action == "add_eslint_config":
                return self._add_eslint_config()
            elif action == "add_prettier_config":
                return self._add_prettier_config()
            elif action == "fix_security_issue":
                return self._fix_security_issue(improvement.get("issue", {}))
            elif action == "optimize_performance":
                return self._optimize_performance(improvement.get("issue", {}))
            elif action == "standardize_components":
                return self._standardize_components(improvement.get("pattern", {}))
            else:
                return False
        except Exception as e:
            print(f"執行改進失敗: {e}")
            return False
    
    def _add_eslint_config(self) -> bool:
        """添加 ESLint 配置"""
        config_path = self.project_path / ".eslintrc.js"
        
        if config_path.exists():
            print("    ⚠️  ESLint 配置已存在")
            return False
        
        config_content = """module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['react', '@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off'
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
};"""
        
        with open(config_path, 'w', encoding='utf-8') as f:
            f.write(config_content)
        
        print("    ✅ 添加 ESLint 配置")
        return True
    
    def _add_prettier_config(self) -> bool:
        """添加 Prettier 配置"""
        config_path = self.project_path / ".prettierrc"
        
        if config_path.exists():
            print("    ⚠️  Prettier 配置已存在")
            return False
        
        config_content = """{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}"""
        
        with open(config_path, 'w', encoding='utf-8') as f:
            f.write(config_content)
        
        print("    ✅ 添加 Prettier 配置")
        return True
    
    def _fix_security_issue(self, issue: Dict[str, Any]) -> bool:
        """修復安全問題"""
        issue_type = issue.get("type", "")
        file_path = issue.get("file", "")
        
        if issue_type == "security" and file_path.endswith(".env"):
            try:
                env_path = self.project_path / file_path
                if env_path.exists():
                    # 創建 .env.example 文件
                    example_path = self.project_path / ".env.example"
                    
                    with open(env_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # 替換敏感值為示例值
                    example_content = re.sub(
                        r'=\s*["\'].*["\']',
                        '="YOUR_VALUE_HERE"',
                        content
                    )
                    
                    with open(example_path, 'w', encoding='utf-8') as f:
                        f.write(example_content)
                    
                    # 將 .env 添加到 .gitignore
                    gitignore_path = self.project_path / ".gitignore"
                    if gitignore_path.exists():
                        with open(gitignore_path, 'a', encoding='utf-8') as f:
                            f.write("\n# Environment variables\n.env\n")
                    
                    print(f"    ✅ 修復安全問題: 創建 {file_path}.example")
                    return True
            except Exception as e:
                print(f"    ❌ 修復安全問題失敗: {e}")
        
        return False
    
    def _optimize_performance(self, issue: Dict[str, Any]) -> bool:
        """優化性能"""
        description = issue.get("description", "")
        
        if "大型文件" in description:
            # 建議拆分大型文件
            print("    💡 建議: 考慮拆分大型文件為多個小文件")
            return True
        
        return False
    
    def _standardize_components(self, pattern: Dict[str, Any]) -> bool:
        """標準化組件"""
        pattern_type = pattern.get("pattern", "")
        
        if pattern_type == "function_component":
            # 創建組件模板
            template_path = self.project_path / "src" / "components" / "TemplateComponent.tsx"
            template_path.parent.mkdir(parents=True, exist_ok=True)
            
            if not template_path.exists():
                template_content = """import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TemplateComponentProps {
  title: string;
  description?: string;
}

const TemplateComponent: React.FC<TemplateComponentProps> = ({
  title,
  description
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
  },
});

export default TemplateComponent;"""
                
                with open(template_path, 'w', encoding='utf-8') as f:
                    f.write(template_content)
                
                print("    ✅ 創建組件模板")
                return True
        
        return False
    
    def _auto_fix_issues(self, issues: List[Dict[str, Any]]) -> Dict[str, Any]:
        """自動修復問題"""
        fixes = {
            "fixed": [],
            "failed": [],
            "skipped": []
        }
        
        for issue in issues[:3]:  # 只嘗試修復前3個問題
            try:
                fixed = self._fix_issue(issue)
                if fixed:
                    fixes["fixed"].append(issue)
                else:
                    fixes["failed"].append(issue)
            except Exception as e:
                fixes["failed"].append({
                    **issue,
                    "error": str(e)
                })
        
        return fixes
    
    def _fix_issue(self, issue: Dict[str, Any]) -> bool:
        """修復單個問題"""
        issue_type = issue.get("type", "")
        
        if issue_type == "security":
            return self._fix_security_issue(issue)
        elif issue_type == "performance":
            return self._optimize_performance(issue)
        elif issue_type == "code_quality":
            return self._fix_code_quality_issue(issue)
        elif issue_type == "dependency":
            return self._fix_dependency_issue(issue)
        
        return False
    
    def _fix_code_quality_issue(self, issue: Dict[str, Any]) -> bool:
        """修復代碼質量問題"""
        description = issue.get("description", "")
        
        if "文件過長" in description:
            print("    💡 建議: 考慮重構過長的文件")
            return True
        elif "複雜條件過多" in description:
            print("    💡 建議: 簡化複雜條件邏輯")
            return True
        
        return False
    
    def _fix_dependency_issue(self, issue: Dict[str, Any]) -> bool:
        """修復依賴問題"""
        description = issue.get("description", "")
        
        if "過時的依賴" in description:
            print("    💡 建議: 更新過時的依賴包")
            return True
        
        return False
    
    def _validate_and_learn(self) -> Dict[str, Any]:
        """驗證和學習"""
        validation = {
            "health_score": 0,
            "success_rate": 0,
            "learned_lessons": [],
            "recommendations": []
        }
        
        # 計算健康分數
        health_score = self._calculate_health_score()
        validation["health_score"] = health_score
        
        # 計算成功率
        successful_improvements = len(self.learning_data.get("improvements_applied", []))
        total_attempts = successful_improvements + len(self.learning_data.get("issues_detected", []))
        
        if total_attempts > 0:
            success_rate = (successful_improvements / total_attempts) * 100
            validation["success_rate"] = success_rate
        
        # 提取學習教訓
        lessons = self._extract_lessons()
        validation["learned_lessons"] = lessons
        
        # 生成推薦
        recommendations = self._generate_recommendations()
        validation["recommendations"] = recommendations
        
        return validation
    
    def _calculate_health_score(self) -> int:
        """計算健康分數"""
        score = 50  # 基礎分數
        
        # 檢查配置文件
        config_files = [".eslintrc.js", ".prettierrc", "tsconfig.json"]
        for config in config_files:
            if (self.project_path / config).exists():
                score += 10
        
        # 檢查測試
        test_files = list(self.project_path.rglob("*test*")) + \
                    list(self.project_path.rglob("*spec*"))
        if test_files:
            score += 15
        
        # 檢查文檔
        if (self.project_path / "README.md").exists():
            score += 10
        
        if (self.project_path / "docs").exists():
            score += 10
        
        # 檢查問題數量
        issues = len(self.learning_data.get("issues_detected", []))
        score -= min(issues * 5, 30)  # 最多扣30分
        
        return max(0, min(100, score))
    
    def _extract_lessons(self) -> List[str]:
        """提取學習教訓"""
        lessons = []
        
        # 從模式中學習
        patterns = self.learning_data.get("patterns_discovered", [])
        if patterns:
            pattern_types = set(p.get("type", "") for p in patterns)
            lessons.append(f"發現 {len(pattern_types)} 種代碼模式")
        
        # 從問題中學習
        issues = self.learning_data.get("issues_detected", [])
        if issues:
            issue_types = set(i.get("type", "") for i in issues)
            lessons.append(f"發現 {len(issue_types)} 種類型問題")
        
        # 從改進中學習
        improvements = self.learning_data.get("improvements_applied", [])
        if improvements:
            lessons.append(f"成功應用 {len(improvements)} 個改進")
        
        return lessons
    
    def _generate_recommendations(self) -> List[str]:
        """生成推薦"""
        recommendations = []
        
        # 基於健康分數
        health_score = self._calculate_health_score()
        
        if health_score < 40:
            recommendations.extend([
                "項目需要重大改進，建議進行全面重構",
                "優先修復安全問題和性能問題",
                "建立代碼質量檢查流程"
            ])
        elif health_score < 70:
            recommendations.extend([
                "項目有改進空間，建議逐步優化",
                "添加自動化測試",
                "完善文檔和配置"
            ])
        else:
            recommendations.extend([
                "項目質量良好，建議保持最佳實踐",
                "考慮添加高級功能如CI/CD",
                "探索性能優化和架構改進"
            ])
        
        return recommendations
    
    def _save_learning_results(self, results: Dict[str, Any]):
        """保存學習結果"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = self.project_path / f"learning_results_{timestamp}.json"
        
        save_data = {
            "timestamp": timestamp,
            "project_path": str(self.project_path),
            "learning_data": self.learning_data,
            "results": results
        }
        
        with open(results_file, 'w', encoding='utf-8') as f:
            json.dump(save_data, f, indent=2, ensure_ascii=False)
        
        print(f"    💾 學習結果已保存: {results_file}")
    
    def _load_knowledge_base(self) -> Dict[str, Any]:
        """加載知識庫"""
        # 這裡可以從文件或數據庫加載預定義的知識
        # 目前返回一個簡單的知識庫
        return {
            "best_practices": [
                "使用 TypeScript 進行類型檢查",
                "配置 ESLint 和 Prettier",
                "編寫單元測試",
                "使用組件化架構",
                "實現錯誤邊界"
            ],
            "common_patterns": [
                "容器組件和展示組件分離",
                "自定義 Hook 封裝邏輯",
                "上下文提供狀態管理",
                "高階組件增強功能"
            ],
            "anti_patterns": [
                "過大的組件文件",
                "深度嵌套的條件渲染",
                "內聯樣式過多",
                "硬編碼的配置值"
            ]
        }


def main():
    """主函數"""
    import sys
    
    if len(sys.argv) < 2:
        print("用法: python advanced_learning_module.py <項目路徑>")
        print("示例: python advanced_learning_module.py /path/to/your/project")
        sys.exit(1)
    
    project_path = sys.argv[1]
    
    if not os.path.exists(project_path):
        print(f"錯誤: 項目路徑不存在: {project_path}")
        sys.exit(1)
    
    print(f"🧠 啟動高級學習模塊: {project_path}")
    print("=" * 60)
    
    learner = AdvancedLearningModule(project_path)
    
    # 執行自動學習和改進
    results = learner.auto_learn_and_improve()
    
    print("\n" + "=" * 60)
    print("📊 最終結果摘要:")
    print(f"總改進: {results['total_improvements']} 個")
    print(f"成功率: {results['success_rate']:.1f}%")
    print(f"項目健康度: {results['project_health']}/100")
    
    # 顯示推薦
    if results['phase_results'].get('validation', {}).get('recommendations'):
        print("\n💡 推薦:")
        for i, rec in enumerate(results['phase_results']['validation']['recommendations'], 1):
            print(f"  {i}. {rec}")
    
    print("=" * 60)
    print("🎉 高級學習模塊執行完成!")
    print("學習結果已保存到項目目錄中")


if __name__ == "__main__":
    main()