export interface ExecutiveGateReport {
  canEmitDirectly: boolean;
  draftOnly: boolean;
  requiresQa: boolean;
  requiresHumanReview: boolean;
  requiresGovernance: boolean;
  requiresClm: boolean;
  requiresRecalculation: boolean;
  requiresWorkspaceSave: boolean;
  reasons: string[];
}

const HIGH_RISK = [/删除/, /部署/, /上线/, /对外发布/, /公开/, /真实执行/, /读取隐私/, /真实运行/, /运行命令/];

export function runExecutiveGate(taskType: string, output: string): ExecutiveGateReport {
  const reasons: string[] = [];
  const highRisk = HIGH_RISK.some((re) => re.test(output));
  if (highRisk) reasons.push("触发高风险关键词");
  const isCode = /CODE|REPAIR|PATCH/.test(taskType);
  if (isCode) reasons.push("代码相关任务");
  return {
    canEmitDirectly: !highRisk && !isCode,
    draftOnly: true,
    requiresQa: true,
    requiresHumanReview: highRisk || isCode,
    requiresGovernance: highRisk,
    requiresClm: highRisk,
    requiresRecalculation: false,
    requiresWorkspaceSave: true,
    reasons: reasons.length ? reasons : ["默认进入草案 + QA 流程"],
  };
}
