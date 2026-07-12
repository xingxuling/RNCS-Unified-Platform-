// 事件阶段
export type EventStageId =
  | "SEED" | "FORMING" | "TRIGGERED" | "ESCALATING" | "CONFIRMING"
  | "PEAKING" | "DECLINING" | "BLOCKED" | "REVERSED" | "ARCHIVED";

export interface EventStage {
  id: EventStageId;
  name: string;
  en: string;
  description: string;
  actionable: boolean;
  validatable: boolean;
  colorVar: string;
  order: number;
}

export const EVENT_STAGES: EventStage[] = [
  { id: "SEED", name: "种子期", en: "Seed", description: "信号刚出现，不可激进行动。", actionable: false, validatable: false, colorVar: "hsl(220 30% 60%)", order: 1 },
  { id: "FORMING", name: "成形期", en: "Forming", description: "多变量同向，宜观察和补材料。", actionable: false, validatable: true, colorVar: "hsl(200 60% 60%)", order: 2 },
  { id: "TRIGGERED", name: "触发期", en: "Triggered", description: "事件进入现实，宜小步行动。", actionable: true, validatable: true, colorVar: "hsl(45 90% 60%)", order: 3 },
  { id: "ESCALATING", name: "增强期", en: "Escalating", description: "事件强度上升，宜推进。", actionable: true, validatable: true, colorVar: "hsl(30 95% 60%)", order: 4 },
  { id: "CONFIRMING", name: "确认期", en: "Confirming", description: "现实反馈出现，宜确认/签约/发布。", actionable: true, validatable: true, colorVar: "hsl(140 60% 55%)", order: 5 },
  { id: "PEAKING", name: "高峰期", en: "Peaking", description: "事件显化最强，关键动作时机。", actionable: true, validatable: true, colorVar: "hsl(280 80% 65%)", order: 6 },
  { id: "DECLINING", name: "回落期", en: "Declining", description: "能量下降，宜收尾。", actionable: false, validatable: true, colorVar: "hsl(20 40% 55%)", order: 7 },
  { id: "BLOCKED", name: "阻滞期", en: "Blocked", description: "被场域 / 人物 / 资源阻断。", actionable: false, validatable: true, colorVar: "hsl(0 60% 55%)", order: 8 },
  { id: "REVERSED", name: "反向期", en: "Reversed", description: "走向相反，需止损或转向。", actionable: true, validatable: true, colorVar: "hsl(340 70% 55%)", order: 9 },
  { id: "ARCHIVED", name: "归档期", en: "Archived", description: "事件结束，宜回验复盘。", actionable: false, validatable: true, colorVar: "hsl(220 10% 45%)", order: 10 },
];

export function getStage(id: EventStageId | string): EventStage {
  return EVENT_STAGES.find((s) => s.id === id) ?? EVENT_STAGES[0];
}

export function nextStage(id: EventStageId): EventStage {
  const cur = getStage(id);
  if (cur.id === "BLOCKED" || cur.id === "REVERSED" || cur.id === "ARCHIVED") return cur;
  return EVENT_STAGES.find((s) => s.order === cur.order + 1) ?? cur;
}
