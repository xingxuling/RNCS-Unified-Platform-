#!/usr/bin/env python3
"""
學習模塊
從項目中學習模式和最佳實踐
"""

import os
import json
import re
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime

class LearningModule:
    """學習模塊"""
    
    def __init__(self, project_path: str):
        self.project_path = Path(project_path)
        self.knowledge = {
            "patterns": [],
            "best_practices": [],
            "code_smells": [],
            "components": [],
            "structure": {}
        }
    
    def learn_from_project(self) -> Dict[str, Any]:
        """從項目中學習"""
        print("🧠 從項目中學習...")
        
        results = {
            "patterns_found": 0,
            "best_practices": 0,
            "code_smells": 0,
            "components_analyzed": 0,
            "health_score": 0
        }
        
        # 學習項目結構
        print("  📁 分析項目結構...")
        self._analyze_structure()
        
        # 學習代碼模式
        print("  🔍 學習代碼模式...")
        patterns = self._learn_patterns()
        results["patterns_found"] = len(patterns)
        
        # 提取最佳實踐
        print("  ✅ 提取最佳實踐...")
        practices = self._extract_practices()
        results["best_practices"] = len(practices)
        
        # 檢測代碼異味
        print("  👃 檢測代碼異味...")
        smells = self._detect_smells()
        results["code_smells"] = len(smells)
        
        # 分析組件
        print("  🧩 分析組件...")
        components = self._analyze_components()
        results["components_analyzed"] = len(components)
        
        # 計算健康分數
        results["health_score"] = self._calculate_health_score()
        
        # 保存學習結果
        self._save_knowledge()
        
        return results
    
    def get_suggestions(self) -> List[Dict[str, Any]]:
        """獲取改進建議"""
        suggestions = []
        
        # 基於代碼異味的建議
        if self.knowledge["code_smells"]:
            suggestion = {
                "type": "code_quality",
                "title": "修復代碼異味",
                "description": f"發現 {len(self.knowledge['code_smells'])} 個代碼異味需要修復",
                "priority": "high",
                "action": "運行代碼質量檢查並重構"
            }
            suggestions.append(suggestion)
        
        # 基於最佳實踐的建議
        practices = self.knowledge["best_practices"]
        if "has_test_scripts" not in practices:
            suggestion = {
                "type": "testing",
                "title": "添加測試腳本",
                "description": "項目缺少測試配置",
                "priority": "medium",
                "action": "在 package.json 中添加測試腳本"
            }
            suggestions.append(suggestion)
        
        if "has_lint_scripts" not in practices:
            suggestion = {
                "type": "code_quality",
                "title": "添加代碼檢查",
                "description": "項目缺少代碼檢查配置",
                "priority": "medium",
                "action": "配置 ESLint 和 Prettier"
            }
            suggestions.append(suggestion)
        
        # 基於項目結構的建議
        structure = self.knowledge["structure"]
        if "missing_dirs" in structure and structure["missing_dirs"]:
            suggestion = {
                "type": "structure",
                "title": "完善項目結構",
                "description": f"建議添加 {len(structure['missing_dirs'])} 個標準目錄",
                "priority": "low",
                "action": "創建缺失的目錄結構"
            }
            suggestions.append(suggestion)
        
        return suggestions
    
    def apply_learned_knowledge(self) -> Dict[str, Any]:
        """應用學習到的知識"""
        print("🚀 應用學習到的知識...")
        
        results = {
            "improvements_made": [],
            "files_created": 0,
            "configs_updated": 0
        }
        
        # 1. 完善項目結構
        print("  📁 完善項目結構...")
        structure_applied = self._apply_structure_improvements()
        if structure_applied:
            results["improvements_made"].append("完善項目結構")
        
        # 2. 添加最佳實踐配置
        print("  ⚙️  添加最佳實踐配置...")
        configs_added = self._add_best_practice_configs()
        results["configs_updated"] = configs_added
        
        # 3. 創建學習報告
        print("  📄 創建學習報告...")
        report_created = self._create_learning_report()
        if report_created:
            results["files_created"] += 1
            results["improvements_made"].append("創建學習報告")
        
        return results
    
    def _analyze_structure(self):
        """分析項目結構"""
        structure = {
            "dirs_present": [],
            "missing_dirs": [],
            "file_types": {}
        }
        
        # 檢查標準目錄
        standard_dirs = [
            "src/components",
            "src/screens",
            "src/utils",
            "src/hooks",
            "tests",
            "docs"
        ]
        
        for dir_path in standard_dirs:
            full_path = self.project_path / dir_path
            if full_path.exists():
                structure["dirs_present"].append(dir_path)
            else:
                structure["missing_dirs"].append(dir_path)
        
        # 統計文件類型
        for root, dirs, files in os.walk(self.project_path):
            if "node_modules" in root:
                continue
            
            for file in files:
                ext = os.path.splitext(file)[1]
                if ext:
                    structure["file_types"][ext] = structure["file_types"].get(ext, 0) + 1
        
        self.knowledge["structure"] = structure
    
    def _learn_patterns(self) -> List[str]:
        """學習代碼模式"""
        patterns = []
        
        # 查找代碼文件
        code_files = []
        for ext in ['.js', '.jsx', '.ts', '.tsx']:
            code_files.extend(list(self.project_path.rglob(f"*{ext}")))
        
        for file in code_files[:10]:  # 分析前10個文件
            try:
                with open(file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 分析導入模式
                imports = re.findall(r'import\s+.*?from\s+[\'\"](.*?)[\'\"]', content)
                for imp in imports[:3]:
                    patterns.append(f"import_from_{imp}")
                
                # 分析組件模式
                if "React.FC" in content:
                    patterns.append("react_function_component")
                elif "class " in content and "Component" in content:
                    patterns.append("react_class_component")
                
            except:
                continue
        
        self.knowledge["patterns"] = patterns
        return patterns
    
    def _extract_practices(self) -> List[str]:
        """提取最佳實踐"""
        practices = []
        
        # 檢查 package.json
        package_path = self.project_path / "package.json"
        if package_path.exists():
            try:
                with open(package_path, 'r', encoding='utf-8') as f:
                    package = json.load(f)
                
                # 檢查腳本
                scripts = package.get("scripts", {})
                if "test" in scripts:
                    practices.append("has_test_scripts")
                if "lint" in scripts:
                    practices.append("has_lint_scripts")
                if "build" in scripts:
                    practices.append("has_build_scripts")
                
                # 檢查依賴
                deps = package.get("dependencies", {})
                dev_deps = package.get("devDependencies", {})
                
                if "react" in deps:
                    practices.append("uses_react")
                if "typescript" in dev_deps:
                    practices.append("uses_typescript")
                
            except:
                pass
        
        # 檢查配置文件
        configs = [".eslintrc.js", ".prettierrc", "tsconfig.json"]
        for config in configs:
            if (self.project_path / config).exists():
                practices.append(f"has_{config}")
        
        self.knowledge["best_practices"] = practices
        return practices
    
    def _detect_smells(self) -> List[str]:
        """檢測代碼異味"""
        smells = []
        
        # 查找代碼文件
        code_files = []
        for ext in ['.js', '.jsx', '.ts', '.tsx']:
            code_files.extend(list(self.project_path.rglob(f"*{ext}")))
        
        for file in code_files[:5]:  # 檢查前5個文件
            try:
                with open(file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 檢測長文件（超過200行）
                lines = content.split('\n')
                if len(lines) > 200:
                    smells.append(f"long_file_{file.name}")
                
                # 檢測複雜條件
                if content.count('&&') + content.count('||') > 10:
                    smells.append(f"complex_conditions_{file.name}")
                
            except:
                continue
        
        self.knowledge["code_smells"] = smells
        return smells
    
    def _analyze_components(self) -> List[Dict[str, Any]]:
        """分析組件"""
        components = []
        
        # 查找組件文件
        component_files = list(self.project_path.rglob("*Component*")) + \
                         list(self.project_path.rglob("*Screen*"))
        
        for file in component_files[:5]:  # 分析前5個組件
            try:
                size_kb = os.path.getsize(file) / 1024
                
                component = {
                    "name": file.stem,
                    "path": str(file.relative_to(self.project_path)),
                    "size_kb": round(size_kb, 2),
                    "has_props": False,
                    "has_styles": False
                }
                
                with open(file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                if "props" in content or "Props" in content:
                    component["has_props"] = True
                
                if "style=" in content or "StyleSheet" in content:
                    component["has_styles"] = True
                
                components.append(component)
                
            except:
                continue
        
        self.knowledge["components"] = components
        return components
    
    def _calculate_health_score(self) -> int:
        """計算健康分數"""
        score = 50
        
        # 基於最佳實踐加分
        practices = self.knowledge["best_practices"]
        if "has_test_scripts" in practices:
            score += 10
        if "has_lint_scripts" in practices:
            score += 10
        if "uses_typescript" in practices:
            score += 10
        
        # 基於代碼異味減分
        score -= len(self.knowledge["code_smells"]) * 5
        
        return max(0, min(100, score))
    
    def _save_knowledge(self):
        """保存學習結果"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        knowledge_file = self.project_path / "learned_knowledge.json"
        
        save_data = {
            "project": str(self.project_path),
            "timestamp": timestamp,
            "knowledge": self.knowledge,
            "health_score": self._calculate_health_score()
        }
        
        with open(knowledge_file, 'w', encoding='utf-8') as f:
            json.dump(save_data, f, indent=2, ensure_ascii=False)
        
        print(f"  💾 學習結果已保存: {knowledge_file}")
    
    def _apply_structure_improvements(self) -> bool:
        """應用結構改進"""
        applied = False
        structure = self.knowledge["structure"]
        
        if "missing_dirs" in structure:
            for dir_path in structure["missing_dirs"][:2]:  # 創建前2個缺失目錄
                full_path = self.project_path / dir_path
                if not full_path.exists():
                    full_path.mkdir(parents=True, exist_ok=True)
                    print(f"    ✅ 創建目錄: {dir_path}")
                    applied = True
        
        return applied
    
    def _add_best_practice_configs(self) -> int:
        """添加最佳實踐配置"""
        added = 0
        practices = self.knowledge["best_practices"]
        
        # 添加基礎配置文件
        configs_to_add = []
        
        if "has_.eslintrc.js" not in practices:
            configs_to_add.append((".eslintrc.js", self._create_eslint_config()))
        
        if len(configs_to_add) > 0:
            for filename, content in configs_to_add:
                config_path = self.project_path / filename
                if not config_path.exists():
                    with open(config_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"    ✅ 創建配置文件: {filename}")
                    added += 1
        
        return added
    
    def _create_eslint_config(self) -> str:
        """創建 ESLint 配置"""
        return """module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    'prettier/prettier': 'error',
  },
};"""
    
    def _create_learning_report(self) -> bool:
        """創建學習報告"""
        report_path = self.project_path / "docs" / "learning_report.md"
        report_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write("# 項目學習報告\n\n")
            f.write(f"生成時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            f.write("## 📊 項目概覽\n\n")
            f.write(f"- 健康分數: {self._calculate_health_score()}/100\n")
            f.write(f"- 代碼模式: {len(self.knowledge['patterns'])} 個\n")
            f.write(f"- 最佳實踐: {len(self.knowledge['best_practices'])} 個\n")
            f.write(f"- 代碼異味: {len(self.knowledge['code_smells'])} 個\n\n")
            
            f.write("## 💡 改進建議\n\n")
            suggestions = self.get_suggestions()
            for i, suggestion in enumerate(suggestions, 1):
                f.write(f"{i}. **{suggestion['title']}**\n")
                f.write(f"   - 描述: {suggestion['description']}\n")
                f.write(f"   - 優先級: {suggestion['priority']}\n")
                f.write(f"   - 行動: {suggestion['action']}\n\n")
        
        print(f"    ✅ 創建學習報告: {report_path}")
        return True


def main():
    """主函數"""
    import sys
    
    if len(sys.argv) < 2:
        print("用法: python learning_module.py <項目路徑>")
        sys.exit(1)
    
    project_path = sys.argv[1]
    
    if not os.path.exists(project_path):
        print(f"錯誤: 項目路徑不存在: {project_path}")
        sys.exit(1)
    
    print(f"🎯 開始學習項目: {project_path}")
    print("=" * 50)
    
    learner = LearningModule(project_path)
    
    # 學習項目
    results = learner.learn_from_project()
    
    # 獲取建議
    suggestions = learner.get_suggestions()
    
    # 應用知識
    applied = learner.apply_learned_knowledge()
    
    print("\n" + "=" * 50)
    print("📋 學習結果摘要:")
    print(f"健康分數: {results['health_score']}/100")
    print(f"代碼模式: {results['patterns_found']} 個")
    print(f"最佳實踐: {results['best_practices']} 個")
    print(f"代碼異味: {results['code_smells']} 個")
    print(f"改進建議: {len(suggestions)} 個")
    print(f"應用改進: {len(applied['improvements_made'])} 個")
    print("=" * 50)


if __name__ == "__main__":
    main()