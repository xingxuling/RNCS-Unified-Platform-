// 常数宇宙 v1.0 · 数字常数 (0–9)
// 所有需要解读 0–9 含义的计算法都必须读取本文件，不允许重复定义。

import type { Domain } from "@/constants/types";

export interface NumberConstant {
  digit: number;
  name: string;
  userFriendlyName: string;
  coreMeaning: string;
  positiveExpression: string[];
  negativeExpression: string[];
  relatedEvents: string[];
  relatedActions: string[];
  relatedDomains: string[]; // HEAVEN / EARTH / HUMAN / SPIRIT / WIND
  defaultWeight: number;
  // 兼容字段（旧版常数页与预测引擎使用）
  domain: Domain;
  shortMeaning: string;
  fullMeaning: string;
  actions: string[];
  risks: string[];
}

// 新五域 → 旧 Domain 映射
const DOMAIN_NEW_TO_OLD: Record<string, Domain> = {
  HEAVEN: "tian", EARTH: "di", HUMAN: "ren", SPIRIT: "shen", WIND: "feng",
};

export const NUMBER_CONSTANTS: NumberConstant[] = ([
  {
    digit: 0,
    name: "空位 / 归零",
    userFriendlyName: "还没出现 / 先清空",
    coreMeaning: "空位、清空、未显、重置、归零、等待。",
    positiveExpression: ["留白", "重置成功", "新空间打开"],
    negativeExpression: ["空转", "无信号", "信息缺失"],
    relatedEvents: ["RESET_WINDOW", "EMPTY_FIELD"],
    relatedActions: ["等待", "清理", "暂不出手"],
    relatedDomains: ["HEAVEN", "SPIRIT"],
    defaultWeight: 0.6,
  },
  {
    digit: 1,
    name: "主权 / 自我",
    userFriendlyName: "你自己的决定",
    coreMeaning: "主权、自我、启动、个人意志、独立判断。",
    positiveExpression: ["主动启动", "独立判断", "自主成型"],
    negativeExpression: ["孤立", "过度主观", "拒绝外部反馈"],
    relatedEvents: ["SELF_INITIATION", "INDEPENDENT_DECISION"],
    relatedActions: ["独立行动", "确认自我意志"],
    relatedDomains: ["HUMAN", "SPIRIT"],
    defaultWeight: 1.0,
  },
  {
    digit: 2,
    name: "关系 / 配对",
    userFriendlyName: "和别人有关",
    coreMeaning: "关系、配对、合作、拉扯、人际互动。",
    positiveExpression: ["合作达成", "关系靠近", "互补成立"],
    negativeExpression: ["依赖", "纠缠", "误读他人"],
    relatedEvents: ["INTIMATE_OPENING", "PARTNERSHIP"],
    relatedActions: ["谈一谈", "确认意图"],
    relatedDomains: ["HUMAN"],
    defaultWeight: 0.9,
  },
  {
    digit: 3,
    name: "表达 / 创作",
    userFriendlyName: "说出来 / 发出去",
    coreMeaning: "表达、创作、传播、内容、语言输出。",
    positiveExpression: ["内容传播", "表达精准", "影响放大"],
    negativeExpression: ["表达过载", "说多做少", "噪声"],
    relatedEvents: ["CREATION_RELEASE", "CONTENT_HIT"],
    relatedActions: ["写下来", "发布"],
    relatedDomains: ["WIND", "HUMAN"],
    defaultWeight: 0.95,
  },
  {
    digit: 4,
    name: "秩序 / 制度",
    userFriendlyName: "规则和流程",
    coreMeaning: "秩序、规则、制度、框架、稳定结构。",
    positiveExpression: ["结构成立", "流程闭环", "可重复"],
    negativeExpression: ["僵化", "卡制度", "拒绝变化"],
    relatedEvents: ["LEGAL_PROCESS", "POLICY_WINDOW"],
    relatedActions: ["走流程", "建框架"],
    relatedDomains: ["EARTH"],
    defaultWeight: 0.85,
  },
  {
    digit: 5,
    name: "变局 / 触发",
    userFriendlyName: "事情开始变化",
    coreMeaning: "变局、破局、转向、触发、行动压力。",
    positiveExpression: ["突破", "转折", "破局机会"],
    negativeExpression: ["冲动", "混乱", "过快行动"],
    relatedEvents: ["TRIGGER_WINDOW", "MARKET_PIVOT"],
    relatedActions: ["小步推进", "观察是否该行动"],
    relatedDomains: ["WIND"],
    defaultWeight: 1.1,
  },
  {
    digit: 6,
    name: "承载 / 恢复",
    userFriendlyName: "先稳住 / 需要恢复",
    coreMeaning: "承载、恢复、供能、责任、长期稳定。",
    positiveExpression: ["稳定供给", "恢复达成", "可持续"],
    negativeExpression: ["负担", "拖慢", "过度承担"],
    relatedEvents: ["HEALTH_RECOVERY", "SUPPLY_STABILITY"],
    relatedActions: ["休息", "补能"],
    relatedDomains: ["EARTH", "HUMAN"],
    defaultWeight: 0.8,
  },
  {
    digit: 7,
    name: "深读 / 隐性",
    userFriendlyName: "先看深一点",
    coreMeaning: "深读、隐性判断、研究、潜意识、后台处理。",
    positiveExpression: ["看穿本质", "潜在突破", "研究成果"],
    negativeExpression: ["过度分析", "孤立思考", "拖延输出"],
    relatedEvents: ["DEEP_RESEARCH", "INSIGHT_DROP"],
    relatedActions: ["收集信息", "暂不公开"],
    relatedDomains: ["SPIRIT", "HUMAN"],
    defaultWeight: 0.9,
  },
  {
    digit: 8,
    name: "资源 / 商业",
    userFriendlyName: "资源和钱",
    coreMeaning: "资源、金钱、权力、价值、商业化。",
    positiveExpression: ["资源到位", "变现达成", "杠杆放大"],
    negativeExpression: ["利益压力", "成本过高", "资源争夺"],
    relatedEvents: ["FINANCE_INFLOW", "RESOURCE_WINDOW"],
    relatedActions: ["谈钱", "确认资源"],
    relatedDomains: ["EARTH"],
    defaultWeight: 1.05,
  },
  {
    digit: 9,
    name: "终局 / 长期",
    userFriendlyName: "这件事的长期价值",
    coreMeaning: "终局、高位、完成、文明感、长期意义。",
    positiveExpression: ["长期成立", "文明级影响", "主线收束"],
    negativeExpression: ["过度神话", "目标太大", "脱离现实"],
    relatedEvents: ["MAINLINE_LOCK", "LIFETIME_MILESTONE"],
    relatedActions: ["确认是否值得", "校准主线"],
    relatedDomains: ["SPIRIT"],
    defaultWeight: 1.0,
  },
] as unknown as NumberConstant[]).map((n) => ({
  ...n,
  domain: (DOMAIN_NEW_TO_OLD[n.relatedDomains[0]] ?? "ren") as Domain,
  shortMeaning: n.userFriendlyName,
  fullMeaning: n.coreMeaning,
  actions: [...n.relatedActions],
  risks: [...n.negativeExpression],
}));

export const getNumberConstant = (d: number): NumberConstant =>
  NUMBER_CONSTANTS.find((n) => n.digit === d) ?? NUMBER_CONSTANTS[0];
