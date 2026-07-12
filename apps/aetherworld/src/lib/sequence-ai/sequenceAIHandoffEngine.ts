import { getToolRoute } from "./sequenceAIToolRegistry";
import type { SequenceAIResponse, SequenceAIQuickAction } from "./sequenceAIResponseComposer";

export interface HandoffPayload {
  sourceInput: string;
  subjectMode: string;
  language: string;
  enginePath: string[];
  safetyNotes: string[];
  topic: string;
  targetEngine: string;
  actionType: string;
  extra?: Record<string, unknown>;
}

export function buildHandoff(
  action: SequenceAIQuickAction,
  response: SequenceAIResponse,
  sourceInput: string,
  subjectMode: string,
  language: string,
): HandoffPayload {
  const enginePath = response.engineTrace
    ? [response.engineTrace.primaryEngine, ...response.engineTrace.supportingEngines]
    : [action.targetEngine];
  return {
    sourceInput,
    subjectMode,
    language,
    enginePath,
    safetyNotes: response.safetyNotes,
    topic: (action.payload?.topic as string) ?? "",
    targetEngine: action.targetEngine,
    actionType: action.actionType,
    extra: action.payload,
  };
}

export function resolveHandoffRoute(action: SequenceAIQuickAction): string | undefined {
  return action.route ?? getToolRoute(action.targetEngine);
}

const HANDOFF_KEY = "aether.sequenceAI.lastHandoff";
export function persistHandoff(payload: HandoffPayload): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(HANDOFF_KEY, JSON.stringify(payload)); } catch { /* ignore */ }
}
export function readLastHandoff(): HandoffPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(HANDOFF_KEY);
    return raw ? JSON.parse(raw) as HandoffPayload : null;
  } catch { return null; }
}
