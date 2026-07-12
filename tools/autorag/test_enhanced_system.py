#!/usr/bin/env python3
"""
測試增強版 RAG 系統
"""

import os
import sys
import tempfile
import shutil
from pathlib import Path

# 添加模塊路徑
sys.path.insert(0, str(Path(__file__).parent))

def create_test_project():
    """創建測試項目"""
    # 創建臨時目錄
    temp_dir = tempfile.mkdtemp(prefix="test_project_")
    project_path = Path(temp_dir) / "test-react-app"
    project_path.mkdir(parents=True, exist_ok=True)
    
    print(f"創建測試項目: {project_path}")
    
    # 創建 package.json
    package_json = {
        "name": "test-react-app",
        "version": "1.0.0",
        "description": "測試 React 應用",
        "main": "index.js",
        "scripts": {
            "start": "react-scripts start",
            "build": "react-scripts build",
            "test": "react-scripts test"
        },
        "dependencies": {
            "react": "^18.2.0",
            "react-dom": "^18.2.0",
            "react-scripts": "5.0.1"
        },
        "devDependencies": {
            "@types/react": "^18.0.28",
            "@types/react-dom": "^18.0.11"
        }
    }
    
    with open(project_path / "package.json", "w", encoding="utf-8") as f:
        import json
        json.dump(package_json, f, indent=2)
    
    # 創建 README.md
    readme_content = """# 測試 React 應用

這是一個用於測試的 React 應用程序。

## 功能
- 基礎 React 組件
- 簡單的狀態管理
- 基本樣式

## 安裝
\`\`\`bash
npm install
\`\`\`

## 運行
\`\`\`bash
npm start
\`\`\`
"""
    
    with open(project_path / "README.md", "w", encoding="utf-8") as f:
        f.write(readme_content)
    
    # 創建 src 目錄和文件
    src_dir = project_path / "src"
    src_dir.mkdir(exist_ok=True)
    
    # 創建 App.js
    app_content = """import React from 'react';
import './App.css';

function App() {
  const [count, setCount] = React.useState(0);
  
  const handleIncrement = () => {
    setCount(count + 1);
  };
  
  const handleDecrement = () => {
    setCount(count - 1);
  };
  
  return (
    <div className="App">
      <header className="App-header">
        <h1>測試 React 應用</h1>
        <p>計數器: {count}</p>
        <div className="buttons">
          <button onClick={handleIncrement}>增加</button>
          <button onClick={handleDecrement}>減少</button>
        </div>
      </header>
    </div>
  );
}

export default App;
"""
    
    with open(src_dir / "App.js", "w", encoding="utf-8") as f:
        f.write(app_content)
    
    # 創建 App.css
    css_content = """.App {
  text-align: center;
  font-family: Arial, sans-serif;
}

.App-header {
  background-color: #282c34;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
  color: white;
}

.buttons {
  margin-top: 20px;
}

button {
  background-color: #61dafb;
  border: none;
  color: white;
  padding: 10px 20px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
  border-radius: 4px;
}

button:hover {
  background-color: #4fa3d1;
}
"""
    
    with open(src_dir / "App.css", "w", encoding="utf-8") as f:
        f.write(css_content)
    
    # 創建 index.js
    index_content = """import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
"""
    
    with open(src_dir / "index.js", "w", encoding="utf-8") as f:
        f.write(index_content)
    
    # 創建 .env 文件（包含敏感信息用於測試安全檢查）
    env_content = """API_KEY="test_api_key_12345"
SECRET_KEY="super_secret_key_67890"
DATABASE_URL="postgres://user:password@localhost:5432/db"
"""
    
    with open(project_path / ".env", "w", encoding="utf-8") as f:
        f.write(env_content)
    
    print(f"測試項目創建完成: {project_path}")
    print(f"包含文件:")
    print(f"  - package.json")
    print(f"  - README.md")
    print(f"  - src/App.js")
    print(f"  - src/App.css")
    print(f"  - src/index.js")
    print(f"  - .env (包含測試敏感信息)")
    
    return str(project_path)

