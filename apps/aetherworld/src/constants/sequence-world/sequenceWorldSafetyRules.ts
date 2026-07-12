export interface SeqWorldSafetyRule {
  id: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export const FORBIDDEN_CLAIM_PATTERNS = [
  /可替代\s*(Unity|Godot|Unreal)/i,
  /无需测试即可上线/,
  /真实物理完全准确/,
  /所有动画可自动完成/,
  /保证(游戏|项目)成功/,
];

export const RECOMMENDED_DISCLAIMERS = [
  "本 SDK 是世界逻辑层 / 表现参数层，不替代 Unity / Godot / Unreal 真实渲染与物理。",
  "导出的 JSON / 脚本骨架需在目标引擎中编译、测试、性能优化与安全验证后再使用。",
  "涉及商业、医疗、仿真等高风险场景，请寻求专业验证。",
];

export const SEQ_WORLD_SAFETY_RULES: SeqWorldSafetyRule[] = [
  { id: "no-replace-engine", description: "禁止宣称替代 Unity/Godot/Unreal", severity: "CRITICAL" },
  { id: "export-must-have-metadata", description: "导出 JSON 必须含 metadata + engineVersion", severity: "MEDIUM" },
  { id: "full60-privacy-note", description: "Full 60 模式必须显示隐私提示", severity: "HIGH" },
  { id: "must-have-safety-note", description: "必须输出安全说明", severity: "HIGH" },
  { id: "must-isolate-demo-real", description: "Demo / Real / Founder 数据隔离", severity: "HIGH" },
];
