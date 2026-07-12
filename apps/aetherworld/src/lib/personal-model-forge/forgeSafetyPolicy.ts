// AetherSeed Personal Model Forge · 安全边界
export const FORGE_SAFETY_ALLOWED = [
  "在 Aetherworld 内生成训练计划 / 工具链地图 / 血统线 / 调度草案",
  "用 Lovable / Cursor / Codex 生成训练脚本草案",
  "在本机手动执行训练（由用户启动）",
  "本机训练结果手动导入 Ollama 用于对照",
  "受控联网吸收公开语料",
] as const;

export const FORGE_SAFETY_FORBIDDEN = [
  "自动上传训练数据",
  "导出 secret / 密钥",
  "导出 Full60 原始数列",
  "假装训练已经完成",
  "自动调用外部服务器",
  "忽略 license 风险",
  "把耗时长误判为不可行",
  "在 Aetherworld 内直接执行训练循环",
] as const;

export function assertForgeNeverAutoRunTraining(): true {
  // 哨兵函数：作为代码层显式宣称——Aetherworld 不会自动执行训练。
  return true;
}
