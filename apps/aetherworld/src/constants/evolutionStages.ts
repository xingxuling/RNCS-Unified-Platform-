// 进化阶段 Evolution Stages
export interface EvolutionStageDef {
  id: string;
  name: string;
  en: string;
  minSignals: number;
  description: string;
}

export const EVOLUTION_STAGES: EvolutionStageDef[] = [
  { id: "SEED_APP",          name: "种子应用",   en: "Seed App",          minSignals: 0,    description: "刚刚开始，系统数据不足。" },
  { id: "OBSERVING_APP",     name: "观察应用",   en: "Observing App",     minSignals: 20,   description: "开始记录常用模块与偏好。" },
  { id: "ADAPTING_APP",      name: "适应应用",   en: "Adapting App",      minSignals: 100,  description: "开始推荐首页、语言、快捷方式调整。" },
  { id: "PERSONALIZING_APP", name: "个人化应用", en: "Personalizing App", minSignals: 300,  description: "形成明显个人 App Profile。" },
  { id: "SELF_TUNING_APP",   name: "自调参应用", en: "Self-Tuning App",   minSignals: 800,  description: "根据回验自动调整推荐权重。" },
  { id: "LIVING_APP",        name: "生命化应用", en: "Living App",        minSignals: 2000, description: "稳定的本地个性，持续个性化。" },
];

export function resolveStage(signalCount: number, validatedEvents = 0): EvolutionStageDef {
  let stage = EVOLUTION_STAGES[0];
  for (const s of EVOLUTION_STAGES) {
    if (signalCount >= s.minSignals) stage = s;
  }
  if (stage.id === "LIVING_APP" && validatedEvents < 10) {
    return EVOLUTION_STAGES.find(s => s.id === "SELF_TUNING_APP")!;
  }
  return stage;
}
