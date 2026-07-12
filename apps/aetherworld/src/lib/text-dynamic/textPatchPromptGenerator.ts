// Text Patch Prompt Generator — see spec §13
import { runTextAudit, type TextAuditIssue } from "./textAuditEngine";
import { getText } from "./textRegistry";
import { runStaleDetection } from "./textStaleDetector";

export interface TextPatchPrompt {
  title: string;
  prompt: string;
  affectedFiles: string[];
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  textId?: string;
}

function severityToPriority(s: TextAuditIssue["severity"]): TextPatchPrompt["priority"] {
  return s === "CRITICAL" ? "CRITICAL" : s === "HIGH" ? "HIGH" : s === "WARN" ? "MEDIUM" : "LOW";
}

export function generatePatchPrompts(): TextPatchPrompt[] {
  const prompts: TextPatchPrompt[] = [];

  // From audit issues
  for (const issue of runTextAudit().issues) {
    const entry = getText(issue.textId);
    prompts.push({
      title: `修复文本 ${issue.textId}（${issue.ruleId}）`,
      prompt: `请在 /src/lib/text-dynamic/textRegistry.ts 中将 textId="${issue.textId}" 的 currentText 修订，使其符合规则 ${issue.ruleId}：${issue.message}。务必保留 audienceMode=${entry?.audienceMode ?? "?"}、scope=${entry?.scope ?? "?"} 的语气，并满足 Aetherworld 系统宪法与数列货币非金融化边界。`,
      affectedFiles: ["/src/lib/text-dynamic/textRegistry.ts"],
      priority: severityToPriority(issue.severity),
      textId: issue.textId,
    });
  }

  // From stale detection
  for (const id of runStaleDetection().staleTextIds) {
    if (prompts.some((p) => p.textId === id)) continue;
    const entry = getText(id);
    prompts.push({
      title: `刷新 stale 文本 ${id}`,
      prompt: `请基于当前模块 ${entry?.moduleId}、route ${entry?.route ?? "-"} 与 audience ${entry?.audienceMode}，在 textRegistry.ts 重新生成 ${id} 的 currentText，原因：${entry?.staleReason ?? "stale"}。`,
      affectedFiles: ["/src/lib/text-dynamic/textRegistry.ts"],
      priority: entry?.priority ?? "MEDIUM",
      textId: id,
    });
  }
  return prompts;
}
