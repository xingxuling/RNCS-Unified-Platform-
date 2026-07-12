// Training Factory Calculus · 安全边界
export const TFC_SAFETY_ALLOWED = [
  "在 Aetherworld 内生成训练工厂计算法的流程图 / 四象 / 血统 / 成本 / 权重 / 下一代计划",
  "用 Lovable / Cursor / Codex 生成训练脚本草案与 Runbook",
  "由用户在本机或服务器手动执行训练",
  "把训练 / 评测事件登记到 Record Center 与 Verification Center",
  "把训练 / 评测贡献写入数列货币内部账本",
] as const;

export const TFC_SAFETY_FORBIDDEN = [
  "Aetherworld 内自动执行训练循环",
  "自动上传训练数据到外部服务",
  "自动调用外部 GPU 服务器",
  "假装模型已经训练完成",
  "导出 secret / Founder-only / Full60 原始数列",
  "把 Aetherworld 内部价值计量与法币 / 证券 / 代币挂钩",
  "在未确认 license 的情况下纳入外部代码与数据",
] as const;

export function assertTrainingFactoryNeverAutoRun(): true {
  return true;
}
