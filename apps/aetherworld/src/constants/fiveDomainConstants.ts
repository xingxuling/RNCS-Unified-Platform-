// 常数宇宙 v1.0 · 五域常数
export type DomainId = "HEAVEN" | "EARTH" | "HUMAN" | "SPIRIT" | "WIND";

export interface FiveDomainConstant {
  id: DomainId;
  position: number; // 五位数中的位置 1-5
  name: string;
  userFriendlyName: string;
  meaning: string;
  coreQuestion: string;
  keywords: string[];
  defaultWeight: number;
}

export const FIVE_DOMAIN_CONSTANTS: FiveDomainConstant[] = [
  {
    id: "HEAVEN",
    position: 1,
    name: "天 · Heaven",
    userFriendlyName: "什么时候",
    meaning: "时间、周期、窗口、趋势、节奏。",
    coreQuestion: "现在是不是时机？",
    keywords: ["窗口", "周期", "节奏", "趋势"],
    defaultWeight: 1.0,
  },
  {
    id: "EARTH",
    position: 2,
    name: "地 · Earth",
    userFriendlyName: "环境支不支持",
    meaning: "场域、资源、平台、制度、承载。",
    coreQuestion: "这个地方／平台／条件能不能承载？",
    keywords: ["场域", "资源", "平台", "制度"],
    defaultWeight: 1.0,
  },
  {
    id: "HUMAN",
    position: 3,
    name: "人 · Human",
    userFriendlyName: "和谁有关",
    meaning: "人物、用户、关系、合作、反馈。",
    coreQuestion: "人有没有到位？",
    keywords: ["人物", "关系", "合作", "用户"],
    defaultWeight: 1.0,
  },
  {
    id: "SPIRIT",
    position: 4,
    name: "神 · Spirit",
    userFriendlyName: "这件事值不值得",
    meaning: "主线、意义、方向、合法性、叙事。",
    coreQuestion: "它是否符合长期方向？",
    keywords: ["主线", "意义", "方向", "叙事"],
    defaultWeight: 1.0,
  },
  {
    id: "WIND",
    position: 5,
    name: "风 · Wind",
    userFriendlyName: "事情怎么变",
    meaning: "变化、传播、触发、转向、显化。",
    coreQuestion: "变化会怎么发生？",
    keywords: ["变化", "传播", "触发", "显化"],
    defaultWeight: 1.0,
  },
];

export const getDomain = (id: DomainId) =>
  FIVE_DOMAIN_CONSTANTS.find((d) => d.id === id)!;
