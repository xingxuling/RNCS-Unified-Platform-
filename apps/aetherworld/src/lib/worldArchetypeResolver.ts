// 世界原型解析：基于种子选择最匹配的世界原型
import { WORLD_ARCHETYPES, type WorldArchetype } from "@/constants/worldArchetypes";
import type { WorldSeed } from "./worldSeedCompiler";

export interface ArchetypeScore { archetype: WorldArchetype; score: number; }

export function resolveArchetype(seed: WorldSeed, dominantDomain: string): WorldArchetype {
  const scored: ArchetypeScore[] = WORLD_ARCHETYPES.map(a => {
    let score = 0;
    if (a.relatedNumbers.includes(seed.dominantNumber)) score += 5;
    if (a.relatedDomains.includes(dominantDomain)) score += 4;
    a.relatedNumbers.forEach(n => { score += (seed.digitFrequency[n] ?? 0) * 0.2; });
    return { archetype: a, score };
  }).sort((a, b) => b.score - a.score);
  return scored[0].archetype;
}

// 用户角色生成
export interface UserRole {
  id: string;
  name: string;
  userFriendlyName: string;
  description: string;
  strengths: string[];
  risks: string[];
  actionAdvice: string;
}

export const USER_ROLES: UserRole[] = [
  { id: "signal_reader", name: "Signal Reader", userFriendlyName: "信号读取者",
    description: "擅长识别微妙变化与隐藏模式。",
    strengths: ["敏感度高", "提前察觉"], risks: ["容易把噪声当信号"],
    actionAdvice: "先记录，等回验，再行动。" },
  { id: "world_forger", name: "World Forger", userFriendlyName: "世界锻造者",
    description: "擅长把想法变成系统与产品。",
    strengths: ["结构感", "执行力"], risks: ["容易过度堆叠功能"],
    actionAdvice: "MVP 先成立，再加层。" },
  { id: "threshold_walker", name: "Threshold Walker", userFriendlyName: "边界行者",
    description: "经常处于旧状态与新状态之间。",
    strengths: ["跨界感", "适应快"], risks: ["难以稳定收尾"],
    actionAdvice: "每一阶段都做一个小型收口。" },
  { id: "wind_architect", name: "Wind Architect", userFriendlyName: "风之架构师",
    description: "擅长把变化设计成规则。",
    strengths: ["建模能力强"], risks: ["规则过紧"],
    actionAdvice: "保留 20% 余量给意外。" },
  { id: "memory_cartographer", name: "Memory Cartographer", userFriendlyName: "记忆制图师",
    description: "擅长把过去经验整理成地图。",
    strengths: ["反思力强"], risks: ["容易陷入回忆"],
    actionAdvice: "每周一次回顾，其余时间向前。" },
  { id: "founder_operator", name: "Founder Operator", userFriendlyName: "创始人操作员",
    description: "擅长控制系统、推进版本与治理复杂度。",
    strengths: ["治理力", "复杂度控制"], risks: ["权限堆叠"],
    actionAdvice: "先建权限，再做发布。" },
  { id: "mythic_translator", name: "Mythic Translator", userFriendlyName: "神话翻译者",
    description: "擅长把高位叙事翻译成现实语言。",
    strengths: ["叙事力"], risks: ["过度神话化"],
    actionAdvice: "用一个可量化指标对齐叙事。" },
];

export function resolveUserRole(archetypeId: string, dominantNumber: number): UserRole {
  const map: Record<string, string> = {
    SIGNAL_FOREST_WORLD: "signal_reader",
    ORDER_FORGE_WORLD: "world_forger",
    WIND_CONVERGENCE_WORLD: "wind_architect",
    RECOVERY_SANCTUARY_WORLD: "memory_cartographer",
    FOUNDER_CITADEL_WORLD: "founder_operator",
    MYTHIC_MAINLINE_WORLD: "mythic_translator",
    CHAOS_NAVIGATION_WORLD: "threshold_walker",
    CREATION_STARFIELD_WORLD: "mythic_translator",
    RELATION_TIDE_WORLD: "threshold_walker",
    RESOURCE_CITY_WORLD: "world_forger",
  };
  const rid = map[archetypeId] ?? (dominantNumber >= 7 ? "mythic_translator" : "signal_reader");
  return USER_ROLES.find(r => r.id === rid) ?? USER_ROLES[0];
}
