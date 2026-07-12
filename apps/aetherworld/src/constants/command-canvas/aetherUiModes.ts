export const AETHER_UI_MODES = [
  { id: "COMMAND_MODE",  label: "命令模式", en: "Command",  description: "以命令输入为中心" },
  { id: "CANVAS_MODE",   label: "画布模式", en: "Canvas",   description: "以对象编辑为中心" },
  { id: "CODE_MODE",     label: "代码模式", en: "Code",     description: "以代码、Patch、预览为中心" },
  { id: "WORLD_MODE",    label: "世界模式", en: "World",    description: "以世界状态、事件、时间线为中心" },
  { id: "MODEL_MODE",    label: "模型模式", en: "Model",    description: "以 Web 模型群为中心" },
  { id: "QA_MODE",       label: "审计模式", en: "QA",       description: "以审计、风险、阻断为中心" },
  { id: "FOUNDER_MODE",  label: "创始人模式", en: "Founder", description: "完整系统控制" },
  { id: "FOCUS_MODE",    label: "专注模式", en: "Focus",    description: "隐藏非必要侧栏" },
] as const;
export type AetherUiModeId = (typeof AETHER_UI_MODES)[number]["id"];
export const DEFAULT_UI_MODE: AetherUiModeId = "COMMAND_MODE";
