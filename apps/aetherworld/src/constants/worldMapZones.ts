// 虚拟世界地图区域 World Map Zones
export type ZoneState = "OPEN" | "FORMING" | "LOCKED" | "OVERLOADED" | "HIDDEN" | "DANGEROUS";

export interface ZoneTemplate {
  dimensionId: string;
  zoneName: string;
  enName: string;
  description: string;
  defaultState: ZoneState;
}

export const ZONE_TEMPLATES: ZoneTemplate[] = [
  { dimensionId: "CAREER", zoneName: "事业高地 / 职业塔", enName: "Career Tower",
    description: "职业成长、晋升、转岗的塔状区域。", defaultState: "FORMING" },
  { dimensionId: "PRODUCT_STARTUP", zoneName: "产品工坊 / 创业港", enName: "Product Forge",
    description: "构建产品、原型、内测的工坊。", defaultState: "OPEN" },
  { dimensionId: "RELATIONSHIP", zoneName: "关系湖 / 暧昧桥", enName: "Relation Lake",
    description: "亲密关系、约会、表白、分手发生的水域。", defaultState: "FORMING" },
  { dimensionId: "SOCIAL_NETWORK", zoneName: "人脉广场 / 弱连接市场", enName: "Social Plaza",
    description: "弱连接、伙伴介绍、社交聚会的广场。", defaultState: "OPEN" },
  { dimensionId: "FINANCE_RESOURCE", zoneName: "资源矿脉 / 金库", enName: "Resource Vein",
    description: "金钱、资产、现金流所在的矿脉。", defaultState: "FORMING" },
  { dimensionId: "STUDY_APPLICATION", zoneName: "学院门 / 审核厅", enName: "Academy Gate",
    description: "学习、考试、申请、审核的关口。", defaultState: "LOCKED" },
  { dimensionId: "HEALTH_RECOVERY", zoneName: "恢复圣所 / 睡眠泉", enName: "Recovery Shrine",
    description: "健康恢复、睡眠、修养的圣所。", defaultState: "OPEN" },
  { dimensionId: "COGNITION_PLASTICITY", zoneName: "思维穹顶 / 潜意识图书馆", enName: "Mind Dome",
    description: "认知、学习模式、潜意识转化的穹顶。", defaultState: "OPEN" },
  { dimensionId: "CREATION_EXPRESSION", zoneName: "创作星原 / 表达剧场", enName: "Creation Plain",
    description: "创作、发布、表达自我的星原。", defaultState: "FORMING" },
  { dimensionId: "IDENTITY_MAINLINE", zoneName: "身份王座 / 主线神殿", enName: "Mainline Throne",
    description: "身份、使命、长期价值的神殿。", defaultState: "HIDDEN" },
  { dimensionId: "LOCATION_ENVIRONMENT", zoneName: "城市边界 / 迁移之门", enName: "Migration Gate",
    description: "迁移、城市、环境变化的关口。", defaultState: "FORMING" },
  { dimensionId: "LEGAL_ADMIN_SYSTEM", zoneName: "制度关口 / 合同门", enName: "System Gate",
    description: "法律、合同、制度流程的关口。", defaultState: "LOCKED" },
  { dimensionId: "TOOL_AI_PROMPT", zoneName: "提示词工坊 / AI机房", enName: "Prompt Forge",
    description: "提示词、AI 工具、自动化的机房。", defaultState: "OPEN" },
  { dimensionId: "RISK_CHAOS_NOISE", zoneName: "乱流海 / 噪声雾区", enName: "Chaos Sea",
    description: "风险、乱流、噪声、伪信号的海域。", defaultState: "DANGEROUS" },
  { dimensionId: "SPIRIT_SYMBOLIC_VALUE", zoneName: "象征圣域 / 文明档案馆", enName: "Symbolic Sanctum",
    description: "精神、象征、长期价值的圣域。", defaultState: "HIDDEN" },
];
