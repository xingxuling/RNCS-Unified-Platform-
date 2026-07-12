export type AssetTypeId =
  | "MODEL_ASSET"
  | "WORLD_ASSET"
  | "NPC_ASSET"
  | "QUEST_ASSET"
  | "NARRATIVE_ASSET"
  | "VOCAL_ASSET"
  | "TRANSLATION_ASSET"
  | "PROMPT_ASSET"
  | "KNOWLEDGE_ASSET"
  | "CODE_PLAN_ASSET";

export interface AssetTypeDef {
  id: AssetTypeId;
  label: string;
  description: string;
  baseValue: number; // 基础内部价值分（0-10）
  sourceEngine: string;
}

export const ASSET_TYPES: AssetTypeDef[] = [
  { id: "MODEL_ASSET",       label: "模型资产",        description: "结构化模型 / Schema。",          baseValue: 6, sourceEngine: "modelGeneration" },
  { id: "WORLD_ASSET",       label: "世界资产",        description: "世界 / 区域 / 渲染配置。",       baseValue: 7, sourceEngine: "sequenceWorld" },
  { id: "NPC_ASSET",         label: "NPC 资产",        description: "NPC 行为 / 关系 / 立场。",        baseValue: 5, sourceEngine: "sequenceWorld" },
  { id: "QUEST_ASSET",       label: "任务资产",        description: "任务结构 / 触发 / 奖励。",       baseValue: 5, sourceEngine: "narrative" },
  { id: "NARRATIVE_ASSET",   label: "剧情资产",        description: "剧情文本 / 漫画 / 游戏脚本。",   baseValue: 5, sourceEngine: "narrative" },
  { id: "VOCAL_ASSET",       label: "声乐资产",        description: "Suno / Udio 提示词与演唱方案。", baseValue: 4, sourceEngine: "vocal" },
  { id: "TRANSLATION_ASSET", label: "翻译资产",        description: "概念转译 / 多语言映射。",        baseValue: 4, sourceEngine: "translation" },
  { id: "PROMPT_ASSET",      label: "提示词资产",      description: "工程化 Prompt（Lovable/Codex…）。", baseValue: 4, sourceEngine: "promptForge" },
  { id: "KNOWLEDGE_ASSET",   label: "知识资产",        description: "知识库条目 / 百科条目。",        baseValue: 6, sourceEngine: "worldKnowledge" },
  { id: "CODE_PLAN_ASSET",   label: "代码计划资产",    description: "代码生成计划与结构。",            baseValue: 5, sourceEngine: "codeGeneration" },
];

export function getAssetType(id: AssetTypeId): AssetTypeDef | undefined {
  return ASSET_TYPES.find((a) => a.id === id);
}
