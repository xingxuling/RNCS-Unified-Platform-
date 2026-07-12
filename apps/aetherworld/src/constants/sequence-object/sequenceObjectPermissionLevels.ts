export const SEQUENCE_OBJECT_PERMISSION_LEVELS = ["PUBLIC","PUBLIC_DEMO","USER_PRIVATE","FOUNDER_PRIVATE","SYSTEM_ONLY"] as const;
export type SequenceObjectPermissionLevel = (typeof SEQUENCE_OBJECT_PERMISSION_LEVELS)[number];

export const PERMISSION_LEVEL_LABELS: Record<SequenceObjectPermissionLevel, string> = {
  PUBLIC: "公开", PUBLIC_DEMO: "公开 Demo", USER_PRIVATE: "用户私有", FOUNDER_PRIVATE: "Founder 私有", SYSTEM_ONLY: "仅系统",
};
