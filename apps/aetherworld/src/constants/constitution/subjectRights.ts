// System Constitution v0.2 — Subject Rights
export interface SubjectRight {
  rightId: string;
  title: string;
  description: string;
  founderLocked: boolean;
}

export const SUBJECT_RIGHTS: SubjectRight[] = [
  { rightId: "SR_OWN_FULL60", title: "Full60 数据主权", description: "Full60 数据属于用户私有，本地保存，不自动上传。", founderLocked: true },
  { rightId: "SR_OWN_LIGHT20", title: "Light20 数据主权", description: "Light20 数据属于用户私有。", founderLocked: true },
  { rightId: "SR_NO_DEMO_REAL_MIX", title: "Demo/Real 严格隔离", description: "Demo 不得伪装 Real；Real 不得写入 Demo。", founderLocked: true },
  { rightId: "SR_MODE_SWITCH", title: "主体模式切换权", description: "用户可在 Demo / Light20 / Full60 之间切换。", founderLocked: false },
  { rightId: "SR_OUTPUT_LABELING", title: "输出标记权", description: "任何输出必须标记 subjectModeUsed。", founderLocked: true },
  { rightId: "SR_EXPORT_WARNING", title: "Full60 导出提示权", description: "Full60 导出必须显示强警告。", founderLocked: true },
  { rightId: "SR_CLEAR_LOCAL", title: "本地清除权", description: "用户可随时清除本地主体数据；清除后系统不得继续使用旧 Real。", founderLocked: true },
  { rightId: "SR_NO_FOUNDER_LEAK", title: "Founder 隔离权", description: "Founder Subject 不被普通模式读取。", founderLocked: true },
];
