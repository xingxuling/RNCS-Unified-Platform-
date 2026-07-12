export const AGENT_TOOL_TYPES = [
  { id: "APP_BUILDER_AGENT",        label: "App Builder Agent" },
  { id: "CODE_SANDBOX_AGENT",       label: "代码沙箱 Agent" },
  { id: "CODE_GENERATION_AGENT",    label: "代码生成 Agent" },
  { id: "MUSIC_GENERATION_AGENT",   label: "音乐生成 Agent" },
  { id: "WORKFLOW_AGENT",           label: "工作流 Agent" },
  { id: "CHATBOT_AGENT",            label: "聊天机器人 Agent" },
  { id: "RAG_KNOWLEDGE_AGENT",      label: "RAG 知识 Agent" },
  { id: "DESIGN_GENERATION_AGENT",  label: "设计生成 Agent" },
  { id: "IMAGE_VIDEO_AGENT",        label: "图像/视频 Agent" },
  { id: "GAME_ENGINE_AGENT",        label: "游戏引擎 Agent" },
  { id: "DEPLOYMENT_AGENT",         label: "部署 Agent" },
  { id: "DATA_ANALYSIS_AGENT",      label: "数据分析 Agent" },
  { id: "DOCUMENTATION_AGENT",      label: "文档 Agent" },
  { id: "QA_AGENT",                 label: "QA Agent" },
  { id: "GOVERNANCE_AGENT",         label: "治理 Agent" },
  { id: "CUSTOM_OPEN_SOURCE_AGENT", label: "自定义开源 Agent" },
] as const;

export type AgentToolTypeId = typeof AGENT_TOOL_TYPES[number]["id"];
