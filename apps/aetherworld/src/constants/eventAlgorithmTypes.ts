// 事件算法体系 — 32 类
import type { PredictionDimensionId } from "./predictionDimensions";

export type EventPolarity = "POSITIVE" | "NEGATIVE" | "NEUTRAL" | "MIXED";

export interface EventAlgorithm {
  id: string;
  name: string;
  en: string;
  dimensionId: PredictionDimensionId;
  positiveOrNegative: EventPolarity;
  baseFormula: string;
  requiredSignals: string[];
  blockingSignals: string[];
  actionPermissions: string[];
  validationSignals: string[];
  feedbackMetrics: string[];
  /** 用户语言名称（普通用户能直接看懂的事件名） */
  userFriendlyName?: string;
  /** 行动语言：直接告诉用户「该怎么做」 */
  actionLanguage?: string;
  /** 微文案：用于卡片、标签、移动端 */
  microcopy?: string;
  /** 轻微表现 */
  subtleManifestations?: string[];
  /** 典型表现 */
  typicalManifestations?: string[];
  /** 强表现 */
  strongManifestations?: string[];
  /** 事件的典型「伪表现」/噪声混淆形式（用于回验区分真信号与伪信号） */
  falseManifestations?: string[];
  /** 风险信号 */
  riskSignals?: string[];
  /** 建议回验字段 */
  recommendedFeedbackFields?: string[];
  /** 相关行动许可（与 actionPermissions 形成同义集合） */
  relatedActionPermissions?: string[];
  /** 同义事件 ID 列表（外部 ID → 本事件） */
  alias?: string[];
  /** 若本事件已被归并，指向 primary eventId（保留旧数据） */
  mergedInto?: string;
  /** 父事件 ID（本事件为父事件的下位现象，保留两者不删除） */
  parentEventId?: string;
  /** 子事件 ID 列表（反向引用） */
  childEventIds?: string[];
  /** 近义但保留两者的相关事件（KEEP_BOTH 簇，用于消歧而非合并） */
  relatedEventIds?: string[];
  /** 标记为已弃用（不删除，仅用于回验归并） */
  deprecated?: boolean;
}


/** 用户语言名称映射：仅补齐字段，不新增事件 */
const USER_FRIENDLY_NAMES: Record<string, string> = {
  CAREER_OPENING: "工作机会正在打开",
  CAREER_BLOCKED: "工作推进卡住了",
  PRODUCT_ACTIVATION: "产品开始有人用了",
  PRODUCT_ITERATION: "产品在变得更好",
  PRODUCT_RELEASE_WINDOW: "可以发布的好时机",
  RESOURCE_INFLOW: "钱或资源在进来",
  RESOURCE_DRAIN: "钱或资源在流失",
  MONEY_PRESSURE: "近期手头会紧",
  RELATIONSHIP_WARMING: "关系在变近",
  RELATIONSHIP_COOLING: "关系在变远",
  RELATIONSHIP_CONFIRMATION: "关系会被定下来",
  RELATIONSHIP_DISTORTION: "你可能在误解对方",
  HUMAN_VARIABLE_APPEARS: "有重要的人会出现",
  HUMAN_VARIABLE_MISSING: "缺一个关键的人",
  STUDY_SIGNAL: "学业/申请有进展信号",
  APPLICATION_RESPONSE: "申请结果要回来了",
  HEALTH_RECOVERY_UP: "身体在恢复",
  HEALTH_OVERLOAD: "身体快撑不住了",
  COGNITIVE_BOOST: "脑子会变得很清楚",
  COGNITIVE_LIMITING: "脑子会变迟钝",
  PLASTICITY_GENERATION: "你会长出新的能力",
  CREATIVE_BURST: "灵感会爆发",
  CREATIVE_BLOCK: "创作会卡住",
  IDENTITY_SHIFT: "你的身份会有变化",
  MAINLINE_ALIGNMENT: "你做的事和主线对上了",
  MAINLINE_DEVIATION: "你正在偏离主线",
  LOCATION_SUPPORT: "现在的环境在帮你",
  LOCATION_BLOCK: "现在的地方在拖你",
  ADMIN_APPROVAL: "手续会通过",
  ADMIN_DELAY: "手续会被拖",
  CHAOS_RISK: "近期会有意外乱流",
  FALSE_SIGNAL_EVENT: "这可能是个假信号",
};

