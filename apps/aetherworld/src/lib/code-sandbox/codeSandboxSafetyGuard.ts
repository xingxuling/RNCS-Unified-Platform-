import { matchBlockedCommand } from "@/constants/code-sandbox/codeRunCommandBlocklist";

export interface SafetyCheckResult {
  ok: boolean;
  blocked: boolean;
  notes: string[];
}

export function evaluateCodeSandboxSafety(opts: {
  runnerMode: string;
  requestedCommand?: string;
  fileContents: string[];
}): SafetyCheckResult {
  const notes: string[] = [];
  const blockMatch = matchBlockedCommand(opts.requestedCommand);
  if (blockMatch.matched) {
    notes.push(`命令命中黑名单：${blockMatch.reasons.join("、")}`);
    return { ok: false, blocked: true, notes };
  }
  const combined = opts.fileContents.join("\n").toLowerCase();
  if (/eval\s*\(/.test(combined)) notes.push("检测到 eval 调用，标记为风险");
  if (/document\.write/.test(combined)) notes.push("检测到 document.write 用法");
  if (/innerhtml\s*=\s*['"`]<script/.test(combined)) notes.push("检测到注入 script 行为");
  if (/password|token|secret/.test(combined)) notes.push("文件中包含敏感字段");
  if (opts.runnerMode === "FUTURE_REAL_SANDBOX") {
    return { ok: false, blocked: true, notes: ["真实沙箱在 v0.2 未启用"] };
  }
  return { ok: true, blocked: false, notes };
}
