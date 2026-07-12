// 虚拟生活状态引擎
import { VIRTUAL_LIFE_STATES, getLifeState, type VirtualLifeState } from "@/constants/virtualLifeStates";
import { getRhythmForHour } from "@/constants/virtualDailyRhythms";

export interface StateContext {
  hour: number;
  recentRealActions?: string[];
  escapismRisk?: number; // 0-100
}

export function resolveCurrentLifeState(ctx: StateContext): VirtualLifeState {
  const rhythm = getRhythmForHour(ctx.hour);
  // 节律 -> 倾向状态
  const map: Record<string, string> = {
    MORNING_OPENING: "AWAKENING",
    MIDDAY_ACTION: "BUILDING",
    AFTERNOON_ADJUSTMENT: "TRANSITIONING",
    EVENING_REFLECTION: "REFLECTING",
    NIGHT_CREATION: "ARCHIVING",
  };
  let stateId = map[rhythm.id] ?? "EXPLORING";

  // 风险驱动覆盖
  if ((ctx.escapismRisk ?? 0) > 60) stateId = "RESTING";
  if ((ctx.recentRealActions?.length ?? 0) === 0 && rhythm.id === "MIDDAY_ACTION") stateId = "EXPLORING";

  return getLifeState(stateId) ?? VIRTUAL_LIFE_STATES[0];
}
