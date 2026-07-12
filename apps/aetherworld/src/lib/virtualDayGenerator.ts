// 虚拟日生成器
import { resolveCurrentLifeState } from "./virtualLifeStateEngine";
import { getCurrentRhythm } from "./virtualRoutineEngine";
import { planQuests, type VirtualLifeQuest } from "./virtualLifeQuestEngine";
import { generateNpcEncounter, type VirtualNpcEncounter } from "./virtualLifeNpcEncounterEngine";
import { pickRealityAnchor, type RealityAnchor } from "./virtualRealityAnchorEngine";
import { getSafetyNote } from "./virtualLifeSafetyGuard";
import { getLifeMode } from "@/constants/virtualLifeModes";

export interface VirtualDayInput {
  subjectId: string;
  worldId: string;
  lifeMode: string;
  currentDate: string; // ISO date
  recentFeedback?: Record<string, unknown>;
  activeQuests?: Record<string, unknown>;
  recentRealActions?: string[];
  realityIssue?: string;
  founderActive?: boolean;
  escapismRisk?: number;
}

export interface VirtualDayResult {
  dayTitle: string;
  wakeUpLocation: string;
  currentLifeState: { id: string; name: string; description: string };
  weatherMood: string;
  mainZone: string;
  dailyTheme: string;
  lifeMode: string;
  lifeModeName: string;
  rhythm: { id: string; name: string; scene: string; advice: string };
  mainQuest: VirtualLifeQuest;
  sideQuests: VirtualLifeQuest[];
  npcEncounter?: VirtualNpcEncounter;
  realityAnchor: RealityAnchor;
  eveningReflectionPrompt: string;
  safetyNote: string;
  generatedAt: string;
}

const ZONES = ["产品工坊", "归档大厅", "桥头广场", "静林", "城塞主门", "写作塔", "回验之井", "锚石中庭"];
const WAKE = ["工坊旁的观测室", "回廊尽头的小屋", "锚石中庭的石榻", "桥头客栈三层", "写作塔顶的观星台"];
const MOODS = ["薄雾微光", "金色日出", "细雨低声", "高云清风", "夜后初晴"];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function generateVirtualDay(input: VirtualDayInput): VirtualDayResult {
  const seed = `${input.subjectId}|${input.worldId}|${input.lifeMode}|${input.currentDate}`;
  const hh = hash(seed);
  const date = new Date(input.currentDate);
  const rhythm = getCurrentRhythm(date);
  const state = resolveCurrentLifeState({
    hour: date.getHours(),
    recentRealActions: input.recentRealActions,
    escapismRisk: input.escapismRisk,
  });
  const mode = getLifeMode(input.lifeMode);

  const mainZone = ZONES[hh % ZONES.length];
  const wakeUp = WAKE[(hh >> 3) % WAKE.length];
  const mood = MOODS[(hh >> 5) % MOODS.length];

  const themes: Record<string, string[]> = {
    DEMO_LIFE:            ["试一次虚拟生活的节奏"],
    LIGHT_PERSONAL_LIFE:  ["把今天压缩成一个最小可完成动作"],
    FULL_PERSONAL_LIFE:   ["让深度信号转成一次真实落地"],
    CREATOR_LIFE:         ["把混乱想法变成一个具体作品片段"],
    RECOVERY_LIFE:        ["降一档，先恢复再前进"],
    PRODUCT_BUILDER_LIFE: ["把混乱想法变成一个可执行入口"],
    RELATIONSHIP_LIFE:    ["观察一次关系信号并做最小回应"],
    FOUNDER_LIFE:         ["把世界管理上的一个口子收掉"],
  };
  const dailyTheme = (themes[input.lifeMode] ?? themes.LIGHT_PERSONAL_LIFE)[0];

  const quests = planQuests({ lifeMode: input.lifeMode, seed, founderActive: input.founderActive });
  const npc = generateNpcEncounter({
    seed: seed + "|npc",
    lifeMode: input.lifeMode,
    founderActive: input.founderActive,
    realityIssue: input.realityIssue,
  });

  const anchor = pickRealityAnchor(seed,
    input.lifeMode === "RECOVERY_LIFE" ? "REST" :
    input.lifeMode === "RELATIONSHIP_LIFE" ? "SOCIAL" :
    input.lifeMode === "CREATOR_LIFE" ? "CREATION" :
    input.lifeMode === "PRODUCT_BUILDER_LIFE" ? "ACTION" :
    input.lifeMode === "FOUNDER_LIFE" ? "SAFETY" : undefined,
  );

  const dayTitle = `${mood}下的${mainZone}`;
  const eveningPrompt = `今天哪一件事真的发生了？它给了什么反馈？明天能否更小一点？`;

  return {
    dayTitle,
    wakeUpLocation: wakeUp,
    currentLifeState: { id: state.id, name: state.userFriendlyName, description: state.description },
    weatherMood: mood,
    mainZone,
    dailyTheme,
    lifeMode: input.lifeMode,
    lifeModeName: mode?.userFriendlyName ?? input.lifeMode,
    rhythm: { id: rhythm.id, name: rhythm.userFriendlyName, scene: rhythm.virtualScene, advice: rhythm.realAdvice },
    mainQuest: quests.mainQuest,
    sideQuests: quests.sideQuests,
    npcEncounter: npc,
    realityAnchor: anchor,
    eveningReflectionPrompt: eveningPrompt,
    safetyNote: getSafetyNote(),
    generatedAt: new Date().toISOString(),
  };
}
