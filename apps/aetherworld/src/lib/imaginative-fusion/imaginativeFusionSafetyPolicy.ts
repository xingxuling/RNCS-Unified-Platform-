// 畅想式融合 · 安全策略（只生成想法，不落地代码 / 部署 / 商店上架）
export const IMAGINATIVE_FORBIDDEN = [
  "AUTO_MODIFY_CODE",
  "AUTO_MERGE_PROJECTS",
  "AUTO_INSTALL_DEPENDENCIES",
  "AUTO_CREATE_DB_TABLES",
  "AUTO_CALL_EXTERNAL_API",
  "AUTO_PUBLISH",
  "AUTO_PUBLISH_STORE",
  "AUTO_DEPLOY",
] as const;

const SENSITIVE = [
  /sk-[a-z0-9-]{16,}/gi,
  /(api[_-]?key|secret|token|password)\s*[:=]\s*["'][^"']{6,}["']/gi,
];

export function sanitizeImaginativeInput(raw: string): string {
  let s = raw ?? "";
  for (const r of SENSITIVE) s = s.replace(r, "[REDACTED]");
  return s;
}
