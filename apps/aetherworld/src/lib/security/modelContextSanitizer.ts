// 模型上下文脱敏器：在送入模型 messages 前统一过滤
import type { LlmMessage } from "@/lib/llm-providers/llmProviderTypes";
import { redactText } from "./secretRedactor";
import { scanForSecrets } from "./secretGuard";

const FULL60_PATTERNS = [/full60[\s_-]?raw/i, /原始数列/, /Full60Raw/];
const FOUNDER_PATTERNS = [/founder[\s_-]?only/i, /创始者专属/];
const WORKSPACE_DUMP_PATTERNS = [/workspace[_-]?dump/i, /私密工作区导出/];

export interface ModelContextSanitizeReport {
  redactedFields: string[];
  redactionCount: number;
  hadSecrets: boolean;
  hadFounderOnly: boolean;
  hadFull60: boolean;
  hadWorkspaceDump: boolean;
}

export interface SanitizedContext {
  messages: LlmMessage[];
  report: ModelContextSanitizeReport;
}

export function sanitizeModelContext(messages: LlmMessage[]): SanitizedContext {
  const report: ModelContextSanitizeReport = {
    redactedFields: [],
    redactionCount: 0,
    hadSecrets: false,
    hadFounderOnly: false,
    hadFull60: false,
    hadWorkspaceDump: false,
  };

  const next = messages.map((m) => {
    let content = m.content || "";
    const secretScan = scanForSecrets(content);
    if (secretScan.hits.length > 0) {
      report.hadSecrets = true;
      report.redactionCount += secretScan.hits.length;
      report.redactedFields.push(...secretScan.hits.map((h) => h.label));
      content = redactText(content);
    }
    if (FULL60_PATTERNS.some((p) => p.test(content))) {
      report.hadFull60 = true;
      report.redactedFields.push("Full60 原始数列");
      for (const p of FULL60_PATTERNS) content = content.replace(p, "[已脱敏:Full60]");
    }
    if (FOUNDER_PATTERNS.some((p) => p.test(content))) {
      report.hadFounderOnly = true;
      report.redactedFields.push("Founder-only 内容");
      for (const p of FOUNDER_PATTERNS) content = content.replace(p, "[已脱敏:Founder-only]");
    }
    if (WORKSPACE_DUMP_PATTERNS.some((p) => p.test(content))) {
      report.hadWorkspaceDump = true;
      report.redactedFields.push("私密 Workspace Dump");
      for (const p of WORKSPACE_DUMP_PATTERNS) content = content.replace(p, "[已脱敏:WorkspaceDump]");
    }
    return { ...m, content };
  });

  return { messages: next, report };
}

export function summarizeSanitization(r: ModelContextSanitizeReport): string[] {
  const notes: string[] = [];
  if (r.hadSecrets) notes.push(`已屏蔽 ${r.redactionCount} 处疑似密钥 / Token / 密码`);
  if (r.hadFull60) notes.push("已屏蔽 Full60 原始数列");
  if (r.hadFounderOnly) notes.push("已屏蔽 Founder-only 内容");
  if (r.hadWorkspaceDump) notes.push("已屏蔽私密 Workspace Dump");
  return notes;
}
