# 使用示例

本文档提供 AutoRAG 系统的详细使用示例。

## 基础用法

### 分析单个项目

```bash
# 使用 Python
python main.py /path/to/project

# 使用 Shell 脚本
./run_system.sh /path/to/project

# Windows
run_system.bat C:\path\to\project
```

### 分析并优化项目

```bash
# 自动分析并优化
python main.py /path/to/project --optimize

# 指定输出目录
python main.py /path/to/project --output /custom/output/path
```

## 高级用法

### 批量处理

```bash
# 批量处理多个项目
for project in projects/*/; do
    python main.py "$project" --optimize
done
```

### 使用 Web 界面

```bash
# 启动 Web 服务器
python web_server.py

# 访问 http://localhost:5000
```

### 增量分析

```bash
# 只分析变更的文件
python main.py /path/to/project --incremental

# 指定基准版本
python main.py /path/to/project --incremental --base-ref v1.0.0
```

## 配置选项

### 修改分析深度

编辑 `config/system_config.json`:

```json
{
  "analysis": {
    "depth": "comprehensive",
    "include_code_quality": true,
    "check_dependencies": true
  }
}
```

### 自定义优化规则

```json
{
  "optimization": {
    "rules": [
      {
        "name": "remove_unused_imports",
        "enabled": true,
        "severity": "warning"
      },
      {
        "name": "format_code",
        "enabled": true,
        "style": "pep8"
      }
    ]
  }
}
```

## 输出示例

### 分析报告

系统会生成 JSON 格式的分析报告：

```json
{
  "project_name": "example-project",
  "score": 85,
  "maturity": "intermediate",
  "analysis": {
    "structure": {
      "score": 90,
      "issues": []
    },
    "code_quality": {
      "score": 80,
      "issues": [
        {
          "file": "src/main.py",
          "line": 15,
          "message": "Unused import: os"
        }
      ]
    }
  },
  "recommendations": [
    "Remove unused imports",
    "Add unit tests"
  ]
}
```

## 故障排除

### 权限问题

```bash
# Linux/macOS: 设置执行权限
chmod +x run_system.sh
chmod +x *.sh
```

### 依赖问题

```bash
# 检查 Python 版本
python --version

# 如果需要特定版本，使用 pyenv 或 conda
```

### 内存不足

对于大型项目，可以使用增量分析：

```bash
python main.py /large/project --incremental --memory-limit 512
```

## 集成示例

### CI/CD 集成

```yaml
# .github/workflows/analyze.yml
name: Analyze Project
on: [push, pull_request]
jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.8'
      - name: Run AutoRAG Analysis
        run: |
          git clone https://github.com/xingxuling/AutoRAGsystem.git
          cd AutoRAGsystem
          python main.py ${{ github.workspace }}
```

### 预提交钩子

```bash
# .git/hooks/pre-commit
#!/bin/bash
python /path/to/auto-rag-system/main.py . --check-only
if [ $? -ne 0 ]; then
    echo "Analysis failed. Please fix issues before committing."
    exit 1
fi
```

## 更多示例

如需更多示例，请查看：
- [QUICK_START_GUIDE.md](../QUICK_START_GUIDE.md)
- [HOW_TO_USE_ENHANCED_SYSTEM.md](../HOW_TO_USE_ENHANCED_SYSTEM.md)
- [examples/](../examples/) 目录