/** 伪表现/噪声混淆映射：仅补字段，不新增事件。供回验区分真伪信号 */
const FALSE_MANIFESTATIONS: Record<string, string[]> = {
  CAREER_OPENING: ["客套式询问", "猎头群发扫描", "未确认的口头机会"],
  CAREER_BLOCKED: ["对方正常休假", "节假日流程延迟", "情绪投射的卡顿感"],
  PRODUCT_ACTIVATION: ["自己反复测试的点击", "Demo 数据被当真实使用", "一次性好奇访问"],
  PRODUCT_ITERATION: ["反复改 UI 但未改核心", "把重构当迭代", "Scope drift 伪进度"],
  PRODUCT_RELEASE_WINDOW: ["内部兴奋当外部就绪", "Demo 可讲 ≠ Real 可用", "回验未完成强发"],
  RESOURCE_INFLOW: ["口头承诺未签约", "预期收入当已到账", "退款被记为流入"],
  RESOURCE_DRAIN: ["一次性大额支出误读为长期", "正常成本被当流失"],
  MONEY_PRESSURE: ["情绪化财务焦虑", "对比他人产生的相对压力", "短期账期错位"],
  RELATIONSHIP_WARMING: ["礼貌回应", "群聊高频但无私聊", "节日性问候"],
  RELATIONSHIP_COOLING: ["对方临时忙碌", "通讯故障", "自身低能量期投射"],
  RELATIONSHIP_CONFIRMATION: ["醉后表达", "节日氛围下的承诺", "未清醒复述的口头确认"],
  RELATIONSHIP_DISTORTION: ["把礼貌当兴趣", "把忙碌当冷淡", "模糊回应当默认同意"],
  HUMAN_VARIABLE_APPEARS: ["弱连接寒暄", "点赞收藏", "AI/自动化触达"],
  HUMAN_VARIABLE_MISSING: ["对方仅延迟回复", "渠道错位失联", "时差造成的假性缺位"],
  STUDY_SIGNAL: ["系统自动邮件", "群发通知", "模板化回复"],
  APPLICATION_RESPONSE: ["阶段性进度更新", "waitlist 被误读为录取"],
  HEALTH_RECOVERY_UP: ["咖啡因伪精力", "情绪高潮期的伪恢复"],
  HEALTH_OVERLOAD: ["短期一次性疲劳", "心理压力身体化感知"],
  COGNITIVE_BOOST: ["夜间情绪化输出", "AI 协助下的虚假清晰感", "未验证的灵感堆积"],
  COGNITIVE_LIMITING: ["短期睡眠不足", "情绪低落的暂时迟钝"],
  PLASTICITY_GENERATION: ["旧结构微调", "换皮不换核"],
  CREATIVE_BURST: ["夜间情绪化产出", "AI 生成被当原创爆发", "未完成的灵感碎片"],
  CREATIVE_BLOCK: ["短期休息期", "切换形式的过渡停滞"],
  IDENTITY_SHIFT: ["头衔变化但实质未变", "改 bio 当身份转折"],
  MAINLINE_ALIGNMENT: ["短期收益对齐主线的错觉", "情绪满足当主线对齐"],
  MAINLINE_DEVIATION: ["短期试错被误判为偏离", "正常迂回路径当偏离"],
  LOCATION_SUPPORT: ["旅行兴奋期伪支持感", "新鲜感当地理收益"],
  LOCATION_BLOCK: ["天气/时差造成的临时不适", "情绪低谷投射环境"],
  ADMIN_APPROVAL: ["阶段性受理回执 ≠ 通过", "系统自动确认"],
  ADMIN_DELAY: ["正常审核周期当延迟", "节假日非异常等待"],
  CHAOS_RISK: ["日常小摩擦", "情绪化预感", "未落地的传闻"],
  FALSE_SIGNAL_EVENT: ["巧合", "确认偏误", "事后归因", "梦境/直觉未经回验"],
};

