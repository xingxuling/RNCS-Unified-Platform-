export const SCENE_TYPES = [
  "INTRODUCTION","CONFRONTATION","QUIET_MOMENT","REVELATION","DECISION",
  "BETRAYAL","REUNION","TRAINING","INVESTIGATION","BATTLE",
  "AFTERMATH","DREAM","VIRTUAL_LIFE","SYSTEM_CONSOLE","FINAL_CHOICE",
] as const;
export type SceneType = typeof SCENE_TYPES[number];

export const SCENE_TYPE_LABELS: Record<SceneType, string> = {
  INTRODUCTION: "引入",
  CONFRONTATION: "对峙",
  QUIET_MOMENT: "静默时刻",
  REVELATION: "揭示",
  DECISION: "抉择",
  BETRAYAL: "背叛",
  REUNION: "重逢",
  TRAINING: "锤炼",
  INVESTIGATION: "调查",
  BATTLE: "战斗",
  AFTERMATH: "余波",
  DREAM: "梦境",
  VIRTUAL_LIFE: "虚拟生活",
  SYSTEM_CONSOLE: "系统控制台",
  FINAL_CHOICE: "终极抉择",
};
