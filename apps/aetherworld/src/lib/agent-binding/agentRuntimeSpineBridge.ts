import type { AgentBindingProfile } from "./agentKnowledgePersonalityBindingCalculus";

export interface AgentRuntimeTrace {
  traceId: string;
  steps: { step: string; status: "OK" | "BLOCKED" | "SKIPPED"; note?: string }[];
}

const PIPELINE = [
  "normalize_user_intent", "resolve_subject_mode", "load_agent_binding_profile",
  "bind_knowledge_layer", "bind_personality_layer", "build_agent_context",
  "route_calculus", "check_governance", "execute_or_prepare_agent_action",
  "adapt_output", "qa_check", "write_workspace_record", "mark_recalculation",
  "generate_next_action",
];

export function runRuntimeSpine(profile: AgentBindingProfile, blocked: string[] = []): AgentRuntimeTrace {
  return {
    traceId: `trace-${profile.bindingId}-${Date.now()}`,
    steps: PIPELINE.map((s) => ({
      step: s,
      status: blocked.includes(s) ? "BLOCKED" : "OK",
      note: blocked.includes(s) ? "治理阻断" : undefined,
    })),
  };
}