export const EVENT_ALGORITHMS: EventAlgorithm[] = [
  { id: "CAREER_OPENING", name: "事业窗口打开", en: "Career Opening", dimensionId: "CAREER",
    positiveOrNegative: "POSITIVE",
    baseFormula: "TriggerStrength × DomainAlign(di,shen) × Determination ÷ Noise",
    requiredSignals: ["共振锁定", "外部询问"], blockingSignals: ["人物缺位", "场域阻断"],
    actionPermissions: ["进", "回应", "整理材料"],
    validationSignals: ["收到合作消息", "面试推进", "正式回复"],
    feedbackMetrics: ["事件命中", "时间窗口"] },
  { id: "CAREER_BLOCKED", name: "事业阻滞", en: "Career Blocked", dimensionId: "CAREER",
    positiveOrNegative: "NEGATIVE",
    baseFormula: "Noise × FieldBlock × MissingHumanVariable",
    requiredSignals: ["反复延迟", "回应中断"], blockingSignals: [],
    actionPermissions: ["守", "降载", "等待"],
    validationSignals: ["进度停滞", "通讯无回应"],
    feedbackMetrics: ["阻滞确认", "持续时间"] },
  { id: "PRODUCT_ACTIVATION", name: "产品活性启动", en: "Product Activation", dimensionId: "PRODUCT",
    positiveOrNegative: "POSITIVE",
    baseFormula: "ProductVitality × SignalQuality × TriggerStrength",
    requiredSignals: ["用户打开", "Demo 可讲"], blockingSignals: ["Demo/Real 未隔离"],
    actionPermissions: ["进", "记录", "回验"],
    validationSignals: ["用户点击", "Demo 可解释"],
    feedbackMetrics: ["活性提升", "回验数据"] },
  { id: "PRODUCT_ITERATION", name: "产品迭代", en: "Product Iteration", dimensionId: "PRODUCT",
    positiveOrNegative: "POSITIVE",
    baseFormula: "FeedbackWeight × PromptCalculus × Determination",
    requiredSignals: ["有效反馈", "明确目标"], blockingSignals: ["Scope drift"],
    actionPermissions: ["迭代", "重构", "降噪"],
    validationSignals: ["功能闭环", "QA 无 CRITICAL"],
    feedbackMetrics: ["迭代完成度"] },
  { id: "PRODUCT_RELEASE_WINDOW", name: "产品发布窗口", en: "Product Release Window", dimensionId: "PRODUCT",
    positiveOrNegative: "POSITIVE",
    baseFormula: "ProductVitality × Determination × BranchCollapse",
    requiredSignals: ["回验数据足", "Demo 隔离完成"], blockingSignals: ["定数=假定", "UI Fit < 70"],
    actionPermissions: ["发布", "邀请内测", "记录"],
    validationSignals: ["内测反馈", "点击/使用"],
    feedbackMetrics: ["发布命中", "回验完成率"] },
  { id: "RESOURCE_INFLOW", name: "资源流入", en: "Resource Inflow", dimensionId: "FINANCE",
    positiveOrNegative: "POSITIVE",
    baseFormula: "DomainAlign(di) × Resonance × Determination",
    requiredSignals: ["进账信号", "订单确认"], blockingSignals: ["承诺过早"],
    actionPermissions: ["接收", "整理"],
    validationSignals: ["资金到账", "资源落地"],
    feedbackMetrics: ["金额命中", "时间命中"] },
  { id: "RESOURCE_DRAIN", name: "资源流失", en: "Resource Drain", dimensionId: "FINANCE",
    positiveOrNegative: "NEGATIVE",
    baseFormula: "Noise × FieldBlock ÷ Carry",
    requiredSignals: ["持续支出", "现金流紧"], blockingSignals: [],
    actionPermissions: ["守", "断", "降载"],
    validationSignals: ["支出/账期"],
    feedbackMetrics: ["损失规模"] },
  { id: "MONEY_PRESSURE", name: "财务压力", en: "Money Pressure", dimensionId: "FINANCE",
    positiveOrNegative: "NEGATIVE",
    baseFormula: "Pressure × ResourceDrain ÷ Carry",
    requiredSignals: ["现金流紧", "应付到期"], blockingSignals: [],
    actionPermissions: ["守", "沟通", "重排优先级"],
    validationSignals: ["实际支出", "心理压力"],
    feedbackMetrics: ["压力等级"] },
  { id: "RELATIONSHIP_WARMING", name: "关系升温", en: "Relationship Warming", dimensionId: "RELATIONSHIP",
    positiveOrNegative: "POSITIVE",
    baseFormula: "Resonance × DomainAlign(ren,feng) × SignalQuality",
    requiredSignals: ["对方主动", "频率上升"], blockingSignals: ["噪声/误读"],
    actionPermissions: ["沟通", "见面", "等待"],
    validationSignals: ["主动联系", "私人化内容"],
    feedbackMetrics: ["关系强度变化"] },
  { id: "RELATIONSHIP_COOLING", name: "关系降温", en: "Relationship Cooling", dimensionId: "RELATIONSHIP",
    positiveOrNegative: "NEGATIVE",
    baseFormula: "Noise × MissingHumanVariable ÷ Resonance",
    requiredSignals: ["回复延迟", "态度变冷"], blockingSignals: [],
    actionPermissions: ["守", "降载", "保持距离"],
    validationSignals: ["互动减少"],
    feedbackMetrics: ["降温幅度"] },
  { id: "RELATIONSHIP_CONFIRMATION", name: "关系确认", en: "Relationship Confirmation", dimensionId: "RELATIONSHIP",
    positiveOrNegative: "POSITIVE",
    baseFormula: "Determination × Resonance × BranchCollapse",
    requiredSignals: ["明确表达", "线下确认"], blockingSignals: ["定数=假定"],
    actionPermissions: ["确认", "记录"],
    validationSignals: ["双方一致表述"],
    feedbackMetrics: ["确认达成"] },
  { id: "RELATIONSHIP_DISTORTION", name: "关系误读", en: "Relationship Distortion", dimensionId: "RELATIONSHIP",
    positiveOrNegative: "NEGATIVE",
    baseFormula: "Noise ÷ SignalQuality",
    requiredSignals: ["主观投射强", "信号薄弱"], blockingSignals: [],
    actionPermissions: ["降载", "信号净化"],
    validationSignals: ["事后回验"],
    feedbackMetrics: ["误读次数"] },
  { id: "HUMAN_VARIABLE_APPEARS", name: "关键人物出现", en: "Key Person Appears", dimensionId: "SOCIAL_NETWORK",
    positiveOrNegative: "POSITIVE",
    baseFormula: "Resonance × DomainAlign(ren) × Trigger",
    requiredSignals: ["旧友联络", "弱连接激活"], blockingSignals: [],
    actionPermissions: ["回应", "主动连接"],
    validationSignals: ["新人物推进项目"],
    feedbackMetrics: ["人物到位"] },
  { id: "HUMAN_VARIABLE_MISSING", name: "关键人物未到", en: "Key Person Missing", dimensionId: "SOCIAL_NETWORK",
    positiveOrNegative: "NEGATIVE",
    baseFormula: "MissingHumanVariable × FieldBlock",
    requiredSignals: ["无人推进", "联络失败"], blockingSignals: [],
    actionPermissions: ["等待", "补人"],
    validationSignals: ["人物到位时间"],
    feedbackMetrics: ["延迟天数"] },
  { id: "STUDY_SIGNAL", name: "学业/申请信号", en: "Study/Application Signal", dimensionId: "STUDY_APPLICATION",
    positiveOrNegative: "POSITIVE",
    baseFormula: "DomainAlign(di,shen) × Determination",
    requiredSignals: ["官方更新", "教授回复"], blockingSignals: ["材料缺失"],
    actionPermissions: ["补材料", "回应"],
    validationSignals: ["材料状态", "面试邀请"],
    feedbackMetrics: ["申请进度"] },
  { id: "APPLICATION_RESPONSE", name: "申请反馈", en: "Application Response", dimensionId: "STUDY_APPLICATION",
    positiveOrNegative: "MIXED",
    baseFormula: "Determination × ExternalReply",
    requiredSignals: ["正式邮件", "结果通知"], blockingSignals: [],
    actionPermissions: ["接受", "申诉", "调整"],
    validationSignals: ["录取/拒信"],
    feedbackMetrics: ["结果方向"] },
  { id: "HEALTH_RECOVERY_UP", name: "身体恢复上升", en: "Health Recovery Up", dimensionId: "HEALTH_RECOVERY",
    positiveOrNegative: "POSITIVE",
    baseFormula: "Rebound × Carry ÷ Pressure",
    requiredSignals: ["睡眠改善", "运动欲恢复"], blockingSignals: ["持续过载"],
    actionPermissions: ["恢复", "轻度训练"],
    validationSignals: ["睡眠/能量"],
    feedbackMetrics: ["恢复度"] },
  { id: "HEALTH_OVERLOAD", name: "身体过载", en: "Health Overload", dimensionId: "HEALTH_RECOVERY",
    positiveOrNegative: "NEGATIVE",
    baseFormula: "Pressure × Noise ÷ Carry",
    requiredSignals: ["持续疲劳", "睡眠崩"], blockingSignals: [],
    actionPermissions: ["降载", "休息"],
    validationSignals: ["体感", "情绪稳定度"],
    feedbackMetrics: ["过载等级"] },
  { id: "COGNITIVE_BOOST", name: "认知调用上升", en: "Cognitive Boost", dimensionId: "COGNITION",
    positiveOrNegative: "POSITIVE",
    baseFormula: "DomainAlign(shen,feng) × Plasticity × Determination",
    requiredSignals: ["输出加速", "新结构生成"], blockingSignals: ["过载"],
    actionPermissions: ["外化", "记录"],
    validationSignals: ["新计算法", "判断稳定"],
    feedbackMetrics: ["认知输出"] },
  { id: "COGNITIVE_LIMITING", name: "认知限流", en: "Cognitive Limiting", dimensionId: "COGNITION",
    positiveOrNegative: "NEGATIVE",
    baseFormula: "Noise × Overload ÷ Plasticity",
    requiredSignals: ["判断迟钝", "输出阻滞"], blockingSignals: [],
    actionPermissions: ["休息", "降载"],
    validationSignals: ["输出速度"],
    feedbackMetrics: ["限流强度"] },
  { id: "PLASTICITY_GENERATION", name: "可塑性生成", en: "Plasticity Generation", dimensionId: "COGNITION",
    positiveOrNegative: "POSITIVE",
    baseFormula: "Recovery × Creation × DomainAlign(shen)",
    requiredSignals: ["新连接", "新模型"], blockingSignals: [],
    actionPermissions: ["创作", "外化"],
    validationSignals: ["输出新结构"],
    feedbackMetrics: ["生成数量"] },
  { id: "CREATIVE_BURST", name: "创作爆发", en: "Creative Burst", dimensionId: "CREATION",
    positiveOrNegative: "POSITIVE",
    baseFormula: "Plasticity × Trigger × Resonance",
    requiredSignals: ["灵感密度高"], blockingSignals: ["阻滞"],
    actionPermissions: ["创作", "记录", "发布"],
    validationSignals: ["作品产出"],
    feedbackMetrics: ["产出量"] },
  { id: "CREATIVE_BLOCK", name: "创作阻滞", en: "Creative Block", dimensionId: "CREATION",
    positiveOrNegative: "NEGATIVE",
    baseFormula: "Noise × Overload ÷ Plasticity",
    requiredSignals: ["产出停滞"], blockingSignals: [],
    actionPermissions: ["休息", "降载", "换形式"],
    validationSignals: ["产出量"],
    feedbackMetrics: ["阻滞时长"] },
  { id: "IDENTITY_SHIFT", name: "身份转折", en: "Identity Shift", dimensionId: "IDENTITY",
    positiveOrNegative: "MIXED",
    baseFormula: "BranchCollapse × Mainline × Determination",
    requiredSignals: ["公开身份变化"], blockingSignals: ["定数=反定"],
    actionPermissions: ["确认", "转向"],
    validationSignals: ["他人称呼变化"],
    feedbackMetrics: ["身份稳定度"] },
  { id: "MAINLINE_ALIGNMENT", name: "主线对齐", en: "Mainline Alignment", dimensionId: "SPIRIT_MAINLINE",
    positiveOrNegative: "POSITIVE",
    baseFormula: "DomainAlign(shen) × Determination",
    requiredSignals: ["决策与主线一致"], blockingSignals: [],
    actionPermissions: ["进", "对齐"],
    validationSignals: ["主线推进事件"],
    feedbackMetrics: ["对齐度"] },
  { id: "MAINLINE_DEVIATION", name: "主线偏离", en: "Mainline Deviation", dimensionId: "SPIRIT_MAINLINE",
    positiveOrNegative: "NEGATIVE",
    baseFormula: "Noise ÷ DomainAlign(shen)",
    requiredSignals: ["短期诱饵"], blockingSignals: [],
    actionPermissions: ["回归", "降载"],
    validationSignals: ["偏离事件"],
    feedbackMetrics: ["偏离幅度"] },
  { id: "LOCATION_SUPPORT", name: "地理支持", en: "Location Support", dimensionId: "LOCATION",
    positiveOrNegative: "POSITIVE",
    baseFormula: "GeoFactor × DomainAlign(di,feng)",
    requiredSignals: ["环境推进", "迁移机会"], blockingSignals: [],
    actionPermissions: ["前往", "驻留"],
    validationSignals: ["地点变化", "场域反馈"],
    feedbackMetrics: ["地理收益"] },
  { id: "LOCATION_BLOCK", name: "地理阻断", en: "Location Block", dimensionId: "LOCATION",
    positiveOrNegative: "NEGATIVE",
    baseFormula: "FieldBlock × NegativeGeo",
    requiredSignals: ["环境不承载"], blockingSignals: [],
    actionPermissions: ["离开", "重选"],
    validationSignals: ["地点反馈"],
    feedbackMetrics: ["阻断程度"] },
  { id: "ADMIN_APPROVAL", name: "制度通过", en: "Admin Approval", dimensionId: "LEGAL_ADMIN",
    positiveOrNegative: "POSITIVE",
    baseFormula: "DomainAlign(di) × Determination",
    requiredSignals: ["官方回执"], blockingSignals: ["材料缺失"],
    actionPermissions: ["接收", "执行"],
    validationSignals: ["审核通过"],
    feedbackMetrics: ["通过时间"] },
  { id: "ADMIN_DELAY", name: "制度延迟", en: "Admin Delay", dimensionId: "LEGAL_ADMIN",
    positiveOrNegative: "NEGATIVE",
    baseFormula: "FieldBlock × Bureaucracy",
    requiredSignals: ["审核停滞"], blockingSignals: [],
    actionPermissions: ["等待", "补充"],
    validationSignals: ["审核状态"],
    feedbackMetrics: ["延迟天数"] },
  { id: "CHAOS_RISK", name: "乱流风险", en: "Chaos Risk", dimensionId: "RISK_CHAOS",
    positiveOrNegative: "NEGATIVE",
    baseFormula: "Noise × Pressure × BranchCollapseInstability",
    requiredSignals: ["突发", "冲突"], blockingSignals: [],
    actionPermissions: ["守", "断", "降载"],
    validationSignals: ["事件是否落地"],
    feedbackMetrics: ["乱流强度"] },
  { id: "FALSE_SIGNAL_EVENT", name: "伪信号事件", en: "False Signal", dimensionId: "RISK_CHAOS",
    positiveOrNegative: "NEUTRAL",
    baseFormula: "SignalQualityLow × DeterminationAssumed",
    requiredSignals: ["定数=假定", "信号薄弱"], blockingSignals: [],
    actionPermissions: ["守", "信号净化"],
    validationSignals: ["事后未发生"],
    feedbackMetrics: ["伪信号率"] },
];

