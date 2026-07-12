// 事件回验规则
export interface EventValidationRule {
  eventId: string;
  checklist: string[]; // 用户回验时勾选
  metricKeys: string[]; // 回验指标
}

export const EVENT_VALIDATION_RULES: EventValidationRule[] = [
  { eventId: "CAREER_OPENING",
    checklist: ["是否出现合作/申请/项目推进", "是否有人主动询问", "是否有正式回复", "是否出现资源信号", "是否需要补材料"],
    metricKeys: ["事件命中", "时间窗口", "类型匹配"] },
  { eventId: "RELATIONSHIP_WARMING",
    checklist: ["联系频率是否上升", "对方是否主动", "互动内容是否更私人", "是否有线下/语音/照片信号", "是否存在误读"],
    metricKeys: ["关系强度变化", "误读率"] },
  { eventId: "COGNITIVE_BOOST",
    checklist: ["是否生成新结构", "输出速度是否提升", "是否稳定调用", "是否出现过载", "是否需要休息"],
    metricKeys: ["认知输出", "过载风险"] },
  { eventId: "PRODUCT_RELEASE_WINDOW",
    checklist: ["是否适合发布", "是否收到反馈", "是否产生点击/使用/回验", "是否出现 scope drift", "是否需要 UI 修复"],
    metricKeys: ["发布命中", "回验完成率"] },
  { eventId: "RESOURCE_INFLOW",
    checklist: ["是否到账", "金额是否吻合", "时间是否吻合", "是否有附带条件"],
    metricKeys: ["金额命中", "时间命中"] },
  { eventId: "HEALTH_RECOVERY_UP",
    checklist: ["睡眠是否改善", "能量是否恢复", "是否仍有过载残留"],
    metricKeys: ["恢复度"] },
  { eventId: "CHAOS_RISK",
    checklist: ["是否真的发生", "强度如何", "是否被识别并降载"],
    metricKeys: ["乱流强度", "识别速度"] },
  { eventId: "FALSE_SIGNAL_EVENT",
    checklist: ["事件是否真实发生", "是否被定数=假定标记", "事后是否归类为伪信号"],
    metricKeys: ["伪信号率"] },
];

export function getValidationRule(eventId: string): EventValidationRule {
  return EVENT_VALIDATION_RULES.find((r) => r.eventId === eventId) ?? {
    eventId,
    checklist: [
      "事件是否真实发生",
      "时间窗口是否匹配",
      "事件类型是否匹配",
      "强度是否匹配",
      "是否需要进入下一轮回验",
    ],
    metricKeys: ["事件命中", "时间窗口", "类型匹配"],
  };
}
