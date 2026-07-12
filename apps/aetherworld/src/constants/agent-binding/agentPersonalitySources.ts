export const AGENT_PERSONALITY_SOURCES = [
  { id: "FULL60_SEQUENCE_PROFILE",   label: "Full60 数列主体",   privacy: "USER_PRIVATE" },
  { id: "LIGHT20_SEQUENCE_PROFILE",  label: "Light20 数列主体",  privacy: "PUBLIC_DEMO" },
  { id: "REAL_SUBJECT_SETTINGS",     label: "真实主体设置",       privacy: "USER_PRIVATE" },
  { id: "USER_WORKSPACE_HISTORY",    label: "用户工作区历史",     privacy: "USER_PRIVATE" },
  { id: "DIGITAL_ROLE_PROFILE",      label: "数字角色 Profile",    privacy: "PUBLIC_DEMO" },
  { id: "PROJECT_STYLE_PROFILE",     label: "项目风格 Profile",    privacy: "USER_PRIVATE" },
  { id: "FOUNDER_SUBJECT_PROFILE",   label: "Founder 主体 Profile", privacy: "FOUNDER_PRIVATE" },
] as const;

export type AgentPersonalitySourceId = typeof AGENT_PERSONALITY_SOURCES[number]["id"];
