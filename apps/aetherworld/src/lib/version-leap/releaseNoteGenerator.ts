import type { VersionLeapScore } from "./versionLeapScorer";
import type { VersionClassification } from "./versionTypeClassifier";
import type { VersionChangeRecord } from "./versionChangeDetector";

export interface ReleaseNote {
  version: string;
  releaseName: string;
  date: string;
  summary: string;
  highlights: string[];
  newFeatures: string[];
  improvements: string[];
  fixes: string[];
  breakingChanges: string[];
  safetyUpdates: string[];
  docsUpdates: string[];
  knownIssues: string[];
  migrationNotes: string[];
  founderNotes?: string[];
}

export interface GenerateReleaseNoteInput {
  version: string;
  releaseName: string;
  level: string;
  score: VersionLeapScore;
  classification: VersionClassification;
  changes: VersionChangeRecord[];
  audience: "PUBLIC" | "FOUNDER";
}

function bucket(changes: VersionChangeRecord[]) {
  const features: string[] = [];
  const improvements: string[] = [];
  const fixes: string[] = [];
  const safety: string[] = [];
  const docs: string[] = [];
  const breaking: string[] = [];

  changes.forEach((c) => {
    const line = `${c.description} (${c.modules.join(", ")})`;
    if (c.changeType === "ENGINE_ADDED" || c.changeType === "MODULE_ADDED") features.push(line);
    else if (c.changeType === "BUG_FIX" || c.changeType === "UI_FIX") fixes.push(line);
    else if (c.changeType === "SAFETY_RULE_UPDATE" || c.changeType === "PERMISSION_UPDATE") safety.push(line);
    else if (c.changeType === "DOCS_UPDATE" || c.changeType === "USAGE_EXAMPLE_UPDATE") docs.push(line);
    else if (c.changeType === "ARCHITECTURE_CHANGE" || c.changeType === "DATA_STRUCTURE_UPDATE" || c.changeType === "PRODUCT_POSITIONING_CHANGE") breaking.push(line);
    else improvements.push(line);
  });

  return { features, improvements, fixes, safety, docs, breaking };
}

export function generateReleaseNote(input: GenerateReleaseNoteInput): ReleaseNote {
  const b = bucket(input.changes);
  const isFounder = input.audience === "FOUNDER";

  const summary =
    `本次版本 ${input.version}（${input.releaseName}）评分 ${input.score.totalScore}，级别 ${input.level}，` +
    `涉及 ${input.changes.length} 项变更、${input.score.affectedScopes.length} 个影响范围。`;

  const highlights: string[] = [];
  if (b.features.length) highlights.push(`新增 ${b.features.length} 项功能/引擎`);
  if (b.safety.length) highlights.push(`${b.safety.length} 项安全规则更新`);
  if (b.breaking.length) highlights.push(`${b.breaking.length} 项重大变更`);
  if (!highlights.length) highlights.push("增量改进与稳定性提升");

  return {
    version: input.version,
    releaseName: input.releaseName,
    date: new Date().toISOString().slice(0, 10),
    summary,
    highlights,
    newFeatures: b.features,
    improvements: b.improvements,
    fixes: b.fixes,
    breakingChanges: b.breaking,
    safetyUpdates: b.safety,
    docsUpdates: b.docs,
    knownIssues: [],
    migrationNotes: input.classification.requiresMigration
      ? ["建议在升级前阅读 Migration Plan 并备份本地数据。"] : [],
    founderNotes: isFounder ? [
      `跃迁评分：${input.score.totalScore}`,
      `强制规则：${input.score.forcedRules.join("; ") || "无"}`,
      `待办：${input.score.requiredFollowUps.join("; ") || "无"}`,
      `Release Type：${input.classification.releaseType}`,
      `Founder Approval：${input.classification.requiresFounderApproval ? "需要" : "不需要"}`,
    ] : undefined,
  };
}

export function renderReleaseNoteMarkdown(note: ReleaseNote): string {
  const sec = (title: string, items: string[]) =>
    items.length ? `\n### ${title}\n${items.map((i) => `- ${i}`).join("\n")}\n` : "";
  return [
    `# ${note.version} — ${note.releaseName}`,
    `_${note.date}_`,
    "",
    note.summary,
    sec("亮点", note.highlights),
    sec("新功能", note.newFeatures),
    sec("改进", note.improvements),
    sec("修复", note.fixes),
    sec("重大变更", note.breakingChanges),
    sec("安全更新", note.safetyUpdates),
    sec("文档更新", note.docsUpdates),
    sec("迁移说明", note.migrationNotes),
    sec("已知问题", note.knownIssues),
    note.founderNotes ? sec("Founder 备注", note.founderNotes) : "",
  ].join("\n");
}
