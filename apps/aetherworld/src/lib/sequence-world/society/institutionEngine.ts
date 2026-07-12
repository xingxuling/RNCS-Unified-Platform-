// Institution Engine
import { INSTITUTION_TYPES, INSTITUTION_LABELS, type InstitutionType } from "@/constants/sequence-world/society/institutionTypes";

export interface WorldInstitution {
  institutionId: string;
  name: string;
  institutionType: InstitutionType;
  purpose: string;
  rules: string[];
  members: string[];
  authorityLevel: number;
  legitimacy: number;
  corruptionRisk: number;
  relatedFactionIds: string[];
}

const PURPOSE: Record<InstitutionType, string> = {
  COUNCIL: "协调阵营与公共议题",
  GUILD: "组织技艺与专业人员",
  TEMPLE: "维护信仰与仪式",
  ACADEMY: "传承与传播知识",
  MARKET: "调度贸易与价格",
  COURT: "裁决冲突与违规",
  ARCHIVE: "归档与保存关键记忆",
  WORKSHOP: "进行物资与器物生产",
  SANCTUARY: "为脆弱者提供庇护",
  TERMINAL_NODE: "连接终端与外部接口",
};

export function generateInstitutions(input: {
  worldId: string;
  sourceDigits?: string[];
  factions: { factionId: string; name: string }[];
  maxInstitutions: number;
}): WorldInstitution[] {
  const digits = input.sourceDigits ?? [];
  const prefer: InstitutionType[] = [];
  if (digits.includes("4")) prefer.push("COUNCIL","COURT");
  if (digits.includes("8")) prefer.push("MARKET","WORKSHOP");
  if (digits.includes("9")) prefer.push("TEMPLE");
  if (digits.includes("3")) prefer.push("ACADEMY");
  if (digits.includes("0")) prefer.push("ARCHIVE");
  if (digits.includes("6")) prefer.push("SANCTUARY");
  if (digits.includes("5")) prefer.push("GUILD");
  const list: InstitutionType[] = [];
  for (const t of [...prefer, ...INSTITUTION_TYPES]) {
    if (list.length >= input.maxInstitutions) break;
    if (!list.includes(t)) list.push(t);
  }
  return list.map((t, i) => ({
    institutionId: `${input.worldId}-inst-${i}`,
    name: INSTITUTION_LABELS[t],
    institutionType: t,
    purpose: PURPOSE[t],
    rules: [`核心规则：${PURPOSE[t]}`],
    members: [],
    authorityLevel: 0.5,
    legitimacy: 0.7,
    corruptionRisk: 0.15,
    relatedFactionIds: input.factions[i % Math.max(1, input.factions.length)]
      ? [input.factions[i % input.factions.length].factionId] : [],
  }));
}
