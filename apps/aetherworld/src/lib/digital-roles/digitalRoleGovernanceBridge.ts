import type { DigitalRoleWorkflow } from "./digitalRoleWorkflowPlanner";

export interface GovernanceDecision {
  blocked: boolean;
  reasons: string[];
  archiveSuggested: boolean;
}

export function runDigitalRoleGovernance(workflow: DigitalRoleWorkflow, founderOnlyLeak = false, demoRealMix = false): GovernanceDecision {
  const reasons: string[] = [];
  if (founderOnlyLeak) reasons.push("检测到 Founder-only 信息可能被普通角色暴露");
  if (demoRealMix) reasons.push("检测到 Demo / Real 混淆风险");
  if (workflow.governanceRequired && !workflow.steps.some((s) => s.roleId === "DIGITAL_GOVERNANCE_OFFICER")) {
    reasons.push("缺少 Governance Officer 步骤");
  }
  return { blocked: reasons.length > 0, reasons, archiveSuggested: false };
}
