// 项目融合 · 安全策略
// - 不带入 secret / token / key / 私密内容
// - 高风险逻辑只生成 Bridge Plan，不直接融合

const SENSITIVE_PATTERNS: RegExp[] = [
  /sk-[a-z0-9-]{16,}/gi,
  /(api[_-]?key|secret|token|password)\s*[:=]\s*["'][^"']{6,}["']/gi,
  /Bearer\s+[A-Za-z0-9._-]{20,}/g,
  /-----BEGIN [A-Z ]+PRIVATE KEY-----[\s\S]*?-----END [A-Z ]+PRIVATE KEY-----/g,
];

const HIGH_RISK_KEYWORDS = [
  "auth", "oauth", "payment", "stripe", "billing",
  "fs.write", "child_process", "exec(",
  "deploy", "publish to", "social publish",
  "supabase service role", "service_role",
  "database schema", "drop table", "alter table",
  "permission rewrite",
];

export function sanitizeFusionInput(raw: string): string {
  let s = raw ?? "";
  for (const r of SENSITIVE_PATTERNS) s = s.replace(r, "[REDACTED]");
  return s;
}

export function detectHighRiskSignals(raw: string): string[] {
  const text = (raw ?? "").toLowerCase();
  return HIGH_RISK_KEYWORDS.filter((k) => text.includes(k));
}

export const HIGH_RISK_BLOCKLIST = [
  "AUTO_MIGRATE_AUTH",
  "AUTO_MIGRATE_PAYMENT",
  "AUTO_MIGRATE_DB_SCHEMA",
  "AUTO_PUBLISH_SOCIAL",
  "AUTO_DEPLOY",
  "AUTO_EXEC_EXTERNAL_CODE",
] as const;