def test_processing_module():
    """測試處理模塊"""
    print("\n" + "=" * 60)
    print("測試處理模塊")
    print("=" * 60)
    
    try:
        from modules.processing_module_simple import ProcessingModule
        
        # 創建測試項目
        test_project = create_test_project()
        
        # 創建處理模塊實例
        processor = ProcessingModule(test_project)
        
        # 創建測試數據
        test_data = {
            "project_info": {"name": "測試項目", "path": test_project},
            "overall_assessment": {"overall_score": 75},
            "code_quality_analysis": {
                "overall_score": 70,
                "style": {"score": 80},
                "complexity": {"score": 60},
                "issues": [
                    {"severity": "warning", "description": "代碼風格問題"},
                    {"severity": "info", "description": "建議添加註釋"}
                ]
            },
            "dependency_analysis": {
                "dependencies": [
                    {"name": "react", "is_outdated": True},
                    {"name": "react-dom", "has_security_issues": False}
                ]
            },
            "project_structure": {
                "missing_standard_dirs": ["src/components", "src/utils"],
                "missing_config_files": [".eslintrc.js", ".prettierrc"]
            }
        }
        
        # 測試處理項目數據
        print("執行處理項目數據...")
        results = processor.process_project(test_data)
        
        print(f"處理完成:")
        print(f"  質量分數: {results.get('quality_metrics', {}).get('overall_score', 0)}")
        print(f"  優化計劃: {len(results.get('optimizations', []))} 個")
        
        # 測試應用優化
        optimizations = results.get("optimizations", [])
        if optimizations:
            print("應用優化...")
            optimization_results = processor.optimize_project(optimizations[:2])  # 只應用前2個
            print(f"  優化應用: {optimization_results.get('optimizations_applied', 0)} 個")
        
        # 測試驗證
        validation = processor.validate_processing()
        print(f"驗證結果: {'✅ 有效' if validation.get('is_valid', False) else '❌ 無效'}")
        print(f"成功率: {validation.get('success_rate', 0):.1f}%")
        
        # 清理測試項目
        shutil.rmtree(Path(test_project).parent)
        print("測試完成，已清理測試項目")
        
        return True
        
    except Exception as e:
        print(f"測試處理模塊失敗: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_advanced_learning_module():
    """測試高級學習模塊"""
    print("\n" + "=" * 60)
    print("測試高級學習模塊")
    print("=" * 60)
    
    try:
        from modules.advanced_learning_module import AdvancedLearningModule
        
        # 創建測試項目
        test_project = create_test_project()
        
        # 創建高級學習模塊實例
        learner = AdvancedLearningModule(test_project)
        
        # 測試自動學習和改進
        print("執行自動學習和改進...")
        results = learner.auto_learn_and_improve()
        
        print(f"學習完成:")
        print(f"  總改進: {results.get('total_improvements', 0)} 個")
        print(f"  成功率: {results.get('success_rate', 0):.1f}%")
        print(f"  項目健康度: {results.get('project_health', 0)}/100")
        
        # 檢查生成的報告
        project_path = Path(test_project)
        learning_files = list(project_path.glob("learning_results_*.json"))
        if learning_files:
            print(f"  學習報告: {len(learning_files)} 個")
        
        # 清理測試項目
        shutil.rmtree(Path(test_project).parent)
        print("測試完成，已清理測試項目")
        
        return True
        
    except Exception as e:
        print(f"測試高級學習模塊失敗: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_enhanced_system():
    """測試增強版系統"""
    print("\n" + "=" * 60)
    print("測試增強版系統")
    print("=" * 60)
    
    try:
        from main_enhanced import EnhancedRAGSystem
        
        # 創建測試項目
        test_project = create_test_project()
        
        print(f"使用測試項目: {test_project}")
        print("注意: 完整測試可能需要幾分鐘時間...")
        
        # 創建增強版系統實例
        system = EnhancedRAGSystem(test_project)
        
        # 運行增強版分析（只運行前幾個階段以節省時間）
        print("\n運行增強版分析（簡化版）...")
        
        # 只運行 RAG 分析
        print("1. RAG 分析...")
        analysis_report = system._run_rag_analysis()
        
        if analysis_report:
            print(f"  分析完成，分數: {analysis_report.get('overall_assessment', {}).get('overall_score', 0):.1f}")
            
            # 只運行數據處理
            print("2. 數據處理...")
            system.analysis_report = analysis_report
            processed_data = system._run_data_processing()
            
            if processed_data:
                print(f"  處理完成，質量分數: {processed_data.get('quality_metrics', {}).get('overall_score', 0)}")
        
        print("\n增強版系統測試完成（簡化版）")
        print("完整測試請運行: python main_enhanced.py <項目路徑>")
        
        # 清理測試項目
        shutil.rmtree(Path(test_project).parent)
        print("已清理測試項目")
        
        return True
        
    except Exception as e:
        print(f"測試增強版系統失敗: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """主測試函數"""
    print("開始測試增強版 RAG 系統")
    print("=" * 60)
    
    # 測試處理模塊
    processing_passed = test_processing_module()
    
    # 測試高級學習模塊
    learning_passed = test_advanced_learning_module()
    
    # 測試增強版系統
    system_passed = test_enhanced_system()
    
    # 總結測試結果
    print("\n" + "=" * 60)
    print("測試結果總結")
    print("=" * 60)
    print(f"處理模塊: {'✅ 通過' if processing_passed else '❌ 失敗'}")
    print(f"高級學習模塊: {'✅ 通過' if learning_passed else '❌ 失敗'}")
    print(f"增強版系統: {'✅ 通過' if system_passed else '❌ 失敗'}")
    
    all_passed = processing_passed and learning_passed and system_passed
    print(f"\n總體結果: {'🎉 所有測試通過!' if all_passed else '⚠️  部分測試失敗'}")
    
    if all_passed:
        print("\n下一步:")
        print("1. 使用完整項目測試增強版系統:")
        print("   python main_enhanced.py /path/to/your/project")
        print("\n2. 查看生成的報告:")
        print("   - output/ 目錄中的 JSON 文件")
        print("   - 桌面上的摘要文件")
    
    return all_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)