// Workspace 保存前的敏感字段扫描
import { scanObjectForSecrets } from "./secretGuard";
import { redactObject } from "./secretRedactor";

export interface WorkspaceFilterResult<T> {
  safe: boolean;
  level: "PASS" | "WARN" | "BLOCK";
  redacted: T;
  hits: { label: string; sample: string }[];
}

export function filterWorkspaceObjectForSave<T>(obj: T): WorkspaceFilterResult<T> {
  const scan = scanObjectForSecrets(obj);
  const redacted = redactObject(obj);
  return {
    safe: scan.level === "PASS",
    level: scan.level,
    redacted,
    hits: scan.hits.map((h) => ({ label: h.label, sample: h.sample })),
  };
}
