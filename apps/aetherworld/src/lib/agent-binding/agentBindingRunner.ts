import { getAgentBinding } from "./agentBindingRegistry";
import { buildAgentContext, type AetherAgentContext } from "./agentContextBuilder";
import { runRuntimeSpine, type AgentRuntimeTrace } from "./agentRuntimeSpineBridge";
import { checkAgentGovernance, type GovernanceCheckResult } from "./agentGovernanceGuard";
import { runAgentBindingQa, type AgentQaResult } from "./agentQaBridge";
import { adaptAgentOutput, type AetherAgentOutput } from "./agentOutputAdapter";
import { saveAgentOutputToWorkspace, type AgentWorkspaceSaveResult } from "./agentWorkspaceBridge";
import { evaluateAgentSafety, type AgentSafetyResult } from "./agentSafetyGuard";

export interface AgentBindingRunResult {
  runId: string;
  bindingId: string;
  context: AetherAgentContext;
  governance: GovernanceCheckResult;
  qa: AgentQaResult;
  safety: AgentSafetyResult;
  trace: AgentRuntimeTrace;
  output: AetherAgentOutput;
  workspace: AgentWorkspaceSaveResult;
}

export function runAgentBinding(bindingId: string, userIntent: string): AgentBindingRunResult | { error: string } {
  const profile = getAgentBinding(bindingId);
  if (!profile) return { error: `未找到 Binding：${bindingId}` };

  const context = buildAgentContext(profile, userIntent);
  const governance = checkAgentGovernance(profile, userIntent);
  const qa = runAgentBindingQa(profile);
  const safety = evaluateAgentSafety(profile);
  const blockedSteps = governance.ok ? [] : ["execute_or_prepare_agent_action"];
  const trace = runRuntimeSpine(profile, blockedSteps);
  const output = adaptAgentOutput(profile, userIntent, {
    knowledgeSources: context.knowledgeContext.sources,
    personality: context.subjectPersonalitySummary,
    calculusRoute: context.calculusRoute,
    governance,
    qa,
  }, trace.traceId);
  const workspace = saveAgentOutputToWorkspace(output);

  return {
    runId: `run-agentbind-${Date.now()}`,
    bindingId,
    context, governance, qa, safety, trace, output, workspace,
  };
}
