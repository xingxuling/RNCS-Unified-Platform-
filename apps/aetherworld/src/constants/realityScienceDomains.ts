// Reality Science Domains · 现实科学宇宙常数域
export interface RealityScienceDomain {
  id: string;
  name: string;
  userFriendlyName: string;
  description: string;
  keyConstants: string[];
  relatedFiveDomain: string[];
  affectsCreationTypes: string[];
  riskIfIgnored: string[];
  phase: "A" | "B" | "C";
}

export const REALITY_SCIENCE_DOMAINS: RealityScienceDomain[] = [
  { id: "DIGITAL_PHYSICS", name: "Digital Physics", userFriendlyName: "数字物理学",
    description: "力、阻力、惯性、阈值、动量、相变、熵、反馈延迟。",
    keyConstants: ["INERTIA","RESISTANCE","MOMENTUM","THRESHOLD","ENTROPY","PRESSURE","FRICTION","LOAD","PHASE_TRANSITION","FEEDBACK_DELAY"],
    relatedFiveDomain: ["tian","feng"], affectsCreationTypes: ["PRODUCT","APP","FEATURE","PHYSICAL_OBJECT","MR_DEVICE","ROBOT"],
    riskIfIgnored: ["上线即崩","推不动","用户用不起来"], phase: "C" },
  { id: "DIGITAL_CHEMISTRY", name: "Digital Chemistry", userFriendlyName: "数字化学",
    description: "反应性、催化、抑制、混合、浓度、稳定性、毒性、链式反应。",
    keyConstants: ["REACTIVITY","CATALYST","INHIBITOR","CONCENTRATION","MIXING_RATIO","STABILITY","VOLATILITY","TOXICITY","PRECIPITATION","CHAIN_REACTION"],
    relatedFiveDomain: ["feng","ren"], affectsCreationTypes: ["CONTENT_SERIES","BUSINESS_MODEL","METHOD_SYSTEM"],
    riskIfIgnored: ["元素冲突","传播链断","术语中毒"], phase: "C" },
  { id: "DIGITAL_BIOLOGY", name: "Digital Biology", userFriendlyName: "数字生物学",
    description: "能量、神经、睡眠、恢复、感官、适应、进化。",
    keyConstants: ["ENERGY_SUPPLY","RECOVERY_RATE","ADAPTATION","STRESS_RESPONSE","HOMEOSTASIS","GROWTH_RATE","MUTATION_RATE","SELECTION_PRESSURE","IMMUNE_RESPONSE","SYMBIOSIS"],
    relatedFiveDomain: ["ren","di"], affectsCreationTypes: ["APP","PRODUCT","AI_AGENT","ORGANIZATION"],
    riskIfIgnored: ["功能膨胀","系统僵化","用户耗竭"], phase: "C" },
  { id: "DIGITAL_GEOGRAPHY", name: "Digital Geography", userFriendlyName: "数字地理学",
    description: "位置、场域、密度、交通、资源、城市气质、平台环境。",
    keyConstants: ["LOCATION_FIT","FIELD_DENSITY","ACCESSIBILITY","FLOW","BOUNDARY","RESOURCE_DISTRIBUTION","TERRAIN_RESISTANCE","CITY_TEMPERAMENT","PLATFORM_FIELD","MIGRATION_WINDOW"],
    relatedFiveDomain: ["di"], affectsCreationTypes: ["PRODUCT","CONTENT_SERIES","BUSINESS_MODEL","CITY","ORGANIZATION"],
    riskIfIgnored: ["放错平台","场域错配","触达不到"], phase: "C" },
  { id: "DIGITAL_ASTRONOMY", name: "Digital Astronomy", userFriendlyName: "数字天文学",
    description: "周期、昼夜、月相、季节、长期时间尺度、宏观节律。",
    keyConstants: ["DAY_NIGHT_CYCLE","WEEKLY_RHYTHM","MONTHLY_CYCLE","SEASONAL_CYCLE","SOLAR_EXPOSURE","LUNAR_SYMBOLIC_PHASE","MACRO_TIMING_WINDOW","ORBITAL_REPEAT","ECLIPSE_EVENT","ALIGNMENT_WINDOW"],
    relatedFiveDomain: ["tian"], affectsCreationTypes: ["PRODUCT","CONTENT_SERIES","BUSINESS_MODEL"],
    riskIfIgnored: ["错过窗口","逆周期发力"], phase: "C" },
  { id: "DIGITAL_ENGINEERING", name: "Digital Engineering", userFriendlyName: "数字工程学",
    description: "结构、材料、成本、制造、维护、模块化、可靠性。",
    keyConstants: ["STRUCTURAL_INTEGRITY","MODULARITY","MANUFACTURABILITY","MAINTAINABILITY","RELIABILITY","COST_OF_BUILD","FAILURE_MODE","REDUNDANCY","INTERFACE_CLARITY","SCALABILITY"],
    relatedFiveDomain: ["di","shen"], affectsCreationTypes: ["PRODUCT","APP","MR_DEVICE","ROBOT","PHYSICAL_OBJECT","DESIGN_OBJECT","VIRTUAL_WORLD"],
    riskIfIgnored: ["造不出","维护爆炸","扩展失败"], phase: "C" },
  { id: "DIGITAL_INFORMATION", name: "Digital Information", userFriendlyName: "数字信息学",
    description: "数据结构、信号、噪声、压缩、编码、接口、反馈。",
    keyConstants: ["SIGNAL_QUALITY","NOISE_LEVEL","COMPRESSION_RATE","ENCODING_CLARITY","INDEXABILITY","FEEDBACK_RESOLUTION","DATA_LOCALITY","MEMORY_PERSISTENCE","INTEROPERABILITY","ERROR_CORRECTION"],
    relatedFiveDomain: ["shen","feng"], affectsCreationTypes: ["APP","AI_AGENT","VIRTUAL_WORLD","SYMBOL_SYSTEM","LANGUAGE_SYSTEM","METHOD_SYSTEM"],
    riskIfIgnored: ["数据混乱","接口不通","反馈失真"], phase: "C" },
  { id: "DIGITAL_SOCIOLOGY", name: "Digital Sociology", userFriendlyName: "数字社会学",
    description: "用户、人群、制度、信任、传播、文化、组织接受度。",
    keyConstants: ["TRUST","ADOPTION_THRESHOLD","SOCIAL_PROOF","CULTURAL_FIT","NETWORK_EFFECT","AUTHORITY_SIGNAL","COMMUNITY_SPREAD","MISREAD_RISK","ROLE_EXPECTATION","CO_CREATION"],
    relatedFiveDomain: ["ren"], affectsCreationTypes: ["PRODUCT","CONTENT_SERIES","ORGANIZATION","BUSINESS_MODEL","CIVILIZATION_MODEL","DEITY"],
    riskIfIgnored: ["无人采用","误读为玄学","社群冷启失败"], phase: "C" },
  { id: "DIGITAL_ECONOMICS", name: "Digital Economics", userFriendlyName: "数字经济学",
    description: "成本、价格、资源、市场、商业闭环、收益、资本效率。",
    keyConstants: ["VALUE_DENSITY","WILLINGNESS_TO_PAY","COST_PRESSURE","RESOURCE_LEVERAGE","MARKET_SIZE","NICHE_DEPTH","MONETIZATION_PATH","UNIT_ECONOMICS","CAPITAL_ATTRACTION","LONG_TAIL_VALUE"],
    relatedFiveDomain: ["di","ren"], affectsCreationTypes: ["PRODUCT","BUSINESS_MODEL","ORGANIZATION","APP"],
    riskIfIgnored: ["烧光","定价错","无回路"], phase: "C" },
  { id: "DIGITAL_AESTHETICS", name: "Digital Aesthetics", userFriendlyName: "数字审美学",
    description: "形态、风格、视觉一致性、情绪氛围、记忆点、符号吸引力。",
    keyConstants: ["FORM_COHERENCE","SYMBOL_MEMORY","EMOTIONAL_TONE","VISUAL_DENSITY","MYTHIC_AURA","PROFESSIONAL_POLISH","ACCESSIBILITY_OF_BEAUTY","ICONICITY","AESTHETIC_RISK","STYLE_TRANSFERABILITY"],
    relatedFiveDomain: ["feng","shen"], affectsCreationTypes: ["DESIGN_OBJECT","CONTENT_SERIES","CHARACTER","DEITY","VIRTUAL_WORLD","SYMBOL_SYSTEM"],
    riskIfIgnored: ["视觉无记忆点","风格不一致","审美过载"], phase: "C" },
];

export function getDomain(id: string) {
  return REALITY_SCIENCE_DOMAINS.find(d => d.id === id);
}
