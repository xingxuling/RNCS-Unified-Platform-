// 训练工作流安全策略 v0.1
export const TRAINING_WORKFLOW_SAFETY_ALLOWED = [
  "登记原料 / Intake / Dataset 已存在的引用",
  "生成本机训练计划与命令预览",
  "执行 Dry-run 检查（白名单命令、不真实运行）",
  "等待用户手动点击「我确认开始训练」",
  "登记实验状态 / metrics / checkpoint / 失败原因",
  "生成下一炉建议与模型血统记录",
];

export const TRAINING_WORKFLOW_SAFETY_FORBIDDEN = [
  "自动执行任意 shell",
  "跳过 Dry-run 或用户确认",
  "上传训练数据",
  "下载模型权重",
  "读取用户全盘",
  "登记导致 BLOCK 的样本",
  "泄漏 Full60 / Founder-only 原文",
];

export function isHighRiskStep(stepId: string): boolean {
  return stepId === "TRAINING_EXECUTION" || stepId === "AUTO_TRAINING_DRYRUN";
}
