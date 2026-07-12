// 事件字段批量回填引擎 — Event Bulk Field Filler
// 对每个事件按维度模板补齐：actionLanguage / microcopy / subtle/typical/strong/falseManifestations
// / riskSignals / recommendedFeedbackFields / relatedActionPermissions
// 原则：仅在字段缺失时补齐；不覆盖已有内容。
import type { EventAlgorithm } from "@/constants/eventAlgorithmTypes";
import type { PredictionDimensionId } from "@/constants/predictionDimensions";

interface DimensionTemplate {
  subtle: string[];
  typical: string[];
  strong: string[];
  false: string[];
  validation: string[];
  risk: string[];
  feedbackFields: string[];
  actions: string[];
  actionLanguageHint: string;
}

const DIMENSION_TEMPLATES: Record<PredictionDimensionId, DimensionTemplate> = {
  CAREER: {
    subtle: ["对方读了消息没回", "招聘/猎头信息变密", "项目讨论里出现你的名字"],
    typical: ["收到合作邀约", "面试/复试推进", "项目里被委派关键任务", "外部评价转正面"],
    strong: ["正式 Offer/合同", "晋升/调薪公布", "项目被上层立项"],
    false: ["猎头泛泛而问", "客套式询问", "节假日流程延迟造成的伪卡顿"],
    validation: ["是否收到正式回应", "是否进入下一阶段", "是否落地为合同/项目", "外部评价是否持续上升"],
    risk: ["关键人物缺位", "材料/方案未备齐", "上层未对齐"],
    feedbackFields: ["事件是否发生", "时间窗口是否对", "是否带来下一步行动"],
    actions: ["进", "守", "转"],
    actionLanguageHint: "建议主动跟进关键人，准备好可量化材料，避免在窗口期被动等待。",
  },
  PRODUCT: {
    subtle: ["内测用户主动问进度", "Demo 被反复打开", "出现首批自发使用"],
    typical: ["用户提出有效反馈", "功能形成闭环", "提示词/模块被复用"],
    strong: ["回验数据持续累积", "出现付费/续费", "外部传播自发发生"],
    false: ["短期点击高但无回验", "Demo 数据当真实使用", "内部兴奋当外部就绪"],
    validation: ["有效用户行为是否上升", "Demo/Real 是否清晰隔离", "QA 是否无 CRITICAL", "回验完成率"],
    risk: ["Scope drift", "定数=假定", "Demo/Real 混淆", "UI Fit 不足"],
    feedbackFields: ["点击/使用", "用户评论", "复用次数", "付费意愿", "需要修复点"],
    actions: ["发布", "修复", "迭代", "降噪"],
    actionLanguageHint: "建议小步发布并立即回验，先做闭环再扩范围，不在数据未稳前做长期承诺。",
  },
  RELATIONSHIP: {
    subtle: ["回复变快/变慢", "出现试探性话题", "对方记得你说过的小事"],
    typical: ["主动联系频率上升", "进入私人化话题", "出现线下/语音机会"],
    strong: ["明确表达关系定位", "公开/共同场合出现", "做出长期安排"],
    false: ["礼貌回应", "醉后/情绪化表达", "节日性问候", "群发寒暄"],
    validation: ["主动率是否上升", "私人化程度", "线下/语音是否落地", "是否被第三方目击"],
    risk: ["误读", "情绪噪声", "时间错位", "边界不清"],
    feedbackFields: ["事件是否发生", "对方主动度", "你的误读次数", "下一步是否清晰"],
    actions: ["沟通", "等待", "确认"],
    actionLanguageHint: "建议保持小步确认与边界感，先回验再升级，不把短期靠近当长期承诺。",
  },
  FINANCE: {
    subtle: ["小额到账", "新询单出现", "成本结构变化"],
    typical: ["合同推进", "进/出账规模上升", "现金流出现拐点"],
    strong: ["大额到账/支出", "签约/退款", "现金流断裂或翻倍"],
    false: ["口头承诺未签约", "一次性大额误读为长期", "情绪化财务焦虑"],
    validation: ["实际进/出账", "金额是否吻合", "时间是否吻合", "是否有书面"],
    risk: ["过早承诺", "成本未计", "现金流断裂"],
    feedbackFields: ["金额命中", "时间命中", "是否有附带条件"],
    actions: ["守", "断", "接收"],
    actionLanguageHint: "建议先以书面/到账为准，保留缓冲，不在波动日做长期承诺。",
  },
  STUDY_APPLICATION: {
    subtle: ["系统状态更新", "材料被查看", "教授回复变快"],
    typical: ["面试邀约", "材料补全请求", "进入下一轮"],
    strong: ["录取/拒信", "奖学金确认", "推荐人正式发信"],
    false: ["系统自动邮件", "waitlist 被误读为录取", "群发通知"],
    validation: ["官方回执", "下一步说明", "材料齐全度", "推荐人到位"],
    risk: ["材料缺失", "DDL 错过", "推荐人延迟"],
    feedbackFields: ["阶段进度", "是否需要补材料", "时间窗口"],
    actions: ["补材料", "回应", "等待"],
    actionLanguageHint: "建议优先补材料、对齐 DDL，对系统自动信号保留判断。",
  },
  HEALTH_RECOVERY: {
    subtle: ["疲劳恢复变快/变慢", "情绪起伏变化", "食欲变化"],
    typical: ["睡眠时长/质量明显改变", "运动欲恢复或下降", "注意力变化"],
    strong: ["连续 3 日体感稳定", "出现明显疾病信号", "需要就医"],
    false: ["咖啡因伪精力", "短期情绪高潮的伪恢复", "一次性疲劳"],
    validation: ["睡眠质量", "运动量", "情绪稳定度", "体感信号"],
    risk: ["持续过载", "睡眠不足", "兴奋剂依赖"],
    feedbackFields: ["睡眠分", "运动频次", "精神状态", "身体信号"],
    actions: ["恢复", "降载", "休息"],
    actionLanguageHint: "建议优先恢复，把睡眠和能量当成本指标，不在过载期硬推产出。",
  },
  COGNITION: {
    subtle: ["旧问题忽然有新角度", "调用速度变化"],
    typical: ["生成新结构/算法", "外化速度加快", "判断稳定度提升"],
    strong: ["跨域结构闭合", "新算法被复用", "深度工作连续完成"],
    false: ["夜间情绪化输出", "AI 协助下的虚假清晰感", "未验证的灵感堆积"],
    validation: ["新结构生成", "输出速度", "判断稳定度", "复用度"],
    risk: ["过载", "决策疲劳", "多巴胺不足"],
    feedbackFields: ["清晰度", "输出量", "疲劳等级", "新算法生成"],
    actions: ["外化", "记录", "降载"],
    actionLanguageHint: "建议立刻外化、记录、降载，不让认知爆发停留在脑内消耗。",
  },
  CREATION: {
    subtle: ["灵感密度上升", "形式切换冲动出现"],
    typical: ["完成单件作品", "受众有效反馈", "可发布物形成"],
    strong: ["连续高产", "受众主动转发", "进入发布窗口"],
    false: ["夜间情绪化产出", "AI 生成被当原创爆发", "完美主义自我拖延"],
    validation: ["作品产出", "他人反馈", "复用度"],
    risk: ["阻滞", "完美主义", "自我怀疑"],
    feedbackFields: ["产出量", "受众反馈", "发布完成"],
    actions: ["创作", "发布", "记录"],
    actionLanguageHint: "建议在窗口期优先完成与发布，不在状态低谷强行产出。",
  },
  IDENTITY: {
    subtle: ["反复修改自我介绍", "出现新角色称呼"],
    typical: ["公开身份发生变化", "他人称呼随之改变"],
    strong: ["公开发布新定位", "新身份被关键人确认"],
    false: ["头衔变化但实质未变", "改 bio 当身份转折"],
    validation: ["新身份被关键人识别", "自我表述稳定"],
    risk: ["角色过载", "身份混乱", "外界标签干扰"],
    feedbackFields: ["新定位是否被记住", "他人称呼是否同步"],
    actions: ["确认", "转向", "记录"],
    actionLanguageHint: "建议把新身份显式写下并对外讲清，不在过渡期承担旧角色义务。",
  },
  LOCATION: {
    subtle: ["对当前环境烦躁度上升/下降", "新地点反复浮现"],
    typical: ["短期出差/搬家讨论", "本地圈子密度变化"],
    strong: ["搬迁动作落地", "环境带来明显能量变化"],
    false: ["旅行兴奋期伪支持感", "天气/时差造成的临时不适"],
    validation: ["环境反馈", "状态变化", "新地点动作"],
    risk: ["场域不承载", "迁移成本"],
    feedbackFields: ["环境影响", "迁移决策"],
    actions: ["驻留", "迁移", "勘察"],
    actionLanguageHint: "建议先做短期勘察，不在过渡期同时启动多个变量。",
  },
  SOCIAL_NETWORK: {
    subtle: ["弱连接评论/点赞", "旧群组活跃"],
    typical: ["新人物加入会话", "贵人主动指点", "推荐线索出现"],
    strong: ["多人独立推荐同一机会", "关键人物推进具体事"],
    false: ["客套寒暄", "无后续的弱触达"],
    validation: ["是否带来具体动作", "推荐转化率"],
    risk: ["弱连接未激活", "无效社交", "背叛风险"],
    feedbackFields: ["人物到位", "连接转化", "社交疲劳"],
    actions: ["主动连接", "回应", "等待"],
    actionLanguageHint: "建议优先回应已激活连接，过滤无效社交，避免被消耗。",
  },
  FAMILY_LIFE: {
    subtle: ["家中节律微妙变化", "家人提及频次变化"],
    typical: ["家庭沟通密度变化", "出现居住/责任讨论"],
    strong: ["家庭事件发生", "居住安排实质变动"],
    false: ["情绪化家庭归因", "节假日临时波动"],
    validation: ["家庭事件是否发生", "新节奏稳定度"],
    risk: ["责任过载", "节律紊乱"],
    feedbackFields: ["家庭事件", "居住变化"],
    actions: ["守", "沟通", "规划"],
    actionLanguageHint: "建议先稳定节律，再处理结构性变动。",
  },
  LEGAL_ADMIN: {
    subtle: ["收到流程提示", "出现合规问询"],
    typical: ["审核进入下一阶段", "需要补充材料", "合同条款定稿"],
    strong: ["正式批准/拒绝", "合同签署/争议升级"],
    false: ["阶段性受理回执 ≠ 通过", "正常审核周期当延迟"],
    validation: ["官方回执", "审核状态", "合同/裁定结果"],
    risk: ["材料缺失", "政策变更", "合规暴露"],
    feedbackFields: ["流程进度", "通过时间", "合规度"],
    actions: ["等待", "补充", "回应"],
    actionLanguageHint: "建议按官方节奏推进，先补全材料再申诉。",
  },
  SPIRIT_MAINLINE: {
    subtle: ["对长期方向出现新感觉", "象征性意象重现"],
    typical: ["关键事件触动主线感", "价值排序开始变动"],
    strong: ["主线被一句话说清", "做出长期一致的决策"],
    false: ["短期收益对齐主线的错觉", "情绪满足当主线对齐"],
    validation: ["主线再确认", "决策与主线一致度"],
    risk: ["被短期信号牵走", "存在性怀疑"],
    feedbackFields: ["主线清晰度", "决策一致度"],
    actions: ["对齐", "回归", "记录"],
    actionLanguageHint: "建议把主线显式写下，对短期诱饵保持距离。",
  },
  RISK_CHAOS: {
    subtle: ["小冲突", "信息混乱", "情绪起伏"],
    typical: ["意外延迟", "误解", "传闻扩散"],
    strong: ["突发危机", "复合冲突"],
    false: ["焦虑投射", "灾难化想象", "未落地的传闻", "情绪化预感"],
    validation: ["事件是否落地", "48h 后是否仍然成立", "是否被识别为伪信号"],
    risk: ["噪声主导", "误判塌缩", "过度反应"],
    feedbackFields: ["实际是否发生", "是否误判", "情绪状态"],
    actions: ["守", "断", "降载"],
    actionLanguageHint: "建议不在乱流中做长期决策，先降速再回验。",
  },
  PROMPT_TOOLING: {
    subtle: ["工具一次出对样本", "Prompt 微调即可用"],
    typical: ["生成可发布产物", "模板跨场景复用", "工具完成多步链路"],
    strong: ["新提示词被沉淀为标准", "工具自动闭环"],
    false: ["语气笃定但事实错", "Scope drift 伪进度", "构建失败被误读为接近成功"],
    validation: ["输出是否可用", "复用次数", "构建成功率", "回验数据"],
    risk: ["Prompt 漂移", "上下文丢失", "构建失败循环"],
    feedbackFields: ["输出质量", "是否完成修改", "需要二次修复"],
    actions: ["生成提示词", "修复", "缩小范围", "重算"],
    actionLanguageHint: "建议小步生成 + 立刻回验，发现漂移立刻收敛范围，不堆长链。",
  },
};

