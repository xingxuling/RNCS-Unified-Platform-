export interface ExampleScenarioType {
  id: string;
  title: string;
  userFriendlyDescription: string;
  bestInputTemplate: string;
  expectedOutput: string;
  nextAction: string;
  recommendedModule: string;
  safetyNote?: string;
}

export const EXAMPLE_SCENARIO_TYPES: ExampleScenarioType[] = [
  { id: "SHOULD_I_ACT", title: "我该不该行动", userFriendlyDescription: "面前有机会但不确定", bestInputTemplate: "我现在有一个机会：{背景}。我担心{风险}，想问该不该推进。", expectedOutput: "现状定型度、缺失变量、行动许可、验证窗口", nextAction: "选一个最小行动", recommendedModule: "reality-solver", safetyNote: "不替代专业建议" },
  { id: "PRODUCT_UNCLEAR", title: "用户看不懂我的产品", userFriendlyDescription: "用户流失或反馈复杂", bestInputTemplate: "用户反馈：{反馈}。我现在的入门流程是：{流程}", expectedOutput: "术语过载点、入门摩擦、修复优先级", nextAction: "重写入门 CTA / 加示例", recommendedModule: "software-qa" },
  { id: "CONTENT_SPREAD", title: "内容传播 / 小红书", userFriendlyDescription: "想让一篇内容更有效", bestInputTemplate: "标题：{标题}；标签：{标签}；数据：{数据}", expectedOutput: "钩子诊断、标签池建议、follow-up 策略", nextAction: "改标题或重发", recommendedModule: "copy-generator" },
  { id: "RELATIONSHIP_SIGNAL", title: "关系信号", userFriendlyDescription: "判断关系窗口", bestInputTemplate: "对方最近{行为}，我感觉{感受}", expectedOutput: "信号、噪声、行动许可", nextAction: "小步沟通", recommendedModule: "reality-solver", safetyNote: "不替代心理咨询" },
  { id: "CAREER_OR_SCHOOL", title: "升学 / 工作路径", userFriendlyDescription: "判断选哪条路", bestInputTemplate: "我有 {选项A} 和 {选项B}，背景是{背景}", expectedOutput: "路径压力、定型度、可调变量", nextAction: "选一个验证点", recommendedModule: "reality-solver" },
  { id: "PROJECT_DECISION", title: "项目推进判断", userFriendlyDescription: "项目要不要继续", bestInputTemplate: "项目当前状态：{状态}", expectedOutput: "进/守/转/断 建议", nextAction: "执行最小行动", recommendedModule: "universal-breakthrough" },
  { id: "CREATIVE_WORLD", title: "世界观 / 角色 / 剧情", userFriendlyDescription: "做创作内容", bestInputTemplate: "我想做一个{风格}的世界，主角是{设定}", expectedOutput: "世界种子、角色、初始事件", nextAction: "保存世界种子", recommendedModule: "virtual-world" },
  { id: "VIRTUAL_LIFE_DAY", title: "生成虚拟的一天", userFriendlyDescription: "今天用虚拟方式过一遍", bestInputTemplate: "我今天状态：{状态}", expectedOutput: "醒来地点、任务、NPC、现实锚点", nextAction: "完成一个现实小任务", recommendedModule: "virtual-life" },
  { id: "CREATION_SIMULATION", title: "创造物可行性", userFriendlyDescription: "想做某个东西先模拟", bestInputTemplate: "我想做：{创造物描述}", expectedOutput: "可行性、风险、MVP 路径", nextAction: "做窄版原型", recommendedModule: "virtual-creation" },
  { id: "BUG_OR_FEEDBACK", title: "产品 Bug / 反馈", userFriendlyDescription: "扫描质量问题", bestInputTemplate: "帮我扫描当前项目的入口与隔离", expectedOutput: "Critical / High / Medium 问题", nextAction: "修 Critical", recommendedModule: "software-qa" },
  { id: "FOUNDER_CONTROL", title: "创始人控制台", userFriendlyDescription: "管理权限/算法", bestInputTemplate: "我想{操作}", expectedOutput: "权限、版本、审计建议", nextAction: "记录到 Audit Log", recommendedModule: "founder-console", safetyNote: "本地口令非服务器级安全" },
  { id: "RECOVERY_AND_ENERGY", title: "恢复 / 能量", userFriendlyDescription: "调整状态", bestInputTemplate: "我目前疲劳/分心程度：{描述}", expectedOutput: "节奏建议、恢复动作", nextAction: "执行一个恢复动作", recommendedModule: "virtual-life", safetyNote: "不替代医疗建议" },
  { id: "BUSINESS_VALUE", title: "商业价值 / 变现", userFriendlyDescription: "判断定价/盈利", bestInputTemplate: "产品：{产品}；用户：{用户}", expectedOutput: "价值密度、定价区间、风险", nextAction: "做小规模测试", recommendedModule: "universal-breakthrough", safetyNote: "不替代投资建议" },
  { id: "EVENT_FORECAST", title: "事件预测窗口", userFriendlyDescription: "看时间窗口", bestInputTemplate: "事情：{事件}；我现在的状态：{状态}", expectedOutput: "高概率窗口、共振点", nextAction: "在窗口内行动", recommendedModule: "timeline" },
  { id: "PERSONAL_WORLD", title: "生成个人世界", userFriendlyDescription: "做你自己的世界", bestInputTemplate: "我的偏好：{偏好}", expectedOutput: "区域、NPC、主线", nextAction: "保存为种子", recommendedModule: "world-generator" },
];

export function getScenario(id: string) {
  return EXAMPLE_SCENARIO_TYPES.find((s) => s.id === id);
}
