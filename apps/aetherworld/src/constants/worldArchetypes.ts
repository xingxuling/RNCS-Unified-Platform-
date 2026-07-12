// 世界原型 World Archetypes
export interface WorldArchetype {
  id: string;
  name: string;
  userFriendlyName: string;
  description: string;
  relatedNumbers: number[];
  relatedDomains: string[]; // tian/di/ren/shen/feng
  typicalEvents: string[];
  actionStyle: string;
  riskPattern: string;
  visualMood: string;
  narrativeTone: string;
}

export const WORLD_ARCHETYPES: WorldArchetype[] = [
  { id: "WIND_CONVERGENCE_WORLD", name: "风域收束世界", userFriendlyName: "变化频繁的风之世界",
    description: "变化、转向、传播、强触发主导。",
    relatedNumbers: [3, 5], relatedDomains: ["feng"],
    typicalEvents: ["TRIGGER_WINDOW", "CREATION_RELEASE", "MARKET_PIVOT"],
    actionStyle: "小步测试、快速调整、不一次性押大。",
    riskPattern: "容易把情绪噪声当成真实信号。",
    visualMood: "深蓝紫调，流动的星云。", narrativeTone: "敏锐、轻盈、变速感。" },
  { id: "ORDER_FORGE_WORLD", name: "秩序锻造世界", userFriendlyName: "结构稳定的秩序之世界",
    description: "规则、系统、结构、长期建设。",
    relatedNumbers: [4, 6], relatedDomains: ["di"],
    typicalEvents: ["LEGAL_PROCESS", "POLICY_WINDOW", "SUPPLY_STABILITY"],
    actionStyle: "走流程、建框架、把节奏拉长。",
    riskPattern: "过度刚性，错过窗口期。",
    visualMood: "青铜与石灰，秩序几何。", narrativeTone: "克制、稳健、结构化。" },
  { id: "RELATION_TIDE_WORLD", name: "关系潮汐世界", userFriendlyName: "人际为主的关系之世界",
    description: "人物、关系、合作、情感流动。",
    relatedNumbers: [2, 6], relatedDomains: ["ren"],
    typicalEvents: ["INTIMATE_OPENING", "PARTNERSHIP", "RELATIONSHIP_COOLING"],
    actionStyle: "先沟通、再确认、保留余地。",
    riskPattern: "误读他人，情绪化判断。",
    visualMood: "粉橙暖光，潮汐曲线。", narrativeTone: "温度感、互动性。" },
  { id: "RESOURCE_CITY_WORLD", name: "资源城邦世界", userFriendlyName: "资源驱动的城邦之世界",
    description: "金钱、资源、商业、平台承载。",
    relatedNumbers: [4, 8], relatedDomains: ["di"],
    typicalEvents: ["FINANCE_INFLOW", "RESOURCE_WINDOW", "MONEY_PRESSURE"],
    actionStyle: "先谈资源、再做承诺；现金流优先。",
    riskPattern: "过早承诺，成本未计。",
    visualMood: "金铜质感，城邦灯火。", narrativeTone: "实际、可量化。" },
  { id: "SIGNAL_FOREST_WORLD", name: "信号森林世界", userFriendlyName: "直觉敏锐的信号之世界",
    description: "直觉、潜意识、信号与噪声并存。",
    relatedNumbers: [5, 7], relatedDomains: ["feng", "shen"],
    typicalEvents: ["DEEP_RESEARCH", "FALSE_SIGNAL_EVENT", "INSIGHT_DROP"],
    actionStyle: "记录信号，等回验再行动。",
    riskPattern: "信号过载，噪声主导。",
    visualMood: "幽蓝森林，微光闪烁。", narrativeTone: "敏感、半透明感。" },
  { id: "CREATION_STARFIELD_WORLD", name: "创作星原世界", userFriendlyName: "创作驱动的星原之世界",
    description: "表达、作品、音乐、小说、世界观。",
    relatedNumbers: [3, 7], relatedDomains: ["shen", "feng"],
    typicalEvents: ["CREATION_RELEASE", "CONTENT_HIT", "CREATIVE_BLOCK"],
    actionStyle: "持续输出、阶段发布、收集反馈。",
    riskPattern: "完美主义、阻滞期延长。",
    visualMood: "深紫星原，光点延展。", narrativeTone: "抒情、有韵律。" },
  { id: "RECOVERY_SANCTUARY_WORLD", name: "恢复圣所世界", userFriendlyName: "恢复优先的圣所之世界",
    description: "身体恢复、睡眠、运动、能量重建。",
    relatedNumbers: [6, 0], relatedDomains: ["di", "ren"],
    typicalEvents: ["HEALTH_RECOVERY", "RESET_WINDOW", "BODY_OVERLOAD"],
    actionStyle: "降载、补能、不做重大决策。",
    riskPattern: "持续过载，能量透支。",
    visualMood: "青绿月光，安静庭院。", narrativeTone: "缓慢、修复感。" },
  { id: "FOUNDER_CITADEL_WORLD", name: "创始人城塞世界", userFriendlyName: "系统治理的创始人之世界",
    description: "产品、系统、权限、控制台、治理。",
    relatedNumbers: [1, 4, 8], relatedDomains: ["di", "shen"],
    typicalEvents: ["PRODUCT_RELEASE_WINDOW", "POLICY_WINDOW"],
    actionStyle: "先建权限、再做发布；版本化推进。",
    riskPattern: "权限失控、复杂度堆积。",
    visualMood: "暗金高塔，几何控制台。", narrativeTone: "克制、系统化。" },
  { id: "MYTHIC_MAINLINE_WORLD", name: "神话主线世界", userFriendlyName: "使命主导的神话之世界",
    description: "使命、象征、长期价值、文明叙事。",
    relatedNumbers: [7, 9], relatedDomains: ["shen"],
    typicalEvents: ["MAINLINE_LOCK", "LIFETIME_MILESTONE", "IDENTITY_SHIFT"],
    actionStyle: "对齐主线、回归长期。",
    riskPattern: "过度神话化，脱离现实。",
    visualMood: "深金圣域，远山轮廓。", narrativeTone: "庄重、长焦。" },
  { id: "CHAOS_NAVIGATION_WORLD", name: "乱流航行世界", userFriendlyName: "应对乱流的航行之世界",
    description: "不确定、风险、变局、噪声过滤。",
    relatedNumbers: [0, 5], relatedDomains: ["feng"],
    typicalEvents: ["CHAOS_RISK", "FALSE_SIGNAL_EVENT", "TRIGGER_WINDOW"],
    actionStyle: "守、断、降载、等待。",
    riskPattern: "把伪信号当真信号。",
    visualMood: "黑紫海面，风暴前夕。", narrativeTone: "警觉、收敛。" },
];

export const getArchetype = (id: string): WorldArchetype =>
  WORLD_ARCHETYPES.find(a => a.id === id) ?? WORLD_ARCHETYPES[0];
