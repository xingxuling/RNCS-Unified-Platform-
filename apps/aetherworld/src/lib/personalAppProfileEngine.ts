// 个人 App Profile 引擎
import { loadMemory, saveMemory } from "./localEvolutionMemory";
import { computeBioEvolution } from "./bioProductEvolutionEngine";
import { APP_ARCHETYPES, DEFAULT_APP_PROFILE, type PersonalAppProfile } from "@/constants/personalAppProfileSchema";

const KEY = "personalAppProfile";

export function loadProfile(): PersonalAppProfile {
  if (typeof window === "undefined") return DEFAULT_APP_PROFILE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_APP_PROFILE;
    return { ...DEFAULT_APP_PROFILE, ...JSON.parse(raw) };
  } catch { return DEFAULT_APP_PROFILE; }
}

export function saveProfile(p: PersonalAppProfile) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* quota */ }
}

export function resetProfile() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

function pickArchetype(featureAffinity: Record<string, number>): string {
  const scores: Record<string, number> = {};
  for (const a of APP_ARCHETYPES) {
    scores[a.id] = a.recommendedModules.reduce((s, m) => s + (featureAffinity[m] ?? 0), 0);
  }
  let best = "MINIMAL_DAILY_APP", bestScore = -1;
  for (const [id, s] of Object.entries(scores)) {
    if (s > bestScore) { best = id; bestScore = s; }
  }
  return best;
}

export interface AppProfileGeneration {
  profile: PersonalAppProfile;
  rationale: string[];
}

export function generateProfile(): AppProfileGeneration {
  const mem = loadMemory();
  const bio = computeBioEvolution();
  const archetypeId = pickArchetype(mem.featureAffinity);
  const arche = APP_ARCHETYPES.find(a => a.id === archetypeId)!;

  const topModules = bio.topFeatures.map(f => f.moduleId).slice(0, 6);
  const hidden = Object.entries(mem.featureAffinity)
    .filter(([, v]) => v < -1).map(([m]) => m);

  const profile: PersonalAppProfile = {
    profileId: `profile-${Date.now()}`,
    profileName: `${arche.name} · ${bio.stage.name}`,
    appArchetype: archetypeId,
    homeLayout: bio.signalCount > 300 ? "PERSONALIZED" : "STANDARD",
    preferredLanguageLevel: mem.languagePreference,
    preferredUIDensity: mem.uiDensityPreference,
    topModules: topModules.length ? topModules : arche.recommendedModules.slice(0, 5),
    hiddenModules: hidden,
    recommendedShortcuts: topModules.slice(0, 3),
    priorityDimensions: Object.keys(mem.dimensionAffinity).slice(0, 5),
    priorityEventTypes: bio.topEvents.map(e => e.eventTypeId).slice(0, 5),
    feedbackReminderStyle: mem.feedbackReliability < 0.4 ? "ACTIVE" : "GENTLE",
    promptForgeMode: bio.topPrompts.length > 3 ? "PERSONALIZED" : "STANDARD",
    worldGenerationMode: mem.worldGenerationPreference,
    safetyLevel: "STANDARD",
    lastEvolvedAt: new Date().toISOString(),
  };

  const rationale = [
    `根据 ${bio.signalCount} 条本地信号识别为「${arche.name}」原型。`,
    `当前阶段：${bio.stage.name}（${bio.stage.en}）。`,
    topModules.length ? `推荐首页模块：${topModules.join(", ")}` : "尚未识别足够偏好，沿用原型默认模块。",
    hidden.length ? `已隐藏低使用模块：${hidden.join(", ")}` : "暂无需要隐藏的模块。",
    `回验可靠度：${(mem.feedbackReliability * 100).toFixed(0)}%`,
  ];

  return { profile, rationale };
}

export function updateLanguagePreference(level: string) {
  const mem = loadMemory(); mem.languagePreference = level; saveMemory(mem);
}
export function updateWorldPreference(mode: string) {
  const mem = loadMemory(); mem.worldGenerationPreference = mode; saveMemory(mem);
}
export function updateUIDensity(density: string) {
  const mem = loadMemory(); mem.uiDensityPreference = density; saveMemory(mem);
}
