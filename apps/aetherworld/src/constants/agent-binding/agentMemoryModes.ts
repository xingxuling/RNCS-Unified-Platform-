export const AGENT_MEMORY_MODES = [
  "NONE",
  "SESSION_ONLY",
  "PROJECT_MEMORY",
  "WORKSPACE_MEMORY",
  "SUBJECT_MEMORY_SUMMARY",
  "FOUNDER_MEMORY",
] as const;
export type AgentMemoryMode = typeof AGENT_MEMORY_MODES[number];
