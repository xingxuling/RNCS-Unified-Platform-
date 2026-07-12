// System Constitution v0.2 — Export Engine
import { CONSTITUTION_REGISTRY, CONSTITUTION_VERSION } from "./constitutionRegistry";
import { AUTHORITY_HIERARCHY } from "@/constants/constitution/authorityHierarchy";
import { CONSTITUTION_VERSIONS, diffConstitutionVersions } from "./constitutionalAmendmentEngine";

const SAFETY_NOTES = [
  "系统宪法不是法律文件，不替代现实法律、合规、医疗、金融、心理或工程安全判断。",
  "Founder Locked 条款保护系统一致性、用户隐私与高风险边界。",
  "CRITICAL 违规必须 block。",
];

function meta() {
  return {
    constitutionVersion: CONSTITUTION_VERSION,
    exportedAt: new Date().toISOString(),
    source: "Aetherworld System Constitution",
    founderLockedCount: CONSTITUTION_REGISTRY.filter((a) => a.founderLocked).length,
    safetyNotes: SAFETY_NOTES,
  };
}

export function exportConstitutionJSON() {
  return { metadata: meta(), articles: CONSTITUTION_REGISTRY };
}

export function exportAuthorityHierarchyJSON() {
  return { metadata: meta(), authority: AUTHORITY_HIERARCHY };
}

export function exportConstitutionMarkdown(): string {
  const lines: string[] = [`# Aetherworld System Constitution v${CONSTITUTION_VERSION}`, ""];
  for (const n of SAFETY_NOTES) lines.push(`> ${n}`);
  lines.push("");
  for (const a of CONSTITUTION_REGISTRY) {
    lines.push(`## ${a.articleId} · ${a.title}`);
    lines.push(`- 类别：${a.category} · 约束级：${a.bindingLevel} · 违规等级：${a.violationSeverity}${a.founderLocked ? " · Founder Locked" : ""}`);
    lines.push(`- 摘要：${a.summary}`);
    lines.push(`- 正文：${a.body}`);
    lines.push("");
  }
  return lines.join("\n");
}

export function exportConstitutionVersionDiff(a: string, b: string): string {
  const d = diffConstitutionVersions(a, b);
  return [
    `# Constitution Version Diff`, ``,
    `- A: ${d.versionA} — ${d.summaryA}`,
    `- B: ${d.versionB} — ${d.summaryB}`,
    `- A changed: ${d.changedA.join(", ")}`,
    `- B changed: ${d.changedB.join(", ")}`,
  ].join("\n");
}

export { CONSTITUTION_VERSIONS };
