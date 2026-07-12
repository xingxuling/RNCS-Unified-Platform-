// Constant Universe v0.2 — Threshold Constants
export interface ThresholdConstant {
  id: string;
  name: string;
  value: number | boolean;
  description: string;
  usedByEngines: string[];
}

export const THRESHOLD_CONSTANTS: ThresholdConstant[] = [
  { id: "WORLD_OVERLOAD_THRESHOLD", name: "世界过载阈值", value: 0.82, description: "世界复杂度超过该值视为过载", usedByEngines: ["WorldEngine", "Recalculation"] },
  { id: "EVENT_PRESSURE_HIGH", name: "事件压力高阈值", value: 0.75, description: "事件压力高于该值需触发缓解策略", usedByEngines: ["EventScheduler", "AutonomousEvent"] },
  { id: "STABILITY_LOW", name: "稳定性低阈值", value: 0.35, description: "稳定性低于该值预警", usedByEngines: ["WorldEngine", "Civilization"] },
  { id: "NPC_TRUST_HIGH", name: "NPC 信任高", value: 0.7, description: "信任值高于该值视为亲密关系", usedByEngines: ["NPCAgent", "SocialGraph"] },
  { id: "NPC_CONFLICT_HIGH", name: "NPC 冲突高", value: 0.65, description: "冲突值高于该值触发冲突事件", usedByEngines: ["NPCAgent", "SocialConflict"] },
  { id: "RESOURCE_SCARCITY_HIGH", name: "资源稀缺高", value: 0.72, description: "资源稀缺高于该值触发经济周期", usedByEngines: ["ResourceFlow", "WorldEconomy"] },
  { id: "CIVILIZATION_COLLAPSE_RISK_HIGH", name: "文明崩塌风险高", value: 0.78, description: "崩塌风险高于该值进入末期", usedByEngines: ["Civilization", "Catastrophe"] },
  { id: "COMPRESSION_REQUIRED_COMPLEXITY", name: "建议压缩复杂度", value: 0.7, description: "复杂度超过该值建议压缩输出", usedByEngines: ["Compression"] },
  { id: "FOUNDER_TRACE_VISIBILITY_THRESHOLD", name: "Founder trace 可见阈值", value: 0.9, description: "Founder trace 显示阈值", usedByEngines: ["Compression", "Trace"] },
  { id: "SAFETY_CRITICAL_THRESHOLD", name: "安全严重阈值", value: 0.85, description: "安全风险严重判定阈值", usedByEngines: ["Safety", "SoftwareQA"] },
  { id: "FULL60_PRIVACY_REQUIRED", name: "Full60 隐私强制提示", value: true, description: "Full60 必须显示隐私提示", usedByEngines: ["SubjectMode", "Compression"] },
  { id: "DEMO_REAL_MIXING_BLOCK", name: "禁止 Demo/Real 混合", value: true, description: "禁止 Demo 与 Real 数据混用", usedByEngines: ["SubjectMode", "Safety"] },
];

export function getThreshold(id: string): ThresholdConstant | undefined {
  return THRESHOLD_CONSTANTS.find((t) => t.id === id);
}
