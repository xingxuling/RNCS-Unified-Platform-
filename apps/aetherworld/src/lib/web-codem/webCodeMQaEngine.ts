// WebCodeM 专项 QA — 不绕过 System Constitution / 不伪装真实执行
import type { WebCodeMRunRecord, WebCodeMQaResult, WebCodeMQaIssue } from "./webCodeMTypes";

const DANGEROUS_RX = /(rm\s+-rf|drop\s+table|deploy\s+production|sudo\s+|chmod\s+777|format\s+c:)/i;

export function runWebCodeMQa(run: WebCodeMRunRecord, extraFlags: { simulatedOnly?: boolean } = {}): WebCodeMQaResult {
  const issues: WebCodeMQaIssue[] = [];
  const fixes: string[] = [];

  // 1. 任务类型必填
  if (!run.taskType) {
    issues.push({ ruleId: "WCM_TASK_TYPE", severity: "FAIL", message: "未识别任务类型" });
  }

  // 2. CREATE_APP 必须输出文件
  if (run.taskType === "CREATE_APP" && (!run.fileCount || run.fileCount < 1)) {
    issues.push({ ruleId: "WCM_NO_FILES", severity: "FAIL", message: "未生成任何文件" });
    fixes.push("重新尝试生成代码草案");
  }

  // 3. CHECK / REPAIR 必须基于已有项目
  if ((run.taskType === "CHECK_PROJECT" || run.taskType === "REPAIR_CODE" || run.taskType === "GENERATE_PATCH") && !run.projectId) {
    issues.push({ ruleId: "WCM_NO_PROJECT", severity: "FAIL", message: "未找到目标项目" });
    fixes.push("先用「做一个 …」创建应用，再运行检查或修复");
  }

  // 4. 模拟执行不能声称真实运行
  if (extraFlags.simulatedOnly && run.notes.some((n) => /真实执行|已部署|已写入/i.test(n))) {
    issues.push({ ruleId: "WCM_NO_OVERCLAIM", severity: "CRITICAL", message: "模拟模式下声称真实执行" });
  }

  // 5. 危险命令
  const joined = [...(run.notes || []), run.handoffTitle ?? "", ...(run.repairSummary || [])].join("\n");
  if (DANGEROUS_RX.test(joined)) {
    issues.push({ ruleId: "WCM_DANGEROUS", severity: "CRITICAL", message: "检测到危险命令" });
  }

  // 6. Patch 必须有回滚或风险说明
  if (run.taskType === "GENERATE_PATCH" && run.patchSummary && run.patchSummary.length === 0) {
    issues.push({ ruleId: "WCM_PATCH_EMPTY", severity: "WARN", message: "Patch 草案为空" });
  }

  // 7. 错误数 vs Repair：有错误必须给出修复建议
  if (run.taskType === "REPAIR_CODE" && (!run.repairSummary || run.repairSummary.length === 0)) {
    issues.push({ ruleId: "WCM_NO_REPAIR", severity: "WARN", message: "未生成修复建议" });
  }

  const hasCritical = issues.some((i) => i.severity === "CRITICAL");
  const hasFail = issues.some((i) => i.severity === "FAIL");
  const hasWarn = issues.some((i) => i.severity === "WARN");
  const status: WebCodeMQaResult["status"] =
    hasCritical ? "BLOCKED" : hasFail ? "FAIL" : hasWarn ? "WARN" : "PASS";

  return { status, issues, recommendedFixes: fixes };
}
