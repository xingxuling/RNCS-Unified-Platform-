// 进化突变规划器 Evolution Mutation Planner
import { loadMemory } from "./localEvolutionMemory";
import { computeBioEvolution } from "./bioProductEvolutionEngine";
import { loadProfile, generateProfile } from "./personalAppProfileEngine";
import { EVOLUTION_MUTATION_TYPES, getMutationDef, type EvolutionMutation } from "@/constants/evolutionMutationTypes";

function mk(
  type: string, reason: string, affectedModules: string[],
  beforeState: Record<string, unknown>, afterState: Record<string, unknown>,
  riskOverride?: "LOW" | "MEDIUM" | "HIGH",
): EvolutionMutation {
  const def = getMutationDef(type);
  const risk = riskOverride ?? def?.defaultRisk ?? "LOW";
  return {
    id: `mut-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type, reason, affectedModules, beforeState, afterState,
    riskLevel: risk,
    requiresConfirmation: risk !== "LOW",
    createdAt: new Date().toISOString(),
  };
}

export function planMutations(): EvolutionMutation[] {
  const mem = loadMemory();
  const bio = computeBioEvolution();
  const profile = loadProfile();
  const out: EvolutionMutation[] = [];

  // 1. Home reorder if top features differ from current
  const topModules = bio.topFeatures.map(f => f.moduleId).slice(0, 5);
  if (topModules.length >= 3 && JSON.stringify(topModules) !== JSON.stringify(profile.topModules.slice(0, topModules.length))) {
    out.push(mk("HOME_REORDER",
      `近期常用模块：${topModules.slice(0, 3).join(", ")}，建议调整首页顺序。`,
      topModules,
      { topModules: profile.topModules },
      { topModules },
    ));
  }

  // 2. Hide low-use modules
  const low = Object.entries(mem.featureAffinity).filter(([, v]) => v < -1).map(([m]) => m);
  for (const m of low) {
    if (!profile.hiddenModules.includes(m)) {
      out.push(mk("MODULE_HIDE", `${m} 长期未使用且多次快速退出，建议折叠。`, [m],
        { visible: true }, { visible: false }));
    }
  }

  // 3. Pin frequently favorited
  const favored = Object.entries(mem.featureAffinity).filter(([, v]) => v > 5).map(([m]) => m);
  for (const m of favored.slice(0, 3)) {
    if (!profile.recommendedShortcuts.includes(m)) {
      out.push(mk("MODULE_PIN", `${m} 使用频率高，建议固定到快捷区。`, [m],
        { pinned: false }, { pinned: true }));
    }
  }

  // 4. Beginner → Advanced
  const beginnerExits = mem.signals.filter(s => s.type === "BEGINNER_MODE_EXITED").length;
  if (mem.languagePreference === "BEGINNER" && (beginnerExits > 0 || bio.signalCount > 200)) {
    out.push(mk("BEGINNER_TO_ADVANCED",
      "你已熟悉系统，建议切换到高级模式以解锁更多模块。",
      ["/onboarding"], { mode: "BEGINNER" }, { mode: "ADVANCED" }));
  }

  // 5. Feedback reminder adjust
  if (mem.feedbackReliability < 0.4) {
    out.push(mk("FEEDBACK_REMINDER_ADJUST",
      "回验完成率偏低，建议启用主动回验提醒。",
      ["/feedback"],
      { style: profile.feedbackReminderStyle }, { style: "ACTIVE" }));
  }

  // 6. World mode prioritize
  const worldGenCount = mem.signals.filter(s => s.type === "WORLD_GENERATED").length;
  if (worldGenCount > 5 && profile.worldGenerationMode !== "FULL") {
    out.push(mk("WORLD_MODE_PRIORITIZE",
      "你频繁生成世界，建议将默认世界模式提升。",
      ["/world-generator", "/virtual-world"],
      { mode: profile.worldGenerationMode }, { mode: "FULL" }));
  }

  // 7. Profile update if stage advanced
  if (profile.appArchetype !== generateProfile().profile.appArchetype) {
    const next = generateProfile().profile;
    out.push(mk("PERSONAL_APP_PROFILE_UPDATE",
      `识别到新的 App 原型：${next.profileName}。`,
      next.topModules,
      { archetype: profile.appArchetype },
      { archetype: next.appArchetype },
    ));
  }

  return out;
}

export function listMutationTypes() { return EVOLUTION_MUTATION_TYPES; }
