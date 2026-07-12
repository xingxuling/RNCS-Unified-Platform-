#!/bin/bash

# 增強版 RAG 自動化系統使用示例
# 這個腳本演示如何使用增強版系統分析項目

echo "================================================"
echo "增強版 RAG 自動化系統使用示例"
echo "================================================"

# 檢查 Python 版本
echo "檢查 Python 版本..."
python3 --version

# 創建示例項目目錄
EXAMPLE_PROJECT="example_react_project"
echo "創建示例項目: $EXAMPLE_PROJECT"

mkdir -p "$EXAMPLE_PROJECT"
cd "$EXAMPLE_PROJECT" || exit

# 創建 package.json
cat > package.json << 'EOF'
{
  "name": "example-react-app",
  "version": "1.0.0",
  "description": "示例 React 應用程序",
  "main": "src/index.js",
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
    "@testing-library/react": "^13.4.0"
  }
}
EOF

# 創建 README.md
cat > README.md << 'EOF'
# 示例 React 應用

這是一個用於演示的 React 應用程序。

## 功能
- 基礎 React 組件
- 簡單計數器
- 基本樣式

## 安裝
```bash
npm install
```

## 運行
```bash
npm start
```
EOF

# 創建 src 目錄和文件
mkdir -p src

# 創建 App.js
cat > src/App.js << 'EOF'
import React, { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);
  
  const increment = () => {
    setCount(count + 1);
  };
  
  const decrement = () => {
    setCount(count - 1);
  };
  
  const reset = () => {
    setCount(0);
  };
  
  return (
    <div className="App">
      <header className="App-header">
        <h1>示例 React 應用</h1>
        <p>當前計數: <strong>{count}</strong></p>
        <div className="buttons">
          <button onClick={increment}>增加</button>
          <button onClick={decrement}>減少</button>
          <button onClick={reset}>重置</button>
        </div>
        <p className="hint">
          這是一個簡單的示例應用，用於演示增強版 RAG 系統。
        </p>
      </header>
    </div>
  );
}

export default App;
EOF

# 創建 App.css
cat > src/App.css << 'EOF'
.App {
  text-align: center;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.App-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
  color: white;
  padding: 20px;
}

.buttons {
  margin: 30px 0;
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  justify-content: center;
}

button {
  background-color: #4CAF50;
  border: none;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 18px;
  margin: 4px 2px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-weight: bold;
}

button:hover {
  background-color: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

button:active {
  transform: translateY(0);
}

.hint {
  margin-top: 40px;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  max-width: 600px;
  line-height: 1.6;
}
EOF

# 創建 index.js
cat > src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

# 創建 index.css
cat > src/index.css << 'EOF'
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
EOF

# 創建 .env 文件（用於測試安全檢查）
cat > .env << 'EOF'
# 環境變量配置
API_KEY="demo_api_key_12345"
SECRET_KEY="demo_secret_key_67890"
DATABASE_URL="postgres://demo:password@localhost:5432/demo_db"
EOF

# 返回上級目錄
cd ..

echo "示例項目創建完成: $EXAMPLE_PROJECT"
echo "項目結構:"
find "$EXAMPLE_PROJECT" -type f | sort

echo ""
echo "================================================"
echo "運行增強版 RAG 系統分析示例項目"
echo "================================================"

# 運行增強版系統
echo "正在分析項目..."
python3 main_enhanced.py "$EXAMPLE_PROJECT"

echo ""
echo "================================================"
echo "分析完成！"
echo "================================================"
echo ""
echo "生成的報告和文件："
echo "1. 輸出目錄: output/ 中的最新時間戳目錄"
echo "2. 桌面文件: 增強版_RAG_系統結果_*.txt"
echo "3. 項目目錄中的學習報告"
echo ""
echo "查看報告了解詳細分析結果和改進建議！"
echo ""
echo "清理示例項目..."
rm -rf "$EXAMPLE_PROJECT"
echo "示例項目已清理"