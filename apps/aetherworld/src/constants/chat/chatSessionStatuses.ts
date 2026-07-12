export const CHAT_SESSION_STATUSES = ["ACTIVE", "ARCHIVED", "BLOCKED"] as const;
export type ChatSessionStatus = (typeof CHAT_SESSION_STATUSES)[number];
