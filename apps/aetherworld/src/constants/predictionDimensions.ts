// 预测维度体系 — 16 个维度
export type PredictionDimensionId =
  | "CAREER" | "PRODUCT" | "RELATIONSHIP" | "FINANCE" | "STUDY_APPLICATION"
  | "HEALTH_RECOVERY" | "COGNITION" | "CREATION" | "IDENTITY" | "LOCATION"
  | "SOCIAL_NETWORK" | "FAMILY_LIFE" | "LEGAL_ADMIN" | "SPIRIT_MAINLINE"
  | "RISK_CHAOS" | "PROMPT_TOOLING";

export interface PredictionDimension {
  id: PredictionDimensionId;
  name: string;
  en: string;
  description: string;
  relatedNumbers: number[];
  relatedDomains: string[]; // tian/di/ren/shen/feng
  defaultEventTypes: string[];
  defaultActionPermissions: string[];
  riskFactors: string[];
  validationSignals: string[];
  icon: string; // emoji 占位
}

export const PREDICTION_DIMENSIONS: PredictionDimension[] = [
  {
    id: "CAREER", name: "事业路径", en: "Career", icon: "💼",
    description: "工作、职业方向、职位、项目推进与外部认可。",
    relatedNumbers: [1, 4, 8], relatedDomains: ["di", "shen"],
    defaultEventTypes: ["CAREER_OPENING", "CAREER_BLOCKED"],
    defaultActionPermissions: ["进", "守", "转"],
    riskFactors: ["资源不足", "时机过早", "关键人物缺位"],
    validationSignals: ["合作邀约", "面试推进", "正式回复", "项目进度变化"],
  },
  {
    id: "PRODUCT", name: "产品与创业", en: "Product", icon: "🚀",
    description: "产品活性、迭代、发布窗口、用户反馈、商业化。",
    relatedNumbers: [3, 5, 8], relatedDomains: ["di", "feng", "shen"],
    defaultEventTypes: ["PRODUCT_ACTIVATION", "PRODUCT_ITERATION", "PRODUCT_RELEASE_WINDOW"],
    defaultActionPermissions: ["进", "发布", "修复"],
    riskFactors: ["Scope drift", "未回验先放量", "Demo/Real 混用"],
    validationSignals: ["用户点击", "Demo 可解释", "回验数据积累"],
  },
  {
    id: "RELATIONSHIP", name: "关系与亲密", en: "Relationship", icon: "💞",
    description: "暧昧、恋爱、朋友、合作关系的升降温与确认。",
    relatedNumbers: [2, 6], relatedDomains: ["ren", "feng"],
    defaultEventTypes: ["RELATIONSHIP_WARMING", "RELATIONSHIP_COOLING", "RELATIONSHIP_CONFIRMATION", "RELATIONSHIP_DISTORTION"],
    defaultActionPermissions: ["沟通", "等待", "确认"],
    riskFactors: ["误读", "情绪噪声", "时间错位"],
    validationSignals: ["主动联系", "私人化内容", "线下见面"],
  },
  {
    id: "FINANCE", name: "财务与资源", en: "Finance", icon: "💰",
    description: "收入、资金、订单、投资与现金流。",
    relatedNumbers: [4, 8], relatedDomains: ["di"],
    defaultEventTypes: ["RESOURCE_INFLOW", "RESOURCE_DRAIN", "MONEY_PRESSURE"],
    defaultActionPermissions: ["守", "断", "转"],
    riskFactors: ["过早承诺", "成本未计", "现金流断裂"],
    validationSignals: ["进账", "支出", "订单/账期变化"],
  },
  {
    id: "STUDY_APPLICATION", name: "学业与申请", en: "Study & Application", icon: "🎓",
    description: "学校、申请、面试、材料、录取、教授反馈。",
    relatedNumbers: [4, 7], relatedDomains: ["di", "shen"],
    defaultEventTypes: ["STUDY_SIGNAL", "APPLICATION_RESPONSE"],
    defaultActionPermissions: ["补材料", "等待", "沟通"],
    riskFactors: ["材料未齐", "时间窗口错过"],
    validationSignals: ["面试邀请", "录取通知", "教授回复"],
  },
  {
    id: "HEALTH_RECOVERY", name: "身体恢复", en: "Health Recovery", icon: "🌿",
    description: "运动、睡眠、饮食、神经恢复、能量与过载风险。",
    relatedNumbers: [6, 9], relatedDomains: ["di"],
    defaultEventTypes: ["HEALTH_RECOVERY_UP", "HEALTH_OVERLOAD"],
    defaultActionPermissions: ["恢复", "降载", "等待"],
    riskFactors: ["睡眠不足", "持续过载"],
    validationSignals: ["睡眠质量", "运动欲", "情绪稳定度"],
  },
  {
    id: "COGNITION", name: "认知与脑力", en: "Cognition", icon: "🧠",
    description: "认知算力、潜意识调用、可塑性、过载与结构生成。",
    relatedNumbers: [7, 9], relatedDomains: ["shen", "feng"],
    defaultEventTypes: ["COGNITIVE_BOOST", "COGNITIVE_LIMITING", "PLASTICITY_GENERATION"],
    defaultActionPermissions: ["外化", "记录", "休息"],
    riskFactors: ["过载", "多巴胺不足"],
    validationSignals: ["新结构生成", "输出速度", "判断稳定度"],
  },
  {
    id: "CREATION", name: "创作与表达", en: "Creation", icon: "🎨",
    description: "音乐、小说、世界观、文档、提示词、内容发布。",
    relatedNumbers: [3, 5, 7], relatedDomains: ["shen", "feng"],
    defaultEventTypes: ["CREATIVE_BURST", "CREATIVE_BLOCK"],
    defaultActionPermissions: ["创作", "发布", "等待"],
    riskFactors: ["阻滞", "完美主义"],
    validationSignals: ["作品产出", "他人反馈"],
  },
  {
    id: "IDENTITY", name: "身份转折", en: "Identity Shift", icon: "🌀",
    description: "自我定位、社会身份、学历身份、公开形象。",
    relatedNumbers: [1, 9], relatedDomains: ["shen", "feng"],
    defaultEventTypes: ["IDENTITY_SHIFT"],
    defaultActionPermissions: ["确认", "转向"],
    riskFactors: ["身份混乱", "外界标签干扰"],
    validationSignals: ["自我表述变化", "公开身份变化"],
  },
  {
    id: "LOCATION", name: "地理与迁移", en: "Location", icon: "📍",
    description: "城市、地区、场域、环境、迁移机会。",
    relatedNumbers: [4, 5], relatedDomains: ["di", "feng"],
    defaultEventTypes: ["LOCATION_SUPPORT", "LOCATION_BLOCK"],
    defaultActionPermissions: ["迁移", "驻留", "勘察"],
    riskFactors: ["场域不承载", "迁移成本"],
    validationSignals: ["环境反馈", "工作/学习场域变化"],
  },
  {
    id: "SOCIAL_NETWORK", name: "社交与人脉", en: "Social Network", icon: "🕸️",
    description: "贵人、合作方、朋友、群体评价、弱连接。",
    relatedNumbers: [2, 3], relatedDomains: ["ren", "feng"],
    defaultEventTypes: ["HUMAN_VARIABLE_APPEARS", "HUMAN_VARIABLE_MISSING"],
    defaultActionPermissions: ["主动连接", "等待"],
    riskFactors: ["弱连接未激活", "无效社交"],
    validationSignals: ["旧友联络", "弱连接推进"],
  },
  {
    id: "FAMILY_LIFE", name: "家庭与生活", en: "Family Life", icon: "🏠",
    description: "家庭影响、居住、生活节律、现实责任。",
    relatedNumbers: [2, 6], relatedDomains: ["di", "ren"],
    defaultEventTypes: ["RESOURCE_INFLOW", "MONEY_PRESSURE"],
    defaultActionPermissions: ["守", "沟通"],
    riskFactors: ["责任过载", "节律紊乱"],
    validationSignals: ["家庭事件", "居住变化"],
  },
  {
    id: "LEGAL_ADMIN", name: "制度与手续", en: "Legal/Admin", icon: "📑",
    description: "合同、身份、申请、手续、政策、审核。",
    relatedNumbers: [4], relatedDomains: ["di"],
    defaultEventTypes: ["ADMIN_APPROVAL", "ADMIN_DELAY"],
    defaultActionPermissions: ["等待", "补充", "申诉"],
    riskFactors: ["材料缺失", "政策变更"],
    validationSignals: ["官方回执", "审核状态"],
  },
  {
    id: "SPIRIT_MAINLINE", name: "主线与意义", en: "Mainline", icon: "🧭",
    description: "使命感、长期主线、世界观、人生方向。",
    relatedNumbers: [7, 9], relatedDomains: ["shen"],
    defaultEventTypes: ["MAINLINE_ALIGNMENT", "MAINLINE_DEVIATION"],
    defaultActionPermissions: ["对齐", "回归"],
    riskFactors: ["被短期信号牵走"],
    validationSignals: ["决策与主线一致度"],
  },
  {
    id: "RISK_CHAOS", name: "风险与乱流", en: "Risk/Chaos", icon: "⚠️",
    description: "突发、误解、冲突、过载、延迟、诱饵、伪信号。",
    relatedNumbers: [0, 5], relatedDomains: ["feng"],
    defaultEventTypes: ["CHAOS_RISK", "FALSE_SIGNAL_EVENT"],
    defaultActionPermissions: ["守", "断", "降载"],
    riskFactors: ["噪声主导", "误判塌缩"],
    validationSignals: ["事件是否真实落地"],
  },
  {
    id: "PROMPT_TOOLING", name: "提示词与工具", en: "Prompt/Tooling", icon: "🛠️",
    description: "Lovable / Codex / AI 工具、提示词效果、自动化推进。",
    relatedNumbers: [3, 5, 8], relatedDomains: ["feng", "shen"],
    defaultEventTypes: ["PRODUCT_ITERATION", "CREATIVE_BURST"],
    defaultActionPermissions: ["生成", "迭代", "回验"],
    riskFactors: ["Prompt 漂移", "工具误调"],
    validationSignals: ["生成质量", "复用度"],
  },
];

export function getDimension(id: PredictionDimensionId | string): PredictionDimension {
  return PREDICTION_DIMENSIONS.find((d) => d.id === id) ?? PREDICTION_DIMENSIONS[0];
}