function pickN<T>(arr: T[] | undefined, n: number): T[] {
  if (!arr) return [];
  return arr.slice(0, n);
}

function dedupe(a: string[], b: string[]): string[] {
  const set = new Set<string>(a);
  b.forEach((x) => set.add(x));
  return Array.from(set);
}

/** 为单个事件批量补齐标准字段（仅在缺失时补） */
export function fillEventDefaults(e: EventAlgorithm): EventAlgorithm {
  const tpl = DIMENSION_TEMPLATES[e.dimensionId as PredictionDimensionId];
  if (!tpl) return e;

  if (!e.userFriendlyName) e.userFriendlyName = e.name;
  if (!e.actionLanguage) e.actionLanguage = tpl.actionLanguageHint;
  if (!e.microcopy) e.microcopy = e.userFriendlyName ?? e.name;
  if (!e.subtleManifestations || e.subtleManifestations.length < 3) {
    e.subtleManifestations = dedupe(e.subtleManifestations ?? [], pickN(tpl.subtle, 4));
  }
  if (!e.typicalManifestations || e.typicalManifestations.length < 4) {
    e.typicalManifestations = dedupe(e.typicalManifestations ?? [], pickN(tpl.typical, 5));
  }
  if (!e.strongManifestations || e.strongManifestations.length < 3) {
    e.strongManifestations = dedupe(e.strongManifestations ?? [], pickN(tpl.strong, 4));
  }
  if (!e.falseManifestations || e.falseManifestations.length < 3) {
    e.falseManifestations = dedupe(e.falseManifestations ?? [], pickN(tpl.false, 4));
  }
  if (!e.riskSignals || e.riskSignals.length < 3) {
    e.riskSignals = dedupe(e.riskSignals ?? [], dedupe(e.blockingSignals ?? [], tpl.risk));
  }
  if (!e.recommendedFeedbackFields || e.recommendedFeedbackFields.length < 3) {
    e.recommendedFeedbackFields = dedupe(
      e.recommendedFeedbackFields ?? [],
      dedupe(e.feedbackMetrics ?? [], tpl.feedbackFields),
    );
  }
  if (!e.relatedActionPermissions || e.relatedActionPermissions.length < 2) {
    e.relatedActionPermissions = dedupe(
      e.relatedActionPermissions ?? [],
      dedupe(e.actionPermissions ?? [], tpl.actions),
    );
  }
  // 补充 validationSignals 下限
  if (!e.validationSignals || e.validationSignals.length < 4) {
    e.validationSignals = dedupe(e.validationSignals ?? [], tpl.validation);
  }
  return e;
}

export function bulkFillAll(events: EventAlgorithm[]): {
  filledCount: number;
  filledFieldsTotal: number;
} {
  let filledFieldsTotal = 0;
  let filledCount = 0;
  const FIELDS: (keyof EventAlgorithm)[] = [
    "userFriendlyName", "actionLanguage", "microcopy",
    "subtleManifestations", "typicalManifestations", "strongManifestations",
    "falseManifestations", "riskSignals", "recommendedFeedbackFields",
    "relatedActionPermissions",
  ];
  events.forEach((e) => {
    const before = FIELDS.map((f) => {
      const v = e[f] as unknown;
      if (Array.isArray(v)) return v.length;
      return v ? 1 : 0;
    });
    fillEventDefaults(e);
    const after = FIELDS.map((f) => {
      const v = e[f] as unknown;
      if (Array.isArray(v)) return v.length;
      return v ? 1 : 0;
    });
    let changed = 0;
    for (let i = 0; i < FIELDS.length; i++) {
      if (after[i] > before[i]) changed += after[i] - before[i];
    }
    if (changed > 0) {
      filledCount += 1;
      filledFieldsTotal += changed;
    }
  });
  return { filledCount, filledFieldsTotal };
}