export function getEventAlgorithm(id: string): EventAlgorithm | undefined {
  const direct = EVENT_ALGORITHMS.find((e) => e.id === id);
  if (direct) return direct;
  // 通过 alias 回退查找（保留旧 eventId 的回验记录）
  return EVENT_ALGORITHMS.find((e) => e.alias?.includes(id));
}

/** 把任意（可能是旧/同义/弃用）eventId 解析为当前 primary eventId */
export function resolvePrimaryEventId(id: string): string {
  const e = getEventAlgorithm(id);
  if (!e) return id;
  if (e.mergedInto) return e.mergedInto;
  return e.id;
}

export function getEventsByDimension(dim: PredictionDimensionId): EventAlgorithm[] {
  return EVENT_ALGORITHMS.filter((e) => e.dimensionId === dim && !e.deprecated);
}

// ============= 批量扩展：合并新增事件（不覆盖已有 eventId）=============
// 通过延迟 require 避免循环引用；扩展事件来自 eventLibraryExtension.ts
import NEW_EVENTS_FROM_EXTENSION from "./eventLibraryExtension";
import { fillEventDefaults } from "@/lib/eventBulkFieldFiller";

const EXISTING_IDS = new Set(EVENT_ALGORITHMS.map((e) => e.id));
NEW_EVENTS_FROM_EXTENSION.forEach((ev) => {
  if (!EXISTING_IDS.has(ev.id)) {
    EVENT_ALGORITHMS.push(ev);
    EXISTING_IDS.add(ev.id);
  }
});

