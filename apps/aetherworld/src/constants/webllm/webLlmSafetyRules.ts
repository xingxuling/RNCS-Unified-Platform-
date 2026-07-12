export const WEB_LLM_SAFETY_RULES = [
  "不向模型传 Full60 原始数列。",
  "不向模型传 Founder-only 原始数据。",
  "不向模型传密钥 / token / 密码 / 私密文件。",
  "WebLLM 输出不能绕过计算法、QA、System Constitution、Runtime Spine。",
  "WebLLM 不得声称模拟结果为真实执行。",
  "WebLLM 不得生成危险代码或部署命令。",
  "WebGPU 不可用时必须降级到 RULE_ONLY。",
  "神经启发控制层不是医学诊断，仅为工程化控制策略。",
] as const;

export const WEB_LLM_SAFETY_FOOTER =
  "Aether WebLLM Neuro-Inspired Runtime 用于在支持 WebGPU 的浏览器中运行轻量本地 LLM，使 Aetherworld 获得本地语言补全能力。WebLLM 输出不是最终事实，不能绕过计算法、QA、System Constitution、Runtime Spine 或 Workspace 记录。神经启发控制层不是医学诊断，也不是对任何神经类型的模拟，只是工程化的细节聚焦、预测误差检查、上下文漂移检测和执行闸门机制。Full60 原始数列、Founder-only 数据、密钥、token、密码和敏感文件内容不得传给模型。";

export const WEB_LLM_FORBIDDEN_KEYS = [
  "FULL60_RAW", "FOUNDER_ONLY_RAW", "SECRET", "TOKEN", "PASSWORD", "PRIVATE_KEY",
] as const;
