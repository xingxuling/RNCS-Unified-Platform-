// AetherSeed 300M One-Click Training Pipeline · 安全策略
// 受控自动化 ≠ 跳过安全。本文件统一声明允许 / 禁止 / 白名单边界。

export const PIPELINE_AUTO_FILL_ALLOWED = [
  "从现有投喂炉输出生成 300M 数据集草案（不读外部文件）",
  "对最新数据集生成真实导出包（JSONL / Manifest / 安全报告）",
  "生成 AetherSeed 300M 本机训练计划",
  "创建 AetherSeed 300M 实验账本记录",
  "创建 300M 训练工作流草案",
  "创建自动训练 dry-run 任务",
  "执行 dry-run（仅命令预览 + 白名单检查，不真实执行）",
  "本地网关连接性 / /health 检测",
] as const;

export const PIPELINE_AUTO_FILL_FORBIDDEN = [
  "自动执行真实训练命令",
  "执行任意 shell / 用户输入命令",
  "上传训练数据 / checkpoint",
  "下载外部模型权重",
  "训练 BLOCK 样本",
  "训练未脱敏 Founder-only 原文",
  "训练来源不明 / 未授权材料",
  "跳过 dry-run",
  "跳过用户确认",
  "把用户确认持久化（必须仅会话内存）",
] as const;

/** 输出目录白名单（仅允许向本地这些目录写入） */
export const PIPELINE_OUTPUT_DIR_WHITELIST = [
  "./aether-training/aetherseed-300m/",
  "./aether-training/checkpoints/aetherseed-300m/",
  "./aether-training/logs/aetherseed-300m/",
] as const;

/** 输入数据来源白名单（仅允许来自这些受控来源） */
export const PIPELINE_INPUT_SOURCE_WHITELIST = [
  "AetherSeed 数据集 · 真实导出包 train.jsonl",
  "AetherSeed 数据集 · 真实导出包 eval.jsonl",
] as const;

/** 风险提示（用户必须看到，但不阻断显示） */
export const PIPELINE_RISK_NOTES = [
  "300M 本机训练可能需要数天到数周；电脑需长时间运行。",
  "必须高频保存 checkpoint，确保可断点恢复。",
  "本轮不上传 / 不下载 / 不公开 / 不开源。",
  "训练完成前请勿删除工作目录 / 日志目录。",
  "失败后系统会自动生成下一炉建议，不自动重试。",
] as const;

/** 检查日志摘要是否仍可能携带敏感字段 */
export function basicRedact(line: string): string {
  return line
    .replace(/sk-[A-Za-z0-9_-]{16,}/g, "sk-***")
    .replace(/(api[-_]?key\s*[:=]\s*)\S+/gi, "$1***")
    .replace(/(token\s*[:=]\s*)\S+/gi, "$1***")
    .replace(/(password\s*[:=]\s*)\S+/gi, "$1***");
}
