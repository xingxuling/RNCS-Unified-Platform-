// NPC Behavior Engine
import { buildSequenceCoreProfile } from "./sequenceCoreEngine";
import type { SequenceCoreProfile } from "./sequenceCoreEngine";
import type { WorldStateProfile } from "./worldStateEngine";
import { DIGIT_NPC_AFFINITY, NPC_ARCHETYPE_LABEL, type NpcArchetype } from "@/constants/sequence-world/npcBehaviorTypes";

export interface NpcBehaviorInput {
  npcName: string;
  npcSequence?: string[];
  worldState: WorldStateProfile;
  relationToSubject?: string;
  role?: string;
}

export interface NpcBehaviorProfile {
  npcName: string;
  archetype: NpcArchetype;
  archetypeLabel: string;
  dominantNeed: string;
  behaviorStyle: string;
  dialogueStyle: string;
  trustLevel: number;       // 0-1
  conflictLevel: number;    // 0-1
  questAffinity: number;    // 0-1
  likelyActions: string[];
  forbiddenActions: string[];
}

function pickArchetype(core: SequenceCoreProfile, hintedRole?: string): NpcArchetype {
  if (hintedRole && Object.keys(NPC_ARCHETYPE_LABEL).includes(hintedRole)) return hintedRole as NpcArchetype;
  const top = core.dominantDigits[0] ?? "2";
  return DIGIT_NPC_AFFINITY[top]?.[0] ?? "Observer";
}

const NEED_BY_DIGIT: Record<string, string> = {
  "0":"封存与归档", "1":"确立主权", "2":"建立连接", "3":"传递信息",
  "4":"守护规则", "5":"推动变化", "6":"维持生机", "7":"探索潜层",
  "8":"积累资源", "9":"完成终局",
};

export function generateNpcBehavior(input: NpcBehaviorInput): NpcBehaviorProfile {
  const seqRows = input.npcSequence && input.npcSequence.length ? input.npcSequence : ["24682"];
  const core = buildSequenceCoreProfile({
    id: `npc-${input.npcName}`, name: input.npcName,
    sequenceMode: "OBJECT", sequences: seqRows, targetType: "NPC",
  });
  const top = core.dominantDigits[0] ?? "2";
  const archetype = pickArchetype(core, input.role);
  const f = core.digitFrequency;
  const total = Object.values(f).reduce((s, n) => s + n, 0) || 1;

  const trustLevel    = Math.min(1, 0.3 + (f["2"] ?? 0) / total + (f["6"] ?? 0) / total * 0.8);
  const conflictLevel = Math.min(1, 0.2 + (f["5"] ?? 0) / total + (f["4"] ?? 0) / total * 0.5);
  const questAffinity = Math.min(1, 0.3 + (f["1"] ?? 0) / total + (f["9"] ?? 0) / total);

  const behaviorStyle = `${core.dominantDigits.map(d => NEED_BY_DIGIT[d]).filter(Boolean).slice(0, 2).join(" / ")} 取向`;
  const dialogueStyle = (f["3"] ?? 0) / total > 0.2 ? "符号化、富表达" : (f["7"] ?? 0) / total > 0.2 ? "含蓄、暗示" : "直接、简洁";

  const likelyActions = [
    `${archetype} 默认会${NEED_BY_DIGIT[top] ?? "保持观察"}`,
    `在世界相位「${input.worldState.currentPhase}」下倾向回应主导力量`,
  ];
  const forbiddenActions = [
    "不得违反世界主法则",
    archetype === "Gatekeeper" ? "不得直接放行未通过条件的主体" : "不得未经互动直接进入冲突",
  ];

  return {
    npcName: input.npcName,
    archetype,
    archetypeLabel: NPC_ARCHETYPE_LABEL[archetype],
    dominantNeed: NEED_BY_DIGIT[top] ?? "保持平衡",
    behaviorStyle,
    dialogueStyle,
    trustLevel: Number(trustLevel.toFixed(2)),
    conflictLevel: Number(conflictLevel.toFixed(2)),
    questAffinity: Number(questAffinity.toFixed(2)),
    likelyActions,
    forbiddenActions,
  };
}
