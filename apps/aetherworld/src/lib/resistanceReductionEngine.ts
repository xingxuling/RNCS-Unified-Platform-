import { BREAKTHROUGH_RESISTANCES, type BreakthroughResistance } from "@/constants/breakthroughResistanceTypes";
import type { BreakthroughObjectType } from "@/constants/breakthroughObjectTypes";

export interface ResistanceItem {
  resistance: BreakthroughResistance;
  intensity: number; // 0-1
  reason: string;
}

export interface ResistanceReductionResult {
  topResistances: ResistanceItem[];
  reductionPlan: string[];
  remainingNoise: number;
}

const SIGNAL_MAP: Record<string, RegExp> = {
  INFORMATION_MISSING: /不知道|不清楚|不确定|没数据/,
  USER_UNCLEAR: /没用户|不知道为谁/,
  VALUE_UNCLEAR: /价值|意义|为什么做/,
  RESOURCE_LACK: /没钱|没人|没时间|资源/,
  STRUCTURE_MISSING: /乱|流程|没标准/,
  TIMING_NOT_READY: /时机|等|窗口|早了|晚了/,
  FIELD_NOT_SUPPORTIVE: /平台|限流|被封|合规/,
  LANGUAGE_TOO_COMPLEX: /看不懂|术语|太复杂/,
  TRUST_GAP: /不信|不回|观望/,
  FEEDBACK_MISSING: /没反馈|没回应|黑箱/,
  ACTION_OVERLOAD: /太多事|做不完|累/,
  NOISE_HIGH: /噪声|刷屏|信息过载/,
  FALSE_SIGNAL: /可能是错觉|不确定真假/,
  EMOTIONAL_DISTORTION: /情绪|崩|愤怒|难过|焦虑/,
  SCOPE_DRIFT: /又加|新需求|越变越大/,
  OVER_MYTHIFICATION: /命运|神|绝对|注定/,
  SYSTEM_OVERGROWTH: /模块太多|互相依赖/,
  LEGAL_ADMIN_BLOCK: /违规|合规|法律|账号风险/,
  BODY_LIMITATION: /身体|睡眠|疲劳|生病/,
  SOCIAL_MISALIGNMENT: /人群|受众|错位/,
};

export function analyzeResistance(text: string, objectType: BreakthroughObjectType): ResistanceReductionResult {
  const items: ResistanceItem[] = [];
  const t = text.toLowerCase();
  BREAKTHROUGH_RESISTANCES.forEach((r) => {
    const re = SIGNAL_MAP[r.id];
    let intensity = 0;
    if (re && re.test(text)) intensity += 0.6;
    if (objectType.commonResistances.includes(r.id)) intensity += 0.35;
    if (intensity > 0) items.push({ resistance: r, intensity: Math.min(1, intensity), reason: re && re.test(text) ? "文本含信号" : "对象常见阻力" });
  });
  items.sort((a, b) => b.intensity - a.intensity);
  const top = items.slice(0, 5);
  const plan = top.flatMap((i) => i.resistance.reductionActions.slice(0, 2).map((a) => `${i.resistance.userFriendlyName}：${a}`));
  const remainingNoise = Math.max(0, 1 - top.reduce((s, i) => s + i.intensity, 0) / 5);
  return { topResistances: top, reductionPlan: plan.slice(0, 8), remainingNoise: Number(remainingNoise.toFixed(2)) };
  void t;
}
