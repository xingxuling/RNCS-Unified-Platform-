import { listAgentBindings } from "./agentBindingRegistry";

export interface AgentBindingExample {
  id: string;
  title: string;
  bindingId: string;
  scenario: string;
  expectedObjects: string[];
}

export function listAgentBindingExamples(): AgentBindingExample[] {
  return listAgentBindings().map((b, i) => ({
    id: `ex-agentbind-${i + 1}`,
    title: `示例：绑定 ${b.agentName}`,
    bindingId: b.bindingId,
    scenario: b.bindingPurpose,
    expectedObjects: b.objectInterfaceBinding.producedOutputObjectTypes,
  }));
}
