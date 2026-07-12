export const WORLD_TRANSFER_TYPES = [
  { id: "RESOURCE_TRANSFER", label: "资源转移" },
  { id: "NPC_TRANSFER", label: "NPC 转移" },
  { id: "QUEST_TRANSFER", label: "任务转移" },
  { id: "CANON_REFERENCE", label: "正典引用" },
  { id: "LORE_IMPORT", label: "设定导入" },
  { id: "PRESENTATION_PACK_TRANSFER", label: "表现包转移" },
  { id: "TECHNOLOGY_TRANSFER", label: "技术转移" },
  { id: "BELIEF_TRANSFER", label: "信仰转移" },
  { id: "CURRENCY_VALUE_REFERENCE", label: "内部价值引用" },
] as const;
export type WorldTransferTypeId = (typeof WORLD_TRANSFER_TYPES)[number]["id"];
