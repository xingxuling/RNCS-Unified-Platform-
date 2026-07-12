import type { AgentBindingProfile, AgentMemoryPolicy } from "./agentKnowledgePersonalityBindingCalculus";

export function applyMemoryPolicy(profile: AgentBindingProfile): { policy: AgentMemoryPolicy; redactionNotes: string[] } {
  const p = profile.memoryPolicy;
  const notes: string[] = [];
  if (p.canReadRawSequence) notes.push("已开启原始数列读取（风险）");
  if (p.canExportMemory) notes.push("允许导出记忆，导出前需脱敏");
  if (p.memoryMode === "FOUNDER_MEMORY" && profile.personalityBinding.subjectMode !== "FOUNDER")
    notes.push("FOUNDER_MEMORY 仅 Founder 可用，已强制降级");
  return { policy: p, redactionNotes: notes };
}
