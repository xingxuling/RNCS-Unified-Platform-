export const AGENT_BINDING_STATUSES = ["DRAFT", "ACTIVE", "REVIEW_NEEDED", "BLOCKED", "DISABLED"] as const;
export type AgentBindingStatus = typeof AGENT_BINDING_STATUSES[number];

export const KNOWLEDGE_SCOPES = ["MINIMAL", "TASK_SPECIFIC", "PROJECT", "FULL_AETHERWORLD", "FOUNDER_ONLY"] as const;
export type KnowledgeScope = typeof KNOWLEDGE_SCOPES[number];

export const PRIVACY_LEVELS = ["PUBLIC_DEMO", "USER_PRIVATE", "FOUNDER_PRIVATE"] as const;
export type PrivacyLevel = typeof PRIVACY_LEVELS[number];

export const SUBJECT_MODES = ["DEMO", "LIGHT_20", "FULL_60", "FOUNDER"] as const;
export type SubjectMode = typeof SUBJECT_MODES[number];
