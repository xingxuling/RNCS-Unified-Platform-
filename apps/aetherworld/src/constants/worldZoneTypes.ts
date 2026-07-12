// 世界区域类型 — 由 15 大预测维度衍生
export type WorldZoneState = "OPEN" | "FORMING" | "LOCKED" | "OVERLOADED" | "HIDDEN";

export interface WorldZoneTemplate {
  dimensionId: string;     // 对应 PredictionDimension.id
  zoneName: string;        // 区域名称（中）
  zoneNameEn: string;
  baseDescription: string;
  recommendedActions: string[];
}

export const WORLD_ZONE_TEMPLATES: WorldZoneTemplate[] = [
  { dimensionId: "CAREER", zoneName: "事业塔 / 职业高地", zoneNameEn: "Career Tower",
    baseDescription: "工作推进、外部认可与项目落地的高地。",
    recommendedActions: ["确认下一步", "推进关键人物对话"] },
  { dimensionId: "PRODUCT", zoneName: "产品工坊 / 创业港", zoneNameEn: "Product Workshop",
    baseDescription: "产品迭代、发布窗口、用户反馈的工坊。",
    recommendedActions: ["小步发布", "回验后再放量"] },
  { dimensionId: "RELATIONSHIP", zoneName: "关系湖 / 亲密庭院", zoneNameEn: "Relation Lake",
    baseDescription: "暧昧、亲密、合作关系的升降温场。",
    recommendedActions: ["先沟通", "保留余地"] },
  { dimensionId: "SOCIAL_NETWORK", zoneName: "人脉广场 / 弱连接市场", zoneNameEn: "Social Plaza",
    baseDescription: "贵人、合作方与弱连接出现的开放广场。",
    recommendedActions: ["主动连接一两人"] },
  { dimensionId: "FINANCE", zoneName: "资源矿脉 / 金库", zoneNameEn: "Resource Vault",
    baseDescription: "资金、订单与现金流的资源场。",
    recommendedActions: ["盘点现金流", "再谈条款"] },
  { dimensionId: "STUDY_APPLICATION", zoneName: "学院门 / 申请塔", zoneNameEn: "Application Gate",
    baseDescription: "学校、申请、面试与录取窗口。",
    recommendedActions: ["补齐材料", "保持联系"] },
  { dimensionId: "HEALTH_RECOVERY", zoneName: "恢复圣所 / 睡眠泉", zoneNameEn: "Recovery Sanctuary",
    baseDescription: "睡眠、运动、能量重建的修复场。",
    recommendedActions: ["降载", "补能"] },
  { dimensionId: "COGNITION", zoneName: "思维穹顶 / 潜意识图书馆", zoneNameEn: "Cognition Dome",
    baseDescription: "认知算力与潜意识调用的高地。",
    recommendedActions: ["外化想法", "做记录"] },
  { dimensionId: "CREATION", zoneName: "创作星原 / 世界观剧场", zoneNameEn: "Creation Starfield",
    baseDescription: "音乐、小说、内容、世界观的创作场。",
    recommendedActions: ["持续输出", "阶段发布"] },
  { dimensionId: "IDENTITY", zoneName: "身份王座 / 主线神殿", zoneNameEn: "Identity Throne",
    baseDescription: "自我定位与公开身份的转折场。",
    recommendedActions: ["确认自我表述"] },
  { dimensionId: "LOCATION", zoneName: "城市边界 / 迁移之门", zoneNameEn: "Migration Gate",
    baseDescription: "城市、地区与场域迁移的边界。",
    recommendedActions: ["勘察一个新场域"] },
  { dimensionId: "LEGAL_ADMIN", zoneName: "制度关口 / 合同门", zoneNameEn: "Admin Gate",
    baseDescription: "合同、申请、手续与审核的关口。",
    recommendedActions: ["走流程", "补材料"] },
  { dimensionId: "PROMPT_TOOLING", zoneName: "提示词工坊 / AI 机房", zoneNameEn: "Prompt Workshop",
    baseDescription: "AI 工具、提示词与自动化推进的机房。",
    recommendedActions: ["生成提示词", "迭代一次"] },
  { dimensionId: "RISK_CHAOS", zoneName: "乱流海 / 噪声雾区", zoneNameEn: "Chaos Sea",
    baseDescription: "突发、伪信号、过载与延迟的乱流区。",
    recommendedActions: ["守", "断", "不出手"] },
  { dimensionId: "SPIRIT_MAINLINE", zoneName: "象征圣域 / 文明档案馆", zoneNameEn: "Mythic Archive",
    baseDescription: "使命、象征与长期价值的圣域。",
    recommendedActions: ["对齐主线", "回归长期"] },
];