// 注入 userFriendlyName + falseManifestations（不破坏现有 eventId）
EVENT_ALGORITHMS.forEach((e) => {
  if (!e.userFriendlyName && USER_FRIENDLY_NAMES[e.id]) {
    e.userFriendlyName = USER_FRIENDLY_NAMES[e.id];
  }
  if ((!e.falseManifestations || e.falseManifestations.length === 0) && FALSE_MANIFESTATIONS[e.id]) {
    e.falseManifestations = FALSE_MANIFESTATIONS[e.id];
  }
});

// ============= 批量字段补齐：按维度模板回填所有事件缺失字段 =============
EVENT_ALGORITHMS.forEach((e) => fillEventDefaults(e));

// 预留 alias：未来出现 PRODUCT_LAUNCH_WINDOW 时直接归并到 PRODUCT_RELEASE_WINDOW
const release = EVENT_ALGORITHMS.find((e) => e.id === "PRODUCT_RELEASE_WINDOW");
if (release && !release.alias) release.alias = ["PRODUCT_LAUNCH_WINDOW", "PRODUCT_LAUNCH"];

// 父子簇：MONEY_PRESSURE 是 RESOURCE_DRAIN 的下位现象
const moneyPressure = EVENT_ALGORITHMS.find((e) => e.id === "MONEY_PRESSURE");
if (moneyPressure) moneyPressure.parentEventId = "RESOURCE_DRAIN";

