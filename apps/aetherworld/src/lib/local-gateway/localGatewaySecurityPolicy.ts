// Aether Local Gateway 安全边界（前端侧策略，与 /local-gateway/server.js 协议保持一致）。
// 此处不实际执行任何操作；用于在 UI 与文档中声明 Gateway 能做与不能做的事。

export const LOCAL_GATEWAY_ALLOWED = [
  "探测 Ollama 端口",
  "读取 Ollama 已安装模型列表",
  "转发聊天请求到 Ollama / OpenAI 兼容本地服务",
  "返回 Gateway / Ollama 状态",
  "输出诊断信息",
  "记录本地日志草案",
] as const;

export const LOCAL_GATEWAY_FORBIDDEN = [
  "执行任意 Shell 命令",
  "删除任意文件",
  "修改系统设置",
  "读取全盘文件",
  "自动上传用户数据",
  "绕过 Secret Guard",
  "绕过 Model Context Sanitizer",
  "绕过 QA",
  "伪装真实执行能力",
] as const;
