export const VIRTUAL_LIFE_SAFETY_NOTE =
  "虚拟生活是用于自我理解、创作和行动锚定的体验层，不是现实替代品。请把每日虚拟任务落实到一个小的现实行动或记录。";

export interface VirtualLifeSafetyRule {
  id: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export const VIRTUAL_LIFE_SAFETY_RULES: VirtualLifeSafetyRule[] = [
  { id: "NO_ESCAPISM",         description: "不鼓励用任何方式逃避现实。",                     severity: "CRITICAL" },
  { id: "NPC_NOT_REAL",        description: "虚拟 NPC 不指向现实具体人物。",                  severity: "HIGH" },
  { id: "NOT_REAL_FATE",       description: "虚拟生活不是真实命运，仅供理解与行动锚定。",    severity: "HIGH" },
  { id: "NO_OVERIMMERSION",    description: "提示用户避免长时间沉浸，鼓励现实行动与休息。",  severity: "MEDIUM" },
  { id: "NO_SLEEP_DEPRIVE",    description: "深夜节律应提示休息，不鼓励熬夜。",              severity: "HIGH" },
  { id: "NO_DANGEROUS_ACTION", description: "不输出危险或违法的现实行动建议。",              severity: "CRITICAL" },
  { id: "NOT_PROFESSIONAL",    description: "不替代医疗/心理/法律/金融判断。",               severity: "HIGH" },
  { id: "SYSTEM_NOT_CONTROL",  description: "不暗示系统能控制现实结果。",                    severity: "HIGH" },
  { id: "FULL_60_PRIVACY",     description: "Full 60 数据不公开显示，需有隐私提示。",        severity: "HIGH" },
  { id: "DEMO_REAL_ISOLATION", description: "Demo Life 与 Real Life 数据完全隔离。",         severity: "HIGH" },
];

const FORBIDDEN_PATTERNS: RegExp[] = [
  /替代现实/i, /永远不用回到现实/i, /不需要睡觉/i, /必然成功/i, /命中100%/i,
  /可以替代医生|替代心理咨询|替代律师|替代投资顾问/i,
];

export function scanVirtualLifeText(text: string): string[] {
  const hits: string[] = [];
  for (const p of FORBIDDEN_PATTERNS) if (p.test(text)) hits.push(p.source);
  return hits;
}
