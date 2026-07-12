// 宇宙世界生成模型 · 主引擎
import { compileWorldSeed } from "./worldSeedCompiler";
import { resolveArchetype, resolveUserRole } from "./worldArchetypeResolver";
import { generateWorldRules } from "./worldRuleGenerator";
import { generateWorldZones, generateEventMap } from "./worldEventMapGenerator";
import { generateNarrative } from "./worldNarrativeGenerator";
import { getWorldMode } from "@/constants/worldGenerationModes";
import { getActiveSubject } from "./store";
import type { SubjectModel } from "./types";
import type { PersonalWorldInput, PersonalWorldResult } from "./personalWorldCalculus";

const DOMAINS = ["tian", "di", "ren", "shen", "feng"] as const;
const DOMAIN_NAMES: Record<string, string> = { tian: "天", di: "地", ren: "人", shen: "神", feng: "风" };

function computeDomainBalance(subject: SubjectModel | null): { dominant: string; weakest: string } {
  if (!subject?.digits?.length) return { dominant: "feng", weakest: "shen" };
  const sums: Record<string, number> = { tian: 0, di: 0, ren: 0, shen: 0, feng: 0 };
  subject.digits.forEach(row => row.forEach((d, i) => { sums[DOMAINS[i]] = (sums[DOMAINS[i]] ?? 0) + d; }));
  const sorted = (Object.keys(sums) as string[]).sort((a, b) => sums[b] - sums[a]);
  return { dominant: sorted[0], weakest: sorted[sorted.length - 1] };
}

const SAFETY_NOTE =
  "这是基于你输入数据生成的象征性个人世界模型，用于自我理解、创作、决策辅助与结构可视化。它不代表绝对命运，不构成医疗、法律、金融、投资或心理诊断建议。";

export function generatePersonalWorld(input: PersonalWorldInput): PersonalWorldResult {
  const mode = getWorldMode(input.selectedMode);
  const subject = input.subjectMode === "DEMO" ? null : getActiveSubject();
  const seed = compileWorldSeed(subject, mode.id);
  const { dominant, weakest } = computeDomainBalance(subject);
  const archetype = resolveArchetype(seed, dominant);
  const userRole = resolveUserRole(archetype.id, seed.dominantNumber);
  const worldRules = generateWorldRules(seed, dominant);
  const worldZones = generateWorldZones(seed, dominant);
  const eventMap = generateEventMap(worldZones);

  const worldName = `${archetype.userFriendlyName} · ${seed.signature}`;
  const worldSubtitle = `${mode.name} · 主导域「${DOMAIN_NAMES[dominant]}」· 核心数字 ${seed.dominantNumber}`;

  const narrativeSummary = generateNarrative({
    worldName, archetype, userRole, zones: worldZones,
    styleId: input.narrativeStyle ?? mode.defaultNarrativeStyle,
    dominantNumber: seed.dominantNumber,
  });

  const unopenedZones = worldZones
    .filter(z => z.state === "HIDDEN" || z.state === "LOCKED")
    .map(z => z.zoneName);

  const growthPath = `下一步：在「${(worldZones.find(z => z.state === "OPEN")?.zoneName) ?? "开放区域"}」做一次小步推进，并将结果记录到记录中心，以校准世界稳定度。`;

  const safetyParts: string[] = [SAFETY_NOTE];
  if (mode.privacyNote) safetyParts.push(mode.privacyNote);

  return {
    worldName, worldSubtitle,
    worldArchetype: archetype,
    worldSeedSignature: seed.signature,
    dominantDomain: dominant,
    weakestDomain: weakest,
    dominantNumber: seed.dominantNumber,
    missingNumbers: seed.missingNumbers,
    worldRules, worldZones, eventMap,
    userRole,
    actionStyle: archetype.actionStyle,
    riskPattern: archetype.riskPattern,
    growthPath,
    unopenedZones,
    narrativeSummary,
    safetyNote: safetyParts.join(" "),
    generatedAt: new Date().toISOString(),
  };
}

export function exportWorldMarkdown(r: PersonalWorldResult): string {
  return [
    `# ${r.worldName}`,
    `> ${r.worldSubtitle}`, ``,
    `## 世界一句话定义`, r.worldArchetype.description, ``,
    `## 你的角色`, `${r.userRole.userFriendlyName} — ${r.userRole.description}`, ``,
    `## 世界主法则`,
    ...r.worldRules.slice(0, 4).map(rule => `- **${rule.ruleName}**：${rule.userFriendlyExplanation}`), ``,
    `## 当前开放区域`,
    ...r.worldZones.filter(z => z.state === "OPEN").map(z => `- ${z.zoneName}（${z.explanation}）`), ``,
    `## 当前锁定 / 隐藏区域`,
    ...r.unopenedZones.map(z => `- ${z}`), ``,
    `## 常发事件`, ...r.eventMap.recurring.map(e => `- ${e.label}`), ``,
    `## 最大风险`, r.riskPattern, ``,
    `## 最适合的行动方式`, r.actionStyle, ``,
    `## 下一步建议`, r.growthPath, ``,
    `## 叙事报告`, r.narrativeSummary, ``,
    `---`, `**安全说明**：${r.safetyNote}`,
  ].join("\n");
}

export function exportWorldJSON(r: PersonalWorldResult): string {
  return JSON.stringify(r, null, 2);
}

export function exportXiaohongshu(r: PersonalWorldResult): string {
  return `✨ 我生成了我的个人世界：${r.worldArchetype.userFriendlyName}\n\n` +
    `角色：${r.userRole.userFriendlyName}\n核心数字：${r.dominantNumber}\n主导域：${r.dominantDomain}\n\n` +
    `${r.narrativeSummary}\n\n（基于 Aether Fate Engine 个人世界生成体验，结构性象征模型，非命运断言）\n#个人世界 #自我理解`;
}
