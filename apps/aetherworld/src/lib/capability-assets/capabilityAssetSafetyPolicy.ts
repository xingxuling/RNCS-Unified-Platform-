// Aether Capability Asset Market · 安全策略
// 不真实接支付、不真实公开上架、不自动发布、不上传外部、不导出敏感内容。

export const CAPABILITY_ASSET_SAFETY_ALLOWED = [
  "识别 Aetherworld 内部能力（引擎 / 计算法 / Prompt / Agent / 工作流 / 训练工具 / 企业模块）",
  "包装外部能力（GitHub / API / Ollama / WebLLM / 论文方法 / 第三方 SaaS）",
  "登记用户创造物（App / Prompt / Agent / Workflow / Dataset / 世界 / 角色 / 音乐 / 模板）",
  "生成 CapabilityAssetPackage 草案",
  "生成 CapabilityAssetManifest（含 license / 限制 / 使用指引）",
  "高风险候选自动标记为 NEEDS_REVIEW",
  "在 Workspace 保存能力资产报告 / 包草案 / Manifest / Store 草案",
];

export const CAPABILITY_ASSET_SAFETY_FORBIDDEN = [
  "不真正接支付 / 结算 / 收款",
  "不真正上架到外部 marketplace",
  "不自动公开发布用户内容",
  "不导出 secret / API Key / 私钥",
  "不导出 Full60 原文",
  "不导出 Founder-only 原文",
  "不打包未授权外部代码",
  "不自动安装高风险能力（HIGH / CRITICAL 必须人工确认）",
  "不擅自把用户私密能力标记为公开可售",
  "不在未声明 license 时假装授权清晰",
];

export const HIGH_RISK_TRIGGER_KEYWORDS = [
  "shell", "exec", "child_process", "spawn",
  "rm -rf", "format c:", "drop database",
  "ssh key", "private key", "secret_key", "service role",
  "全盘扫描", "读取用户全部文件",
];

/**
 * 简单的敏感词命中检测（不包含原文回写，只用于判别风险等级）。
 */
export function detectSensitiveHits(text: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  return HIGH_RISK_TRIGGER_KEYWORDS.filter((k) => lower.includes(k.toLowerCase()));
}
