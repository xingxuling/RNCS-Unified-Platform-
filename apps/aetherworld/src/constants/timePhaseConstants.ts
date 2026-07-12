// 常数宇宙 v1.0 · 十二长生时间相位
export type EventStage =
  | "SEED" | "FORMING" | "TRIGGERED" | "ESCALATING" | "CONFIRMING"
  | "PEAKING" | "DECLINING" | "BLOCKED" | "REVERSED" | "ARCHIVED";

export interface TimePhaseConstant {
  phaseId: string;
  index: number;
  name: string;
  userFriendlyName: string;
  actionSuggestion: string;
  eventStageMapping: EventStage;
  risk: string;
  feedbackInterpretation: string;
}

export const TIME_PHASE_CONSTANTS: TimePhaseConstant[] = [
  { phaseId: "CHANG_SHENG", index: 1,  name: "长生", userFriendlyName: "刚开始",            actionSuggestion: "小步启动，不要重投入", eventStageMapping: "SEED",       risk: "雏形脆弱",   feedbackInterpretation: "看到苗头但还不能确认" },
  { phaseId: "MU_YU",       index: 2,  name: "沐浴", userFriendlyName: "变得不稳定",        actionSuggestion: "暂不公开，多观察",     eventStageMapping: "FORMING",    risk: "高变异",     feedbackInterpretation: "信号摇摆，容易误判" },
  { phaseId: "GUAN_DAI",    index: 3,  name: "冠带", userFriendlyName: "初成型，可展示",    actionSuggestion: "可以小范围试水",       eventStageMapping: "FORMING",    risk: "外强中干",   feedbackInterpretation: "看起来成立，但仍需回验" },
  { phaseId: "LIN_GUAN",    index: 4,  name: "临官", userFriendlyName: "可操作，进入现实",  actionSuggestion: "可以正式启动",         eventStageMapping: "TRIGGERED",  risk: "节奏过快",   feedbackInterpretation: "事件进入显化期" },
  { phaseId: "DI_WANG",     index: 5,  name: "帝旺", userFriendlyName: "进入高峰",          actionSuggestion: "充分使用窗口期",       eventStageMapping: "PEAKING",   risk: "高峰即转折", feedbackInterpretation: "命中率最高的窗口" },
  { phaseId: "SHUAI",       index: 6,  name: "衰",   userFriendlyName: "回落，降频",        actionSuggestion: "收尾，不要再扩张",     eventStageMapping: "DECLINING",  risk: "拖延",       feedbackInterpretation: "信号在弱化" },
  { phaseId: "BING",        index: 7,  name: "病",   userFriendlyName: "过载，疲劳",        actionSuggestion: "停下来修复",           eventStageMapping: "BLOCKED",    risk: "结构受损",   feedbackInterpretation: "异常信号增多" },
  { phaseId: "SI",          index: 8,  name: "死",   userFriendlyName: "终止",              actionSuggestion: "承认结束",             eventStageMapping: "REVERSED",   risk: "强行延续",   feedbackInterpretation: "旧结构死亡" },
  { phaseId: "MU",          index: 9,  name: "墓",   userFriendlyName: "归档、封存",        actionSuggestion: "复盘并存档",           eventStageMapping: "ARCHIVED",   risk: "执念",       feedbackInterpretation: "进入沉淀期" },
  { phaseId: "JUE",         index: 10, name: "绝",   userFriendlyName: "清空、空位",        actionSuggestion: "腾出空间",             eventStageMapping: "ARCHIVED",   risk: "空虚",       feedbackInterpretation: "等待新可能" },
  { phaseId: "TAI",         index: 11, name: "胎",   userFriendlyName: "新胚胎",            actionSuggestion: "悄悄孕育",             eventStageMapping: "SEED",       risk: "过早曝光",   feedbackInterpretation: "新可能正在生成" },
  { phaseId: "YANG",        index: 12, name: "养",   userFriendlyName: "培育、准备",        actionSuggestion: "持续投入，不要急显化", eventStageMapping: "FORMING",    risk: "准备不足",   feedbackInterpretation: "内部生长中" },
];

export const getPhaseByStage = (s: EventStage) =>
  TIME_PHASE_CONSTANTS.filter((p) => p.eventStageMapping === s);
