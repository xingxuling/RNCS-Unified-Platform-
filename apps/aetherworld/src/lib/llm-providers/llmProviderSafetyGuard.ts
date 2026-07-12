// 安全守卫：过滤 Full60、Founder-only、密钥等敏感内容
import type { LlmMessage, LlmProviderConfig } from "./llmProviderTypes";

const SENSITIVE_PATTERNS: { pattern: RegExp; note: string }[] = [
  { pattern: /full60[_\-\s]?raw/i, note: "已屏蔽 Full60 原始数列" },
  { pattern: /founder[_\-\s]?only[_\-\s]?raw/i, note: "已屏蔽 Founder-only 原始数据" },
  { pattern: /(api[_-]?key|secret|token|password)\s*[:=]\s*[\w\-.]+/i, note: "已屏蔽密钥 / 密码" },
  { pattern: /bearer\s+[a-z0-9\-._~+/]+=*/i, note: "已屏蔽 Bearer Token" },
];

export interface SafetyResult {
  messages: LlmMessage[];
  notes: string[];
  blocked: boolean;
}

export function isLocalBaseUrl(baseUrl?: string): boolean {
  if (!baseUrl) return true;
  try {
    const u = new URL(baseUrl);
    const h = u.hostname;
    return (
      h === "localhost" ||
      h === "127.0.0.1" ||
      h === "0.0.0.0" ||
      h.endsWith(".local") ||
      /^192\.168\./.test(h) ||
      /^10\./.test(h) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(h)
    );
  } catch {
    return false;
  }
}

export function applySafetyGuard(
  messages: LlmMessage[],
  cfg: LlmProviderConfig
): SafetyResult {
  const notes: string[] = [];
  const sanitized = messages.map((m) => {
    let content = m.content;
    for (const { pattern, note } of SENSITIVE_PATTERNS) {
      if (pattern.test(content)) {
        content = content.replace(pattern, "[已屏蔽]");
        if (!notes.includes(note)) notes.push(note);
      }
    }
    return { ...m, content };
  });

  if (!isLocalBaseUrl(cfg.baseUrl)) {
    notes.push("当前模型提供者为远程地址，请确认你信任该服务。");
  }

  return { messages: sanitized, notes, blocked: false };
}
