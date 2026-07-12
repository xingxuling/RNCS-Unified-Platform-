export const CHARACTER_ARC_TYPES = [
  { id: "ORDINARY_TO_MYTHIC",  name: "普通到神话" },
  { id: "MYTHIC_TO_HUMAN",     name: "神话回到人" },
  { id: "LOST_TO_SELF",        name: "迷失到自我确认" },
  { id: "COLD_TO_CONNECTED",   name: "冷感到连接" },
  { id: "BURDENED_TO_SHARED",  name: "独自承担到被承住" },
  { id: "RULER_TO_WANDERER",   name: "统御者到游离者" },
  { id: "EXILE_TO_FOUNDER",    name: "流亡者到开创者" },
  { id: "OBSERVER_TO_ACTOR",   name: "旁观者到行动者" },
] as const;
export type CharacterArcTypeId = typeof CHARACTER_ARC_TYPES[number]["id"];
