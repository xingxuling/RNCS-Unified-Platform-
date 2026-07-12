export type CodeRunStatus = "PASS" | "WARN" | "FAIL" | "BLOCKED" | "SIMULATED";

export const CODE_RUN_STATUS_LABELS: Record<CodeRunStatus, { zh: string; tone: string }> = {
  PASS: { zh: "通过", tone: "text-emerald-300" },
  WARN: { zh: "警告", tone: "text-amber-300" },
  FAIL: { zh: "失败", tone: "text-red-400" },
  BLOCKED: { zh: "已阻断", tone: "text-red-400" },
  SIMULATED: { zh: "模拟运行", tone: "text-sky-300" },
};
