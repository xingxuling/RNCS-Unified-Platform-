export const INSTITUTION_TYPES = [
  "COUNCIL","GUILD","TEMPLE","ACADEMY","MARKET",
  "COURT","ARCHIVE","WORKSHOP","SANCTUARY","TERMINAL_NODE",
] as const;
export type InstitutionType = typeof INSTITUTION_TYPES[number];

export const INSTITUTION_LABELS: Record<InstitutionType, string> = {
  COUNCIL: "议会", GUILD: "公会", TEMPLE: "神殿", ACADEMY: "学院",
  MARKET: "市场", COURT: "审判庭", ARCHIVE: "档案馆", WORKSHOP: "工坊",
  SANCTUARY: "避难所", TERMINAL_NODE: "终端节点",
};
