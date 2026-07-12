// Engine Export Adapter — central orchestrator and generic exporters
import { SEQUENCE_WORLD_ENGINE_VERSION } from "@/constants/sequence-world/exportTargetTypes";
import { buildSequenceCoreProfile, type SequenceCoreProfile, type SequenceInput } from "./sequenceCoreEngine";
import { interpretSequence, type SequenceInterpretation } from "./sequenceInterpreter";
import { generateWorldState, type WorldStateProfile } from "./worldStateEngine";
import { generateRenderProfile, type RenderProfile } from "./renderProfileEngine";
import { generateSemanticPhysics, type SemanticPhysicsProfile } from "./semanticPhysicsEngine";
import { generateAnimationProfile, type AnimationProfile } from "./animationProfileEngine";
import { generateNpcBehavior, type NpcBehaviorProfile } from "./npcBehaviorEngine";
import { generateQuestEvents, type QuestEventProfile } from "./questEventEngine";
import { generateWorldZones, type WorldZoneProfile } from "./worldZoneEngine";
import { runSafetyCheck, RECOMMENDED_DISCLAIMERS } from "./sequenceWorldSafetyGuard";

export interface SequenceWorldExport {
  metadata: {
    engineVersion: string;
    generatedAt: string;
    sourceMode: string;
    targetType: string;
  };
  sequenceCore: SequenceCoreProfile;
  interpretation: SequenceInterpretation;
  worldState: WorldStateProfile;
  renderProfile: RenderProfile;
  semanticPhysicsProfile: SemanticPhysicsProfile;
  animationProfile: AnimationProfile;
  npcProfiles: NpcBehaviorProfile[];
  questEvents: QuestEventProfile[];
  zones: WorldZoneProfile[];
  safetyNotes: string[];
}

export interface ComposeOptions {
  input: SequenceInput;
  npcs?: Array<{ name: string; sequence?: string[]; role?: string }>;
  questCount?: number;
  zoneCount?: number;
}

export function composeSequenceWorld(opts: ComposeOptions): SequenceWorldExport {
  const core = buildSequenceCoreProfile(opts.input);
  const interpretation = interpretSequence(core);
  const worldState = generateWorldState(core);
  const renderProfile = generateRenderProfile(core);
  const semanticPhysicsProfile = generateSemanticPhysics(core);
  const animationProfile = generateAnimationProfile(core);
  const zones = generateWorldZones(core, opts.zoneCount ?? 4);
  const questEvents = generateQuestEvents(core, worldState, opts.questCount ?? 4);

  const npcInputs = opts.npcs && opts.npcs.length
    ? opts.npcs
    : [{ name: "默认引导者" }, { name: "默认守门人", role: "Gatekeeper" }];
  const npcProfiles = npcInputs.map(n =>
    generateNpcBehavior({ npcName: n.name, npcSequence: n.sequence, role: n.role, worldState })
  );

  const safetyNotes = [...RECOMMENDED_DISCLAIMERS];
  if (core.sequenceMode === "FULL_60") safetyNotes.push("Full 60 模式涉及私密数据，仅在本地保存，不向云端传输。");

  return {
    metadata: {
      engineVersion: SEQUENCE_WORLD_ENGINE_VERSION,
      generatedAt: new Date().toISOString(),
      sourceMode: core.sequenceMode,
      targetType: core.targetType,
    },
    sequenceCore: core,
    interpretation,
    worldState,
    renderProfile,
    semanticPhysicsProfile,
    animationProfile,
    npcProfiles,
    questEvents,
    zones,
    safetyNotes,
  };
}

// ---------- generic exporters ----------
export function exportGenericJSON(world: SequenceWorldExport): string {
  return JSON.stringify(world, null, 2);
}

