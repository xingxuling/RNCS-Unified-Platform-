// NPC 原型 NPC Archetypes
export type RelationshipState = "UNKNOWN" | "APPROACHING" | "ACTIVE" | "DISTANT" | "CONFLICT" | "LOCKED";

export interface NPCArchetype {
  id: string;
  name: string;
  enName: string;
  description: string;
  defaultTrust: number; // 0-100
  defaultRisk: number;  // 0-100
  relatedDimension: string;
}

export const NPC_ARCHETYPES: NPCArchetype[] = [
  { id: "MENTOR", name: "导师", enName: "Mentor", description: "提供方向与方法。", defaultTrust: 70, defaultRisk: 10, relatedDimension: "COGNITION_PLASTICITY" },
  { id: "ALLY", name: "伙伴", enName: "Ally", description: "并肩同行的合作者。", defaultTrust: 65, defaultRisk: 20, relatedDimension: "SOCIAL_NETWORK" },
  { id: "RIVAL", name: "对手", enName: "Rival", description: "促进成长的竞争方。", defaultTrust: 30, defaultRisk: 55, relatedDimension: "CAREER" },
  { id: "LOVER", name: "恋爱对象", enName: "Lover", description: "亲密关系候选。", defaultTrust: 55, defaultRisk: 50, relatedDimension: "RELATIONSHIP" },
  { id: "GATEKEEPER", name: "守门人", enName: "Gatekeeper", description: "审核、批准、放行。", defaultTrust: 40, defaultRisk: 45, relatedDimension: "LEGAL_ADMIN_SYSTEM" },
  { id: "TRADER", name: "交易者", enName: "Trader", description: "资源、机会的交换者。", defaultTrust: 45, defaultRisk: 50, relatedDimension: "FINANCE_RESOURCE" },
  { id: "MESSENGER", name: "信使", enName: "Messenger", description: "传递信息的关键人。", defaultTrust: 50, defaultRisk: 35, relatedDimension: "TOOL_AI_PROMPT" },
  { id: "OBSERVER", name: "观察者", enName: "Observer", description: "评估你的隐形目光。", defaultTrust: 50, defaultRisk: 30, relatedDimension: "IDENTITY_MAINLINE" },
  { id: "BETRAYER", name: "背叛者", enName: "Betrayer", description: "可能反转关系的人。", defaultTrust: 25, defaultRisk: 80, relatedDimension: "RISK_CHAOS_NOISE" },
  { id: "PATRON", name: "贵人", enName: "Patron", description: "提供资源与背书的资助者。", defaultTrust: 75, defaultRisk: 15, relatedDimension: "FINANCE_RESOURCE" },
  { id: "MIRROR", name: "镜像角色", enName: "Mirror", description: "映照自己的角色。", defaultTrust: 60, defaultRisk: 30, relatedDimension: "COGNITION_PLASTICITY" },
  { id: "LOST_CONTACT", name: "失联关键人物", enName: "Lost Contact", description: "曾经重要、现在失联。", defaultTrust: 50, defaultRisk: 40, relatedDimension: "SOCIAL_NETWORK" },
  { id: "SYSTEM_AGENT", name: "系统代理人", enName: "System Agent", description: "代表平台与制度的角色。", defaultTrust: 40, defaultRisk: 40, relatedDimension: "LEGAL_ADMIN_SYSTEM" },
  { id: "FOUNDER_ECHO", name: "创始人回声", enName: "Founder Echo", description: "你内在的创始人化身。", defaultTrust: 80, defaultRisk: 25, relatedDimension: "IDENTITY_MAINLINE" },
  { id: "MYTHIC_GUIDE", name: "神话引导者", enName: "Mythic Guide", description: "象征性引导力量。", defaultTrust: 65, defaultRisk: 20, relatedDimension: "SPIRIT_SYMBOLIC_VALUE" },
];