// 近义簇：CHAOS_RISK ↔ FALSE_SIGNAL_EVENT
const chaos = EVENT_ALGORITHMS.find((e) => e.id === "CHAOS_RISK");
const falseSig = EVENT_ALGORITHMS.find((e) => e.id === "FALSE_SIGNAL_EVENT");
if (chaos) chaos.relatedEventIds = ["FALSE_SIGNAL_EVENT"];
if (falseSig) falseSig.relatedEventIds = ["CHAOS_RISK"];

// 同一父事件下的子事件双向引用
const resourceDrain = EVENT_ALGORITHMS.find((e) => e.id === "RESOURCE_DRAIN");
if (resourceDrain) resourceDrain.relatedEventIds = ["MONEY_PRESSURE"];

// 反向回填 childEventIds（基于 parentEventId）
EVENT_ALGORITHMS.forEach((e) => {
  if (e.parentEventId) {
    const parent = EVENT_ALGORITHMS.find((p) => p.id === e.parentEventId);
    if (parent) {
      parent.childEventIds = parent.childEventIds ?? [];
      if (!parent.childEventIds.includes(e.id)) parent.childEventIds.push(e.id);
    }
  }
});

/** 返回事件的所有子事件（基于 parentEventId 反向查找） */
export function getChildEvents(parentId: string): EventAlgorithm[] {
  return EVENT_ALGORITHMS.filter((e) => e.parentEventId === parentId);
}


