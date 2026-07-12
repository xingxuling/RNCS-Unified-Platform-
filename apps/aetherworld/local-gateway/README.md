# Aether Local Gateway

Aetherworld Web 与本地模型之间的最小代理层，规避浏览器 HTTPS→HTTP / CORS / `OLLAMA_ORIGINS` 等限制。

```
Aetherworld Web  →  Aether Local Gateway  →  Ollama / 本地兼容接口
```

## 启动

```bash
cd local-gateway
npm install
npm run dev
```

默认监听 `http://localhost:18777`。

在 Aetherworld「模型提供者」页的「Aether Local Gateway」卡片中保存：

```
http://localhost:18777
```

## 健康检查

```bash
curl http://localhost:18777/health
```

返回：

```json
{ "status": "ok", "version": "0.1", "gatewayName": "Aether Local Gateway" }
```

## 接口

- `GET  /health`
- `GET  /api/local/status`
- `GET  /api/local/models`
- `POST /api/local/chat`
- `POST /api/local/ollama/discover`

`/api/local/chat` 请求体：

```json
{
  "model": "qwen2.5:8b",
  "messages": [{ "role": "user", "content": "你好" }],
  "temperature": 0.7
}
```

## 自动发现 Ollama

依次探测：

- `http://localhost:11434/api/tags`
- `http://localhost:11435/api/tags`
- `http://127.0.0.1:11434/api/tags`
- `http://127.0.0.1:11435/api/tags`

返回 JSON 且包含 `models` 字段即判定为 `READY`，并自动锁定 `activeBaseUrl`。

## 安全边界

本网关 **只做**：

- 探测 Ollama 端口
- 读取 Ollama 已安装模型列表
- 转发聊天请求
- 返回状态 / 诊断
- 记录本地日志草案

本网关 **绝不**：

- 执行任意 Shell 命令
- 删除任意文件
- 修改系统设置
- 读取全盘文件
- 自动上传用户数据
- 绕过 Secret Guard / Model Context Sanitizer / QA
- 伪装真实执行能力

## 环境变量

见 `.env.example`。
