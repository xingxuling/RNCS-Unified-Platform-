// Beta Risk Types — risks that must be evaluated before opening beta.

export type BetaRiskTypeId =
  | "PRIVACY_LEAK"
  | "OVER_DETERMINISM"
  | "MISINTERPRETATION"
  | "COGNITIVE_OVERLOAD"
  | "EMOTIONAL_DEPENDENCE"
  | "FINANCIAL_MISUSE"
  | "MEDICAL_MISUSE"
  | "ENTERPRISE_MISPOSITIONING"
  | "CULTURAL_MISREAD"
  | "DATA_POLLUTION";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface BetaRiskTypeMeta {
  id: BetaRiskTypeId;
  cn: string;
  en: string;
  whyItMatters: string;
  mitigation: string;
  blocksPublicLaunchWhenHigh: boolean;
  defaultLevel: RiskLevel;
}

export const BETA_RISK_TYPES: Record<BetaRiskTypeId, BetaRiskTypeMeta> = {
  PRIVACY_LEAK: {
    id: "PRIVACY_LEAK",
    cn: "隐私泄露风险",
    en: "Privacy Leak Risk",
    whyItMatters: "真实主体 60 组数列属于敏感个人数据。",
    mitigation: "默认本地保存、可删除、Demo 隔离、不上传服务端。",
    blocksPublicLaunchWhenHigh: true,
    defaultLevel: "LOW",
  },
  OVER_DETERMINISM: {
    id: "OVER_DETERMINISM",
    cn: "绝对化倾向风险",
    en: "Over-Determinism Risk",
    whyItMatters: "用户可能把预测当作绝对命令而非结构辅助。",
    mitigation: "强制使用未定/半定/已定/反定/假定多状态输出，避免单一断言。",
    blocksPublicLaunchWhenHigh: true,
    defaultLevel: "MEDIUM",
  },
  MISINTERPRETATION: {
    id: "MISINTERPRETATION",
    cn: "误读风险",
    en: "Misinterpretation Risk",
    whyItMatters: "用户可能误以为这是普通算命或神秘断言。",
    mitigation: "首页与 onboarding 显式声明：这是结构化预测 OS。",
    blocksPublicLaunchWhenHigh: false,
    defaultLevel: "MEDIUM",
  },
  COGNITIVE_OVERLOAD: {
    id: "COGNITIVE_OVERLOAD",
    cn: "认知过载风险",
    en: "Cognitive Overload Risk",
    whyItMatters: "功能与术语过多导致用户无法进入体验。",
    mitigation: "默认 Demo Persona，分层访问；可选项延后曝光。",
    blocksPublicLaunchWhenHigh: false,
    defaultLevel: "MEDIUM",
  },
  EMOTIONAL_DEPENDENCE: {
    id: "EMOTIONAL_DEPENDENCE",
    cn: "情绪依赖风险",
    en: "Emotional Dependence Risk",
    whyItMatters: "用户过度依赖预测结果影响心理健康。",
    mitigation: "首页持续声明：预测仅供结构判断；提供退出 / 暂停建议。",
    blocksPublicLaunchWhenHigh: false,
    defaultLevel: "MEDIUM",
  },
  FINANCIAL_MISUSE: {
    id: "FINANCIAL_MISUSE",
    cn: "金融误用风险",
    en: "Financial Misuse Risk",
    whyItMatters: "用户可能将预测用于投资或高风险财务决策。",
    mitigation: "全局免责声明：不构成投资建议；Prompt Forge 禁用金融断言。",
    blocksPublicLaunchWhenHigh: true,
    defaultLevel: "LOW",
  },
  MEDICAL_MISUSE: {
    id: "MEDICAL_MISUSE",
    cn: "医疗误用风险",
    en: "Medical Misuse Risk",
    whyItMatters: "用户可能将预测用于健康诊断。",
    mitigation: "全局声明：不构成医疗诊断；身体类窗口仅描述结构节奏。",
    blocksPublicLaunchWhenHigh: true,
    defaultLevel: "LOW",
  },
  ENTERPRISE_MISPOSITIONING: {
    id: "ENTERPRISE_MISPOSITIONING",
    cn: "企业定位误读风险",
    en: "Enterprise Mispositioning Risk",
    whyItMatters: "企业用户可能误解产品为命理工具。",
    mitigation: "对企业用户启用 Enterprise Safe Mode，隐藏命运化语言。",
    blocksPublicLaunchWhenHigh: false,
    defaultLevel: "MEDIUM",
  },
  CULTURAL_MISREAD: {
    id: "CULTURAL_MISREAD",
    cn: "文化误读风险",
    en: "Cultural Misread Risk",
    whyItMatters: "不同地区文案不匹配会导致误解。",
    mitigation: "接入 Regional UX Engine，调整文案与禁用词。",
    blocksPublicLaunchWhenHigh: false,
    defaultLevel: "MEDIUM",
  },
  DATA_POLLUTION: {
    id: "DATA_POLLUTION",
    cn: "数据污染风险",
    en: "Data Pollution Risk",
    whyItMatters: "Demo 数据与真实主体数据混淆会污染回验权重。",
    mitigation: "严格按 SubjectMode 隔离；真实主体单独存储。",
    blocksPublicLaunchWhenHigh: true,
    defaultLevel: "LOW",
  },
};

export const BETA_RISK_TYPE_LIST = Object.values(BETA_RISK_TYPES);
