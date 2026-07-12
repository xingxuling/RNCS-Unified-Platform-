// AetherSeed Dataset · 安全策略
// 边界：BLOCK 样本永不导出；Full60 原文 / Founder-only / secret 永不导出；不上传外部；不真正训练。

export const DATASET_SAFETY_ALLOWED = [
  "只导出 PASS / WARN 样本（WARN 已脱敏）",
  "导出前再次扫描密钥 / token / Full60 / Founder-only 痕迹",
  "导出仅生成内存预览与下载占位，不自动上传外部",
  "数据集版本不可变；修订生成新版本号",
  "保留 sourceIntakeRunIds 用于追溯与回验",
];

export const DATASET_SAFETY_FORBIDDEN = [
  "不导出 BLOCK 样本",
  "不导出 secret / Bearer / JWT / 私钥",
  "不导出 Full60 原始数列",
  "不导出 Founder-only 原文",
  "不自动上传任何样本到外部服务",
  "不真正触发训练 / 不调用外部训练服务",
  "不保存明文私密配置",
];

const SENSITIVE_PATTERNS: RegExp[] = [
  /sk-[a-zA-Z0-9]{16,}/,
  /bearer\s+[a-zA-Z0-9._-]{16,}/i,
  /full60[_\s-]?raw|原始数列/i,
  /founder[_\s-]?only|创始人专属原文/i,
  /-----BEGIN [A-Z ]+PRIVATE KEY-----/,
];

/** 二次扫描；返回 true 表示发现敏感残留，应阻断导出该条。 */
export function containsResidualSensitive(text: string): boolean {
  if (!text) return false;
  return SENSITIVE_PATTERNS.some((p) => p.test(text));
}
