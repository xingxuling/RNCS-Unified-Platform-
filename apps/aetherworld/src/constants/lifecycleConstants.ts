// 十二长生相位
export interface LifecyclePhase {
  key: string;
  name: string;
  meaning: string;
  energy: "rising" | "peak" | "falling" | "void" | "seed";
}

export const LIFECYCLE: LifecyclePhase[] = [
  { key: "changsheng", name: "长生", meaning: "新结构启动", energy: "seed" },
  { key: "muyu",       name: "沐浴", meaning: "高变异 / 不稳定", energy: "rising" },
  { key: "guandai",    name: "冠带", meaning: "初成型 / 可展示", energy: "rising" },
  { key: "linguan",    name: "临官", meaning: "可操作 / 进入现实", energy: "rising" },
  { key: "diwang",     name: "帝旺", meaning: "高峰 / 强显化", energy: "peak" },
  { key: "shuai",      name: "衰",   meaning: "回落 / 降频", energy: "falling" },
  { key: "bing",       name: "病",   meaning: "过载 / 疲劳 / 风险", energy: "falling" },
  { key: "si",         name: "死",   meaning: "终止 / 旧结构死亡", energy: "void" },
  { key: "mu",         name: "墓",   meaning: "归档 / 封存 / 沉淀", energy: "void" },
  { key: "jue",        name: "绝",   meaning: "清空 / 断舍 / 空位", energy: "void" },
  { key: "tai",        name: "胎",   meaning: "新胚胎 / 新可能", energy: "seed" },
  { key: "yang",       name: "养",   meaning: "培育 / 内部生长", energy: "seed" },
];

export const getPhase = (offset: number): LifecyclePhase =>
  LIFECYCLE[((offset % 12) + 12) % 12];
