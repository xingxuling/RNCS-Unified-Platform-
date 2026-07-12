import type { DigitalRoleWorkflow } from "./digitalRoleWorkflowPlanner";
import type { DigitalRoleConflict } from "./digitalRoleConflictDetector";

export interface DigitalRoleQaReport {
  status: "PASS" | "WARN" | "FAIL";
  issues: { severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; message: string }[];
  blockers: string[];
}

export function runDigitalRoleQa(workflow: DigitalRoleWorkflow, conflicts: DigitalRoleConflict[]): DigitalRoleQaReport {
  const issues: DigitalRoleQaReport["issues"] = [];
  const blockers: string[] = [];

  if (!workflow.steps.some((s) => s.roleId === "DIGITAL_QA")) {
    issues.push({ severity: "HIGH", message: "工作流缺少 DIGITAL_QA 步骤" });
  }
  if (workflow.governanceRequired && !workflow.steps.some((s) => s.roleId === "DIGITAL_GOVERNANCE_OFFICER")) {
    issues.push({ severity: "CRITICAL", message: "需要治理审查但缺少 DIGITAL_GOVERNANCE_OFFICER" });
    blockers.push("缺少治理审查");
  }
  for (const c of conflicts) {
    if (c.severity === "CRITICAL") {
      blockers.push(`CRITICAL 冲突: ${c.conflictType}`);
      issues.push({ severity: "CRITICAL", message: c.explanation });
    } else {
      issues.push({ severity: c.severity, message: c.explanation });
    }
  }

  const status: DigitalRoleQaReport["status"] = blockers.length ? "FAIL" : issues.length ? "WARN" : "PASS";
  return { status, issues, blockers };
}
