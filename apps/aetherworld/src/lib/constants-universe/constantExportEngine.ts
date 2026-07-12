// Constant Universe v0.2 — Export Engine
import { CONSTANT_REGISTRY, CONSTANT_UNIVERSE_VERSION, listByCategory } from "./constantRegistry";
import { detectConstantConflicts } from "./constantConflictDetector";
import { diffVersions, getCurrentVersion } from "./constantVersioningEngine";

const SAFETY_NOTES = [
  "本常数为 Aetherworld 内部引擎统一参数，不代表现实宇宙物理定律",
  "Founder Locked 常数对普通用户只读",
  "Demo / Real / Full60 / Founder 数据严格隔离",
  "数列货币为内部使用，不可兑现、不可转移、非投资资产",
];

function meta() {
  return {
    constantUniverseVersion: CONSTANT_UNIVERSE_VERSION,
    exportedAt: new Date().toISOString(),
    source: "Aetherworld Constant Universe",
    safetyNotes: SAFETY_NOTES,
  };
}

export function exportConstantUniverse() {
  return { metadata: meta(), constants: CONSTANT_REGISTRY };
}

export function exportDigitConstants() {
  return { metadata: meta(), constants: listByCategory("DIGIT_CONSTANT") };
}

export function exportEngineWeights() {
  return { metadata: meta(), constants: listByCategory("ENGINE_WEIGHT") };
}

export function exportWorldConstants() {
  return {
    metadata: meta(),
    constants: [
      ...listByCategory("WORLD_SIMULATION"),
      ...listByCategory("WORLD_GROWTH"),
      ...listByCategory("WORLD_SOCIETY"),
      ...listByCategory("CIVILIZATION"),
      ...listByCategory("PRESENTATION"),
    ],
  };
}

export function exportRiskConstants() {
  return { metadata: meta(), constants: listByCategory("RISK_BOUNDARY") };
}

export function exportCompressionConstants() {
  return { metadata: meta(), constants: listByCategory("COMPRESSION") };
}

export function exportConstantAuditReport(): string {
  const conflicts = detectConstantConflicts();
  const ver = getCurrentVersion();
  const lines: string[] = [];
  lines.push(`# Constant Universe Audit Report`);
  lines.push(``);
  lines.push(`- 版本：${ver.version}`);
  lines.push(`- 常数总数：${CONSTANT_REGISTRY.length}`);
  lines.push(`- 冲突数：${conflicts.length}`);
  lines.push(``);
  lines.push(`## 安全声明`);
  for (const n of SAFETY_NOTES) lines.push(`- ${n}`);
  lines.push(``);
  lines.push(`## 冲突明细`);
  if (conflicts.length === 0) lines.push(`- 无冲突`);
  for (const c of conflicts) lines.push(`- [${c.severity}] ${c.conflictId} — ${c.explanation} → ${c.suggestedFix}`);
  return lines.join("\n");
}

export function exportConstantVersionDiff(a: string, b: string): string {
  const d = diffVersions(a, b);
  return [
    `# Constant Version Diff`,
    ``,
    `- A: ${d.versionA} (常数变更数 ${d.constantCountA})`,
    `- B: ${d.versionB} (常数变更数 ${d.constantCountB})`,
    ``,
    `## 备注`,
    ...d.notes.map((n) => `- ${n}`),
  ].join("\n");
}