export function exportMarkdownReport(w: SequenceWorldExport): string {
  return [
    `# Sequence World Engine Report`,
    `> engine v${w.metadata.engineVersion} · ${w.metadata.sourceMode} · ${w.metadata.targetType}`,
    ``,
    `## 数列解读`,
    `- ${w.interpretation.oneLineSummary}`,
    `- ${w.interpretation.dominantStory}`,
    `- ${w.interpretation.missingStory}`,
    `- 五域偏向：${w.interpretation.domainStory}`,
    ``,
    `## 世界状态`,
    `- 相位：${w.worldState.currentPhase}`,
    `- 主导力量：${w.worldState.dominantForce}`,
    `- 氛围：${w.worldState.worldMood}`,
    `- 稳定度：${(w.worldState.stability * 100).toFixed(0)}% · 事件压力：${(w.worldState.eventPressure * 100).toFixed(0)}% · 熵：${(w.worldState.entropyLevel * 100).toFixed(0)}%`,
    ``,
    `## 渲染风格`,
    `- 调色板：${w.renderProfile.paletteName}（${w.renderProfile.primaryColors.join(", ")}）`,
    `- 背景：${w.renderProfile.backgroundStyle}`,
    `- 灯光：${w.renderProfile.lightingStyle}`,
    `- 符号意象：${w.renderProfile.symbolMotifs.join(", ")}`,
    ``,
    `## 语义物理`,
    `- ${w.semanticPhysicsProfile.physicsDescription}`,
    ``,
    `## 动画风格`,
    `- 动作：${w.animationProfile.movementStyle}`,
    `- 镜头：${w.animationProfile.cameraRhythm}`,
    `- 关键词：${w.animationProfile.animationKeywords.join(", ")}`,
    ``,
    `## NPC`,
    ...w.npcProfiles.map(n => `- **${n.npcName}**（${n.archetypeLabel}）：${n.behaviorStyle} · 信任 ${(n.trustLevel * 100).toFixed(0)}% / 冲突 ${(n.conflictLevel * 100).toFixed(0)}%`),
    ``,
    `## 任务事件`,
    ...w.questEvents.map(q => `- **${q.questTitle}** [${q.questTypeLabel}] — 触发：${q.triggerCondition}`),
    ``,
    `## 世界区域`,
    ...w.zones.map(z => `- **${z.zoneLabel}**：${z.atmosphere}`),
    ``,
    `---`,
    `**安全说明**`,
    ...w.safetyNotes.map(n => `- ${n}`),
  ].join("\n");
}

export function exportPromptForge(w: SequenceWorldExport): string {
  return [
    `# Sequence World Prompt`,
    `Generate a virtual world based on the following profile.`,
    ``,
    `Mode: ${w.metadata.sourceMode} · Target: ${w.metadata.targetType}`,
    `Dominant digits: ${w.sequenceCore.dominantDigits.join(", ")}`,
    `World phase: ${w.worldState.currentPhase}`,
    `Mood: ${w.worldState.worldMood}`,
    `Palette: ${w.renderProfile.paletteName} (${w.renderProfile.primaryColors.join(", ")})`,
    `Background: ${w.renderProfile.backgroundStyle}`,
    `Lighting: ${w.renderProfile.lightingStyle}`,
    `Motion bias: ${w.semanticPhysicsProfile.motionBias}`,
    `Gravity: ${w.semanticPhysicsProfile.gravityType}`,
    `Animation: ${w.animationProfile.movementStyle} · ${w.animationProfile.cameraRhythm}`,
    `Zones: ${w.zones.map(z => z.zoneLabel).join(", ")}`,
    `NPCs: ${w.npcProfiles.map(n => `${n.npcName}(${n.archetypeLabel})`).join(", ")}`,
    `Quests: ${w.questEvents.map(q => q.questTypeLabel).join(", ")}`,
    ``,
    `Constraint: this is a logic & presentation profile, not a full game engine.`,
    `Target engine (Unity/Godot/Three.js) is responsible for actual rendering, physics and performance.`,
  ].join("\n");
}

export function checkExportSafety(world: SequenceWorldExport, exportText: string) {
  return runSafetyCheck({
    core: world.sequenceCore,
    exportText,
    hasMetadata: !!world.metadata?.engineVersion,
    hasSafetyNote: world.safetyNotes.length > 0,
  });
}
