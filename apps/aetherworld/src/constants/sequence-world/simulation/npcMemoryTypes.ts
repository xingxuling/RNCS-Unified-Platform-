export const NPC_MEMORY_TYPES = [
  { id: "HELP",      label: "帮助",     baseEmotion:  0.6 },
  { id: "CONFLICT",  label: "冲突",     baseEmotion: -0.7 },
  { id: "TRADE",     label: "交易",     baseEmotion:  0.2 },
  { id: "SECRET",    label: "秘密",     baseEmotion:  0.1 },
  { id: "QUEST",     label: "任务",     baseEmotion:  0.3 },
  { id: "DIALOGUE",  label: "对话",     baseEmotion:  0.1 },
  { id: "BETRAYAL",  label: "背叛",     baseEmotion: -0.9 },
  { id: "PROMISE",   label: "承诺",     baseEmotion:  0.4 },
] as const;

export type NpcMemoryTypeId = typeof NPC_MEMORY_TYPES[number]["id"];

export const DEFAULT_DECAY_RATE = 0.05;
