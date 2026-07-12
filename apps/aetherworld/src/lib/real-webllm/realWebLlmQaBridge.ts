// Real WebLLM QA / 安全检查
export type QaStatus = "PASS" | "WARN" | "FAIL" | "BLOCKED" | "NOT_CHECKED";

export interface QaReport {
  status: QaStatus;
  notes: string[];
}

const BLOCK_RULES: { re: RegExp; note: string }[] = [
  { re: /Full60\s*(原始|raw)/i, note: "尝试输出 Full60 原始数列。" },
  { re: /founder[\-_\s]?only/i, note: "尝试输出 Founder-only 数据。" },
  { re: /rm\s+-rf\s+\//i, note: "包含危险命令 rm -rf /。" },
  { re: /sudo\s+rm/i, note: "包含危险 sudo 删除命令。" },
  { re: /我已[真实]*执行|已在服务器上执行/i, note: "声称模拟结果是真实执行。" },
];

const WARN_RULES: { re: RegExp; note: string }[] = [
  { re: /bypass\s+QA|绕过\s*QA/i, note: "可能尝试绕过 QA。" },
  { re: /数列.*货币|代币.*数列/i, note: "把数列与货币/金融化挂钩。" },
  { re: /医学诊断|投资建议|法律意见/i, note: "输出高风险专业结论，需谨慎。" },
];

export function checkRealWebLlmOutput(text: string): QaReport {
  const notes: string[] = [];
  let status: QaStatus = "PASS";
  for (const r of BLOCK_RULES) {
    if (r.re.test(text)) {
      notes.push(r.note);
      status = "BLOCKED";
    }
  }
  if (status === "BLOCKED") return { status, notes };
  for (const r of WARN_RULES) {
    if (r.re.test(text)) {
      notes.push(r.note);
      status = "WARN";
    }
  }
  return { status, notes };
}
