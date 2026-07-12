import type { WebKnowledgeSafetyRule } from "@/constants/web-knowledge-trinity/webKnowledgeSafetyRules";
import { WEB_KNOWLEDGE_SAFETY_RULES } from "@/constants/web-knowledge-trinity/webKnowledgeSafetyRules";

export interface SafetyEvalResult {
  blocked: boolean;
  warnings: string[];
  triggered: WebKnowledgeSafetyRule[];
  sanitizedText?: string;
}

const FULL60_RE = /full60[^a-z]?/i;
const FOUNDER_ONLY_RE = /(founder[\- ]only|创始人专属原始)/i;
const SECRET_RE = /(api[_\- ]?key|password|token=|secret=|bearer\s+[a-z0-9_\-]{10,})/i;

export function evaluateWebKnowledgeSafety(text: string): SafetyEvalResult {
  const triggered: WebKnowledgeSafetyRule[] = [];
  const warnings: string[] = [];
  let blocked = false;
  let sanitized = text;
  if (FULL60_RE.test(text)) {
    const r = WEB_KNOWLEDGE_SAFETY_RULES.find((x) => x.ruleId === "BLOCK_FULL60_IN_KNOWLEDGE")!;
    triggered.push(r); warnings.push(r.description); blocked = true;
    sanitized = sanitized.replace(FULL60_RE, "[FULL60_REDACTED] ");
  }
  if (FOUNDER_ONLY_RE.test(text)) {
    const r = WEB_KNOWLEDGE_SAFETY_RULES.find((x) => x.ruleId === "BLOCK_FOUNDER_ONLY_IN_KNOWLEDGE")!;
    triggered.push(r); warnings.push(r.description); blocked = true;
    sanitized = sanitized.replace(FOUNDER_ONLY_RE, "[FOUNDER_ONLY_REDACTED]");
  }
  if (SECRET_RE.test(text)) {
    const r = WEB_KNOWLEDGE_SAFETY_RULES.find((x) => x.ruleId === "BLOCK_SECRETS_IN_KNOWLEDGE")!;
    triggered.push(r); warnings.push(r.description); blocked = true;
    sanitized = sanitized.replace(SECRET_RE, "[SECRET_REDACTED]");
  }
  return { blocked, warnings, triggered, sanitizedText: sanitized };
}
