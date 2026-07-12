// 投喂铸造炉 · 训练任务建议
import type { IntakeForgeRun, IntakeSourceType } from "./intakeForgeTypes";

export function suggestTrainingTasks(opts: {
  inputMode: IntakeForgeRun["inputMode"];
  sourceTypes: IntakeSourceType[];
  totalSamples: number;
}): string[] {
  const tasks: string[] = [];
  const types = new Set(opts.sourceTypes);

  if (types.has("MSL_STATE")) tasks.push("加入 MSL Router 训练集（下一轮夜间）");
  if (types.has("LOVABLE_PROMPT") || types.has("LOVABLE_RESULT"))
    tasks.push("加入 Lovable Handoff 训练集（SFT）");
  if (types.has("CHATGPT_COMPRESSED_EXPORT") || types.has("CHATGPT_CONVERSATION"))
    tasks.push("加入 AetherSeed Core Mix（夜间慢跑）");
  if (types.has("CODE_PROJECT") || types.has("PROJECT_FOLDER"))
    tasks.push("加入开源架构吸收训练集（架构映射）");
  if (types.has("WORLD_CREATIVE")) tasks.push("加入 World Language Mix");
  if (types.has("BUG_AUDIT") || types.has("RECORD_CENTER_EXPORT"))
    tasks.push("加入 QA / Verification 训练集");
  if (opts.totalSamples > 0)
    tasks.push(`生成今晚训练任务草案（约 ${opts.totalSamples} 条样本）`);
  if (!tasks.length) tasks.push("先保存到 Workspace，再人工选择训练集归属。");

  return tasks;
}
