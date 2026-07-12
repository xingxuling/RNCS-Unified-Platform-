import type { AgentBindingProfile } from "./agentKnowledgePersonalityBindingCalculus";

export function bindObjectInterface(profile: AgentBindingProfile): { ok: boolean; missing: string[]; note: string } {
  const o = profile.objectInterfaceBinding;
  const missing: string[] = [];
  if (o.producedOutputObjectTypes.length === 0) missing.push("PRODUCED_OBJECT_TYPES");
  return {
    ok: missing.length === 0,
    missing,
    note: o.workspaceSaveRequired ? "输出对象必须保存到 Workspace" : "输出对象可选保存",
  };
}
