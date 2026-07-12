// 虚拟世界角色职业 Character Classes
export interface CharacterClass {
  id: string;
  name: string;
  enName: string;
  description: string;
  primaryDomain: "tian" | "di" | "ren" | "shen" | "feng";
  primaryNumbers: number[];
  strength: string;
  weakness: string;
  startingZone: string;
  growthPath: string;
}

export const CHARACTER_CLASSES: CharacterClass[] = [
  { id: "WIND_ARCHITECT", name: "风之架构师", enName: "Wind Architect",
    primaryDomain: "feng", primaryNumbers: [3, 5],
    description: "高风域、高变化、擅长系统生成。",
    strength: "把混乱变化设计成规则。", weakness: "容易在变化中过度切换。",
    startingZone: "PRODUCT_STARTUP", growthPath: "从单一系统到多系统协同。" },
  { id: "SIGNAL_READER", name: "信号读取者", enName: "Signal Reader",
    primaryDomain: "shen", primaryNumbers: [7],
    description: "高7、擅长信号净化与模式识别。",
    strength: "识别隐藏模式与伪信号。", weakness: "容易陷入过度解读。",
    startingZone: "COGNITION_PLASTICITY", growthPath: "从信号识别到信号生成。" },
  { id: "WORLD_FORGER", name: "世界锻造者", enName: "World Forger",
    primaryDomain: "di", primaryNumbers: [3, 4, 5],
    description: "擅长把想法锻造成产品、城市、系统。",
    strength: "把抽象想法变成可运行的产物。", weakness: "可能忽视情感与关系。",
    startingZone: "PRODUCT_STARTUP", growthPath: "从产品到生态。" },
  { id: "TIME_NAVIGATOR", name: "时间航行者", enName: "Time Navigator",
    primaryDomain: "tian", primaryNumbers: [1, 9],
    description: "擅长判断时机、周期、窗口。",
    strength: "在对的时间做对的事。", weakness: "可能等待过久。",
    startingZone: "CAREER", growthPath: "从读懂周期到驾驭周期。" },
  { id: "FIELD_BUILDER", name: "场域建造者", enName: "Field Builder",
    primaryDomain: "di", primaryNumbers: [4, 8],
    description: "擅长建资源、平台、基地、领地。",
    strength: "建立稳定的资源基础。", weakness: "可能过度防守。",
    startingZone: "FINANCE_RESOURCE", growthPath: "从单点资源到平台资源。" },
  { id: "RELATION_WEAVER", name: "关系编织者", enName: "Relation Weaver",
    primaryDomain: "ren", primaryNumbers: [2, 6],
    description: "擅长连接 NPC、阵营、伙伴。",
    strength: "把人际网络连接成可用资源。", weakness: "可能模糊边界。",
    startingZone: "SOCIAL_NETWORK", growthPath: "从弱连接到深度信任。" },
  { id: "MAINLINE_KEEPER", name: "主线守护者", enName: "Mainline Keeper",
    primaryDomain: "shen", primaryNumbers: [9],
    description: "擅长长期使命、象征、价值路线。",
    strength: "守住主线不被干扰。", weakness: "可能僵化于使命。",
    startingZone: "IDENTITY_MAINLINE", growthPath: "从坚守主线到迭代主线。" },
  { id: "RECOVERY_MONK", name: "恢复修行者", enName: "Recovery Monk",
    primaryDomain: "di", primaryNumbers: [6],
    description: "擅长身体恢复、稳定、修复自身系统。",
    strength: "恢复速度快，稳定性强。", weakness: "可能过于保守。",
    startingZone: "HEALTH_RECOVERY", growthPath: "从恢复自身到恢复系统。" },
  { id: "CHAOS_PILOT", name: "乱流驾驶者", enName: "Chaos Pilot",
    primaryDomain: "feng", primaryNumbers: [5],
    description: "高5且风险高，擅长不确定环境。",
    strength: "在混乱中找到出口。", weakness: "可能上瘾于混乱。",
    startingZone: "RISK_CHAOS_NOISE", growthPath: "从穿越乱流到设计乱流。" },
  { id: "FOUNDER_OPERATOR", name: "创始人操作员", enName: "Founder Operator",
    primaryDomain: "shen", primaryNumbers: [1, 9],
    description: "Founder Mode 或高产品系统倾向。",
    strength: "控制系统、规则、版本与治理。", weakness: "可能过度集中权力。",
    startingZone: "TOOL_AI_PROMPT", growthPath: "从单系统到多系统治理。" },
];

export function pickCharacterClass(dominantNumber: number, dominantDomain: string): CharacterClass {
  const byDomain = CHARACTER_CLASSES.filter(c => c.primaryDomain === dominantDomain);
  const byNumber = byDomain.find(c => c.primaryNumbers.includes(dominantNumber));
  return byNumber ?? byDomain[0] ?? CHARACTER_CLASSES[0];
}
