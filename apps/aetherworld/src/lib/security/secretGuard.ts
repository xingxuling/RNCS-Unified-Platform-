// Secret Guard：扫描文本中的密钥并返回风险报告
import { SECRET_PATTERNS, type SecretScanReport, type SecretScanHit } from "./secretScanPatterns";
import { maskSecret } from "./secretRedactor";

export function scanForSecrets(text: string): SecretScanReport {
  if (!text) return { level: "PASS", hits: [] };
  const hits: SecretScanHit[] = [];
  for (const p of SECRET_PATTERNS) {
    const re = new RegExp(p.pattern.source, p.pattern.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      hits.push({
        id: p.id,
        label: p.label,
        confidence: p.confidence,
        sample: maskSecret(m[0]),
      });
      if (!p.pattern.flags.includes("g")) break;
    }
  }
  const hasHigh = hits.some((h) => h.confidence === "HIGH");
  const hasMed = hits.some((h) => h.confidence === "MEDIUM");
  return {
    level: hasHigh ? "BLOCK" : hasMed ? "WARN" : "PASS",
    hits,
  };
}

export function scanObjectForSecrets(obj: unknown): SecretScanReport {
  try {
    return scanForSecrets(JSON.stringify(obj ?? ""));
  } catch {
    return { level: "PASS", hits: [] };
  }
}
