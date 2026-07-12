export const AGENT_BINDING_RECALCULATION_ITEMS = [
  "Recalculate Agent Binding Registry",
  "Recalculate Knowledge Bindings",
  "Recalculate Personality Bindings",
  "Recalculate Agent Context",
  "Recalculate Calculus Routing",
  "Recalculate Object Interfaces",
  "Recalculate Governance Rules",
  "Recalculate Memory Policies",
  "Recalculate Autonomy Policies",
  "Recalculate Agent QA",
  "Recalculate Agent Workspace Records",
];

export function markAgentBindingRecalculation(reason: string): { id: string; reason: string; items: string[] } {
  return { id: `recalc-agentbind-${Date.now()}`, reason, items: AGENT_BINDING_RECALCULATION_ITEMS };
}
