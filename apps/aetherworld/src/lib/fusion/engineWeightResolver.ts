// 引擎权重解析：根据用户输入、intent、calculus route 选择 EngineWeightProfile。
import {
  ENGINE_WEIGHT_PROFILES,
  getEngineWeightProfile,
  type EngineWeightProfile,
  type EngineWeightItem,
} from "@/constants/engine/engineWeightConstants";
import type { CalculusId, CalculusRoute } from "@/lib/chat/calculusRouteResultTypes";
import type { EngineWeightSummary } from "./fusionTypes";

const CALCULUS_TO_INTENT: Partial<Record<CalculusId, string>> = {
  APP_RUNTIME_CALCULUS: "APP_CREATION",
  CODE_SANDBOX_CALCULUS: "CODE_TASK",
  WORLD_ENGINE_CALCULUS: "WORLD_GENERATION",
  VOCAL_ENGINE_CALCULUS: "MUSIC_CREATION",
  NARRATIVE_CALCULUS: "MUSIC_CREATION",
  SEQUENCE_TASK_CALCULUS: "SEQUENCE_TASK",
  GOVERNANCE_CALCULUS: "GOVERNANCE_AUDIT",
  CALENDAR_TRIGGER_CALCULUS: "CALENDAR_TRIGGER",
  SOCIAL_PUBLISH_CALCULUS: "SOCIAL_PUBLISH",
  STORE_CAPABILITY_CALCULUS: "STORE_CAPABILITY",
};

export function resolveEngineProfile(opts: {
  raw: string;
  route: CalculusRoute;
}): EngineWeightProfile {
  const primary = opts.route.primaryCalculusId;
  const intent = (primary && CALCULUS_TO_INTENT[primary]) || "CHAT_GENERAL";
  return getEngineWeightProfile(intent) ?? ENGINE_WEIGHT_PROFILES[0];
}

export function buildEngineWeightSummary(profile: EngineWeightProfile): EngineWeightSummary {
  const active: EngineWeightItem[] = [
    ...profile.primaryEngines,
    ...profile.supportEngines,
    ...profile.validationEngines,
  ];
  return {
    intentType: profile.intentType,
    chineseName: profile.chineseName,
    activeEngines: active,
    primaryTop: [...active].sort((a, b) => b.weight - a.weight).slice(0, 4),
    safetyWeight: profile.safetyWeight,
  };
}

export function buildEngineWeightPrompt(summary: EngineWeightSummary): string {
  const top = summary.primaryTop
    .map((e) => `${e.engineId} ${e.weight.toFixed(2)}`)
    .join(" / ");
  return [
    "【引擎权重】",
    `任务类型：${summary.chineseName}（${summary.intentType}）`,
    `主要引擎：${top}`,
    `安全权重：${summary.safetyWeight.toFixed(2)}`,
  ].join("\n");
}
