import { getLedger } from "./creditLedgerEngine";
import { getResourceBalance } from "./worldResourceEngine";
import { runCurrencyAudit } from "./currencyAuditEngine";
import { REAL_CURRENCY_DISCLAIMER } from "./currencySafetyGuard";
import type { SubjectMode } from "./rewardCalculationEngine";

export interface ExportArtifact {
  filename: string;
  mime: string;
  content: string;
  metadata: Record<string, unknown>;
}

function metadataFor(mode: SubjectMode, kind: string, opts: { full60Active?: boolean }): Record<string, unknown> {
  return {
    kind,
    source: "Sequence Currency Engine",
    exportedAt: new Date().toISOString(),
    subjectMode: mode,
    privacy: opts.full60Active ? "FULL_60" : "STANDARD",
    realCurrency: false,
    disclaimer: REAL_CURRENCY_DISCLAIMER,
    privacyNotes: ["账本默认本地保存，不自动上传。", "Full60 数据请勿外发未授权方。"],
    safetyNotes: ["非现实货币；不可提现；不可投资。"],
  };
}

export function exportValueLedger(mode: SubjectMode, opts: { full60Active?: boolean } = {}): ExportArtifact {
  const metadata = metadataFor(mode, "value_ledger", opts);
  const data = { metadata, ledger: getLedger(mode) };
  return {
    filename: `value_ledger_${mode.toLowerCase()}_${Date.now()}.json`,
    mime: "application/json",
    content: JSON.stringify(data, null, 2),
    metadata,
  };
}

export function exportContributionReport(mode: SubjectMode, opts: { full60Active?: boolean } = {}): ExportArtifact {
  const metadata = metadataFor(mode, "contribution_report", opts);
  const ledger = getLedger(mode);
  const byType: Record<string, number> = {};
  const byUnit: Record<string, number> = {};
  for (const e of ledger) {
    if (e.direction !== "EARN") continue;
    byType[e.contributionType] = (byType[e.contributionType] ?? 0) + e.amount;
    byUnit[e.unitType] = (byUnit[e.unitType] ?? 0) + e.amount;
  }
  const lines = [
    `# 贡献报告 · ${mode}`,
    "",
    `> ${REAL_CURRENCY_DISCLAIMER}`,
    "",
    "## 按贡献类型",
    ...Object.entries(byType).map(([k, v]) => `- ${k}: ${v}`),
    "",
    "## 按单位",
    ...Object.entries(byUnit).map(([k, v]) => `- ${k}: ${v}`),
    "",
    "<!-- metadata -->",
    "```json",
    JSON.stringify(metadata, null, 2),
    "```",
  ];
  return {
    filename: `contribution_report_${mode.toLowerCase()}_${Date.now()}.md`,
    mime: "text/markdown",
    content: lines.join("\n"),
    metadata,
  };
}

export function exportWorldResources(mode: SubjectMode, opts: { full60Active?: boolean } = {}): ExportArtifact {
  const metadata = metadataFor(mode, "world_resources", opts);
  const content = JSON.stringify({ metadata, balance: getResourceBalance(mode) }, null, 2);
  return {
    filename: `world_resources_${mode.toLowerCase()}_${Date.now()}.json`,
    mime: "application/json",
    content,
    metadata,
  };
}

export function exportCurrencyAuditReport(mode: SubjectMode, opts: { full60Active?: boolean } = {}): ExportArtifact {
  const metadata = metadataFor(mode, "currency_audit_report", opts);
  const audit = runCurrencyAudit(mode);
  const lines = [
    `# Currency Audit · ${mode}`,
    "",
    `Status: **${audit.status}**`,
    "",
    `> ${REAL_CURRENCY_DISCLAIMER}`,
    "",
    "## Issues",
    ...(audit.issues.length === 0 ? ["(无)"] : audit.issues.map((i) => `- [${i.severity}] ${i.issue} — ${i.suggestedFix}`)),
    "",
    "## Recommendations",
    ...audit.recommendations.map((r) => `- ${r}`),
    "",
    "<!-- metadata -->",
    "```json",
    JSON.stringify(metadata, null, 2),
    "```",
  ];
  return {
    filename: `currency_audit_${mode.toLowerCase()}_${Date.now()}.md`,
    mime: "text/markdown",
    content: lines.join("\n"),
    metadata,
  };
}

export function triggerBrowserDownload(artifact: ExportArtifact): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const blob = new Blob([artifact.content], { type: artifact.mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = artifact.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
