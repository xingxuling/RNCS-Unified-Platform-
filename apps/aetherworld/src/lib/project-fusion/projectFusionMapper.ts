// 项目融合 · 映射器
// 把候选的项目类型 → Aetherworld 主干系统
import type { SameAccountProjectCandidate } from "./projectFusionTypes";

const TYPE_TO_TARGETS: Record<string, string[]> = {
  "AI Chat / Agent": ["Chat", "Sequence Agent Runtime", "Sequence AI Runtime"],
  "Workspace / Project": ["Workspace"],
  "Calendar / Scheduler": ["Calendar", "Scheduler Runtime"],
  "Store / Plugin / Capability": ["Store / WebXXM"],
  "Social / Publish": ["Social"],
  "World / Character / Narrative": ["Sequence Agent (WORLD_AGENT)", "Workspace"],
  "Code Sandbox / App Builder": ["App Runtime / Code Sandbox"],
  "Analytics / Dashboard": ["Analytics Runtime"],
  "Record / Audit / Verification": ["Record Center", "Bug Audit"],
  "LLM Provider / Local Gateway": ["LLM Provider", "Local Gateway"],
  "Personal OS / Life OS": ["Workspace", "Calendar", "Sequence Agent Runtime"],
  Other: ["Legacy Module Registry"],
};

export function mapToTargetSystems(c: SameAccountProjectCandidate): string[] {
  return TYPE_TO_TARGETS[c.projectType] ?? TYPE_TO_TARGETS.Other;
}
