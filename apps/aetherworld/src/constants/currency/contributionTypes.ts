export type ContributionTypeId =
  | "CREATE_MODEL"
  | "CREATE_WORLD"
  | "CREATE_NARRATIVE"
  | "CREATE_VOCAL_PROMPT"
  | "CREATE_TRANSLATION"
  | "CREATE_PROMPT"
  | "ADD_KNOWLEDGE"
  | "VALIDATE_RESULT"
  | "FIX_BUG"
  | "RUN_QA"
  | "SIMPLIFY_LANGUAGE"
  | "COMPLETE_VIRTUAL_LIFE_TASK"
  | "EXPORT_ASSET"
  | "PROVIDE_FEEDBACK"
  | "FOUNDER_SYSTEM_UPDATE";

import type { ValueUnitId } from "./valueUnitTypes";

export interface ContributionType {
  id: ContributionTypeId;
  label: string;
  description: string;
  baseUnits: { unit: ValueUnitId; amount: number }[];
  founderOnly?: boolean;
}

export const CONTRIBUTION_TYPES: ContributionType[] = [
  { id: "CREATE_MODEL",              label: "生成模型",          description: "通过模型生成引擎产出结构化模型。",   baseUnits: [{ unit: "CREATION_POINT", amount: 6 }, { unit: "AETHER_CREDIT", amount: 4 }] },
  { id: "CREATE_WORLD",              label: "生成世界",          description: "生成世界 / 区域 / NPC / 任务。",     baseUnits: [{ unit: "CREATION_POINT", amount: 8 }, { unit: "WORLD_RESOURCE", amount: 3 }] },
  { id: "CREATE_NARRATIVE",          label: "生成剧情",          description: "生成剧情、漫画脚本、游戏任务文本。", baseUnits: [{ unit: "CREATION_POINT", amount: 5 }, { unit: "WORLD_RESOURCE", amount: 1 }] },
  { id: "CREATE_VOCAL_PROMPT",       label: "生成声乐 Prompt",   description: "生成 Suno / Udio 等音乐 prompt。",   baseUnits: [{ unit: "CREATION_POINT", amount: 4 }] },
  { id: "CREATE_TRANSLATION",        label: "完成翻译",          description: "完成翻译 / 概念转译。",              baseUnits: [{ unit: "KNOWLEDGE_POINT", amount: 3 }, { unit: "CREATION_POINT", amount: 2 }] },
  { id: "CREATE_PROMPT",             label: "生成提示词",        description: "生成 Lovable / Codex / Godot / Unity 提示词。", baseUnits: [{ unit: "CREATION_POINT", amount: 3 }] },
  { id: "ADD_KNOWLEDGE",             label: "新增知识条目",      description: "新增知识库或百科条目。",             baseUnits: [{ unit: "KNOWLEDGE_POINT", amount: 6 }, { unit: "AETHER_CREDIT", amount: 2 }] },
  { id: "VALIDATE_RESULT",           label: "回验结果",          description: "回验预测 / 行动结果。",              baseUnits: [{ unit: "VALIDATION_POINT", amount: 5 }] },
  { id: "FIX_BUG",                   label: "修复 Bug",          description: "发现或修复 Bug。",                   baseUnits: [{ unit: "AETHER_CREDIT", amount: 6 }, { unit: "VALIDATION_POINT", amount: 2 }] },
  { id: "RUN_QA",                    label: "运行质量检查",      description: "运行 Software QA。",                 baseUnits: [{ unit: "AETHER_CREDIT", amount: 2 }, { unit: "VALIDATION_POINT", amount: 1 }] },
  { id: "SIMPLIFY_LANGUAGE",         label: "降低术语门槛",      description: "把术语翻译为人话。",                 baseUnits: [{ unit: "KNOWLEDGE_POINT", amount: 2 }, { unit: "CREATION_POINT", amount: 1 }] },
  { id: "COMPLETE_VIRTUAL_LIFE_TASK", label: "完成虚拟生活任务", description: "完成虚拟生活任务并打卡。",           baseUnits: [{ unit: "VALIDATION_POINT", amount: 3 }, { unit: "WORLD_RESOURCE", amount: 2 }] },
  { id: "EXPORT_ASSET",              label: "导出资产",          description: "导出模型 / JSON / Markdown / Prompt。", baseUnits: [{ unit: "AETHER_CREDIT", amount: 1 }] },
  { id: "PROVIDE_FEEDBACK",          label: "用户反馈",          description: "提交反馈或评分。",                   baseUnits: [{ unit: "AETHER_CREDIT", amount: 1 }, { unit: "VALIDATION_POINT", amount: 1 }] },
  { id: "FOUNDER_SYSTEM_UPDATE",     label: "Founder 系统更新",  description: "Founder 级别的系统升级。",           baseUnits: [{ unit: "FOUNDER_CREDIT", amount: 10 }], founderOnly: true },
];

export function getContributionType(id: ContributionTypeId): ContributionType | undefined {
  return CONTRIBUTION_TYPES.find((c) => c.id === id);
}
