// 常数宇宙 v1.0 · 事件常数（15维度默认参数）
export type EventDimensionId =
  | "CAREER" | "PRODUCT_STARTUP" | "RELATIONSHIP" | "SOCIAL_NETWORK"
  | "FINANCE_RESOURCE" | "STUDY_APPLICATION" | "HEALTH_RECOVERY"
  | "COGNITION_PLASTICITY" | "CREATION_EXPRESSION" | "IDENTITY_MAINLINE"
  | "LOCATION_ENVIRONMENT" | "LEGAL_ADMIN_SYSTEM" | "TOOL_AI_PROMPT"
  | "RISK_CHAOS_NOISE" | "SPIRIT_SYMBOLIC_VALUE";

export interface EventDimensionConstant {
  dimensionId: EventDimensionId;
  name: string;
  userFriendlyName: string;
  baseTriggerWeight: number;
  falseSignalRisk: number;       // 0-1
  feedbackReliability: number;   // 0-1
  userSensitivity: number;       // 0-1
  defaultActionBias: "OBSERVE" | "SMALL_STEP" | "ACT" | "HOLD";
  safetyLevel: "LOW" | "MEDIUM" | "HIGH";
}

export const EVENT_GLOBAL_CONSTANTS = {
  eventIntensityBase: 1.0,
  eventStageMultiplier: 1.0,
  eventRiskBase: 0.4,
  falseSignalBase: 0.3,
  manifestationWeight: 1.0,
  validationWeight: 1.0,
  actionPermissionWeight: 1.0,
};

export const EVENT_DIMENSION_CONSTANTS: EventDimensionConstant[] = [
  { dimensionId: "CAREER",              name: "事业与职业",     userFriendlyName: "工作机会",      baseTriggerWeight: 1.0, falseSignalRisk: 0.35, feedbackReliability: 0.7, userSensitivity: 0.8, defaultActionBias: "SMALL_STEP", safetyLevel: "MEDIUM" },
  { dimensionId: "PRODUCT_STARTUP",     name: "产品与创业",     userFriendlyName: "产品/创业",     baseTriggerWeight: 1.1, falseSignalRisk: 0.4,  feedbackReliability: 0.6, userSensitivity: 0.85,defaultActionBias: "SMALL_STEP", safetyLevel: "HIGH"   },
  { dimensionId: "RELATIONSHIP",        name: "亲密关系",       userFriendlyName: "亲密关系",      baseTriggerWeight: 0.95,falseSignalRisk: 0.45, feedbackReliability: 0.6, userSensitivity: 0.95,defaultActionBias: "OBSERVE",    safetyLevel: "HIGH"   },
  { dimensionId: "SOCIAL_NETWORK",      name: "社交与人脉",     userFriendlyName: "社交人脉",      baseTriggerWeight: 0.9, falseSignalRisk: 0.4,  feedbackReliability: 0.65,userSensitivity: 0.7, defaultActionBias: "OBSERVE",    safetyLevel: "MEDIUM" },
  { dimensionId: "FINANCE_RESOURCE",    name: "财务与资源",     userFriendlyName: "钱和资源",      baseTriggerWeight: 1.05,falseSignalRisk: 0.3,  feedbackReliability: 0.8, userSensitivity: 0.9, defaultActionBias: "HOLD",       safetyLevel: "HIGH"   },
  { dimensionId: "STUDY_APPLICATION",   name: "学习与申请",     userFriendlyName: "学业/申请",     baseTriggerWeight: 0.9, falseSignalRisk: 0.3,  feedbackReliability: 0.75,userSensitivity: 0.7, defaultActionBias: "SMALL_STEP", safetyLevel: "MEDIUM" },
  { dimensionId: "HEALTH_RECOVERY",     name: "健康与恢复",     userFriendlyName: "身体状态",      baseTriggerWeight: 0.85,falseSignalRisk: 0.3,  feedbackReliability: 0.8, userSensitivity: 0.95,defaultActionBias: "HOLD",       safetyLevel: "HIGH"   },
  { dimensionId: "COGNITION_PLASTICITY",name: "认知与可塑性",   userFriendlyName: "思维变化",      baseTriggerWeight: 0.8, falseSignalRisk: 0.35, feedbackReliability: 0.65,userSensitivity: 0.65,defaultActionBias: "OBSERVE",    safetyLevel: "LOW"    },
  { dimensionId: "CREATION_EXPRESSION", name: "创作与表达",     userFriendlyName: "内容创作",      baseTriggerWeight: 1.0, falseSignalRisk: 0.4,  feedbackReliability: 0.7, userSensitivity: 0.75,defaultActionBias: "ACT",        safetyLevel: "LOW"    },
  { dimensionId: "IDENTITY_MAINLINE",   name: "身份与主线",     userFriendlyName: "你是谁",        baseTriggerWeight: 1.0, falseSignalRisk: 0.3,  feedbackReliability: 0.7, userSensitivity: 0.9, defaultActionBias: "OBSERVE",    safetyLevel: "HIGH"   },
  { dimensionId: "LOCATION_ENVIRONMENT",name: "地理与环境",     userFriendlyName: "地点/环境",     baseTriggerWeight: 0.85,falseSignalRisk: 0.3,  feedbackReliability: 0.75,userSensitivity: 0.7, defaultActionBias: "SMALL_STEP", safetyLevel: "MEDIUM" },
  { dimensionId: "LEGAL_ADMIN_SYSTEM",  name: "制度与手续",     userFriendlyName: "手续/规则",     baseTriggerWeight: 0.85,falseSignalRisk: 0.25, feedbackReliability: 0.85,userSensitivity: 0.6, defaultActionBias: "HOLD",       safetyLevel: "HIGH"   },
  { dimensionId: "TOOL_AI_PROMPT",      name: "工具与提示词",   userFriendlyName: "AI 工具",       baseTriggerWeight: 1.0, falseSignalRisk: 0.4,  feedbackReliability: 0.7, userSensitivity: 0.7, defaultActionBias: "ACT",        safetyLevel: "LOW"    },
  { dimensionId: "RISK_CHAOS_NOISE",    name: "风险与乱流",     userFriendlyName: "风险/噪声",     baseTriggerWeight: 1.1, falseSignalRisk: 0.55, feedbackReliability: 0.55,userSensitivity: 0.85,defaultActionBias: "HOLD",       safetyLevel: "HIGH"   },
  { dimensionId: "SPIRIT_SYMBOLIC_VALUE",name: "精神与象征",    userFriendlyName: "长期价值",      baseTriggerWeight: 0.9, falseSignalRisk: 0.4,  feedbackReliability: 0.5, userSensitivity: 0.65,defaultActionBias: "OBSERVE",    safetyLevel: "MEDIUM" },
];

export const getEventDimension = (id: EventDimensionId) =>
  EVENT_DIMENSION_CONSTANTS.find((d) => d.dimensionId === id);
