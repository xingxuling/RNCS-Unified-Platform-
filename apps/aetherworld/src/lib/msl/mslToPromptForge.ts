import { MSLStatement } from "./mslParser";
import { compileStatement } from "./mslCompiler";

export type PromptForgePreset =
  | "lovable" | "codex" | "godot" | "unity"
  | "worldbuilding" | "npc" | "quest" | "render";

const PRESET_LEAD: Record<PromptForgePreset, string> = {
  lovable:       "# Lovable Prompt\n你是一名 Aether 助手，请基于以下 MSL 状态生成产品改造任务：\n",
  codex:         "# Codex Prompt\n请把以下 MSL 状态翻译为可执行的代码任务：\n",
  godot:         "# Godot Prompt\n请基于以下 MSL 状态生成 Godot 场景/GDScript 任务草案：\n",
  unity:         "# Unity Prompt\n请基于以下 MSL 状态生成 Unity 场景/C# 行为草案：\n",
  worldbuilding: "# Worldbuilding Prompt\n请基于以下 MSL 状态扩写世界设定：\n",
  npc:           "# NPC Prompt\n请基于以下 MSL 状态生成 NPC 行为与对话风格：\n",
  quest:         "# Quest Prompt\n请基于以下 MSL 状态生成任务结构与触发条件：\n",
  render:        "# Render Style Prompt\n请基于以下 MSL 状态生成渲染风格关键词：\n",
};

export function mslToPromptForge(stmts: MSLStatement[], preset: PromptForgePreset = "lovable", isFull60?: boolean) {
  const blocks = stmts.map(s => compileStatement(s, "PROMPT_FORGE", { isFull60 }).output as string);
  return {
    preset,
    prompt: PRESET_LEAD[preset] + blocks.join("\n---\n"),
  };
}
