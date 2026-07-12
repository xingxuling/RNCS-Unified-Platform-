// 创造物对象类型 · Creation Object Types
export interface CreationObjectType {
  id: string;
  name: string;
  userFriendlyName: string;
  description: string;
  domainWeights: Record<string, number>; // domainId -> weight
  defaultRisks: string[];
}

const DEFAULT_W: Record<string, number> = {
  DIGITAL_PHYSICS: 1, DIGITAL_CHEMISTRY: 1, DIGITAL_BIOLOGY: 1, DIGITAL_GEOGRAPHY: 1, DIGITAL_ASTRONOMY: 1,
  DIGITAL_ENGINEERING: 1, DIGITAL_INFORMATION: 1, DIGITAL_SOCIOLOGY: 1, DIGITAL_ECONOMICS: 1, DIGITAL_AESTHETICS: 1,
};

const w = (over: Record<string, number>): Record<string, number> => ({ ...DEFAULT_W, ...over });

export const CREATION_OBJECT_TYPES: CreationObjectType[] = [
  { id: "PRODUCT", name: "Product", userFriendlyName: "产品",
    description: "面向用户的产品。", domainWeights: w({ DIGITAL_SOCIOLOGY: 1.6, DIGITAL_ECONOMICS: 1.5, DIGITAL_INFORMATION: 1.3 }),
    defaultRisks: ["错配人群", "无商业回路"] },
  { id: "APP", name: "App", userFriendlyName: "应用",
    description: "数字应用。", domainWeights: w({ DIGITAL_INFORMATION: 1.6, DIGITAL_ENGINEERING: 1.5, DIGITAL_AESTHETICS: 1.3 }),
    defaultRisks: ["架构脆弱", "信息架构混乱"] },
  { id: "FEATURE", name: "Feature", userFriendlyName: "功能",
    description: "产品中的功能模块。", domainWeights: w({ DIGITAL_INFORMATION: 1.5, DIGITAL_PHYSICS: 1.3 }),
    defaultRisks: ["增加摩擦"] },
  { id: "DESIGN_OBJECT", name: "Design Object", userFriendlyName: "设计物",
    description: "视觉/形态设计。", domainWeights: w({ DIGITAL_AESTHETICS: 1.8, DIGITAL_ENGINEERING: 1.3 }),
    defaultRisks: ["难制造", "无记忆点"] },
  { id: "PHYSICAL_OBJECT", name: "Physical Object", userFriendlyName: "物理物件",
    description: "物理产品。", domainWeights: w({ DIGITAL_PHYSICS: 1.7, DIGITAL_ENGINEERING: 1.8, DIGITAL_CHEMISTRY: 1.4 }),
    defaultRisks: ["重量/材料/成本"] },
  { id: "MR_DEVICE", name: "MR Device", userFriendlyName: "MR 设备",
    description: "混合现实硬件。", domainWeights: w({ DIGITAL_PHYSICS: 1.7, DIGITAL_ENGINEERING: 1.8, DIGITAL_BIOLOGY: 1.6, DIGITAL_ECONOMICS: 1.5, DIGITAL_AESTHETICS: 1.3 }),
    defaultRisks: ["散热/重量/眩晕/成本"] },
  { id: "ROBOT", name: "Robot", userFriendlyName: "机器人",
    description: "机器人。", domainWeights: w({ DIGITAL_ENGINEERING: 1.8, DIGITAL_PHYSICS: 1.6, DIGITAL_INFORMATION: 1.5 }),
    defaultRisks: ["失败模式复杂"] },
  { id: "AI_AGENT", name: "AI Agent", userFriendlyName: "AI Agent",
    description: "智能体。", domainWeights: w({ DIGITAL_INFORMATION: 1.8, DIGITAL_SOCIOLOGY: 1.4, DIGITAL_AESTHETICS: 1.2 }),
    defaultRisks: ["误读/边界缺失"] },
  { id: "VIRTUAL_WORLD", name: "Virtual World", userFriendlyName: "虚拟世界",
    description: "可探索虚拟世界。", domainWeights: w({ DIGITAL_INFORMATION: 1.7, DIGITAL_AESTHETICS: 1.6, DIGITAL_SOCIOLOGY: 1.4 }),
    defaultRisks: ["全潜行不可行"] },
  { id: "GAME_SYSTEM", name: "Game System", userFriendlyName: "游戏系统",
    description: "游戏机制。", domainWeights: w({ DIGITAL_INFORMATION: 1.5, DIGITAL_SOCIOLOGY: 1.4, DIGITAL_AESTHETICS: 1.4 }),
    defaultRisks: ["平衡失调"] },
  { id: "CHARACTER", name: "Character", userFriendlyName: "角色",
    description: "虚拟角色。", domainWeights: w({ DIGITAL_AESTHETICS: 1.7, DIGITAL_SOCIOLOGY: 1.3 }),
    defaultRisks: ["人设崩"] },
  { id: "DEITY", name: "Deity", userFriendlyName: "神明对象",
    description: "象征神明。", domainWeights: w({ DIGITAL_AESTHETICS: 1.8, DIGITAL_SOCIOLOGY: 1.5 }),
    defaultRisks: ["过度神化"] },
  { id: "CITY", name: "City / Field", userFriendlyName: "城市/场域",
    description: "虚拟或真实场域。", domainWeights: w({ DIGITAL_GEOGRAPHY: 1.8, DIGITAL_SOCIOLOGY: 1.5 }),
    defaultRisks: ["场域错配"] },
  { id: "ORGANIZATION", name: "Organization", userFriendlyName: "组织",
    description: "组织机构。", domainWeights: w({ DIGITAL_SOCIOLOGY: 1.7, DIGITAL_ECONOMICS: 1.4 }),
    defaultRisks: ["权责不清"] },
  { id: "CIVILIZATION_MODEL", name: "Civilization Model", userFriendlyName: "文明模型",
    description: "文明结构。", domainWeights: w({ DIGITAL_SOCIOLOGY: 1.8, DIGITAL_AESTHETICS: 1.4, DIGITAL_INFORMATION: 1.3 }),
    defaultRisks: ["过度抽象"] },
  { id: "SYMBOL_SYSTEM", name: "Symbol System", userFriendlyName: "符号系统",
    description: "符号/标识体系。", domainWeights: w({ DIGITAL_AESTHETICS: 1.8, DIGITAL_INFORMATION: 1.3 }),
    defaultRisks: ["难记/难传"] },
  { id: "LANGUAGE_SYSTEM", name: "Language System", userFriendlyName: "语言系统",
    description: "术语/语言体系。", domainWeights: w({ DIGITAL_INFORMATION: 1.6, DIGITAL_SOCIOLOGY: 1.4 }),
    defaultRisks: ["术语过载"] },
  { id: "METHOD_SYSTEM", name: "Method System", userFriendlyName: "方法论",
    description: "方法/计算法。", domainWeights: w({ DIGITAL_INFORMATION: 1.6, DIGITAL_SOCIOLOGY: 1.3 }),
    defaultRisks: ["难落地"] },
  { id: "CONTENT_SERIES", name: "Content Series", userFriendlyName: "内容系列",
    description: "内容/IP。", domainWeights: w({ DIGITAL_CHEMISTRY: 1.5, DIGITAL_AESTHETICS: 1.4, DIGITAL_SOCIOLOGY: 1.4 }),
    defaultRisks: ["传播失活"] },
  { id: "BUSINESS_MODEL", name: "Business Model", userFriendlyName: "商业模式",
    description: "商业模式。", domainWeights: w({ DIGITAL_ECONOMICS: 1.8, DIGITAL_SOCIOLOGY: 1.4 }),
    defaultRisks: ["无回路/无壁垒"] },
];

export function getObjectType(id: string) {
  return CREATION_OBJECT_TYPES.find(t => t.id === id);
}
