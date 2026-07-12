import { FREE_INTENTS, type FreeIntentId } from "@/constants/free-input/freeIntentTypes";
import type { NormalizedFreeInput } from "./freeInputNormalizer";

export interface FreeTask {
  id: string;
  taskType: string;
  taskIntent: FreeIntentId;
  targetEngine: string;
  inputSlice: string;
  priority: number;
  dependsOn?: string[];
}

export interface FreeTaskPlan {
  tasks: FreeTask[];
  executionOrder: string[];
  canAnswerDirectly: boolean;
  needsClarification: boolean;
}

const VERB_SPLIT = /[，,；;]|然后|再|顺便|接着|并且|还要|另外/;

function intentForChunk(chunk: string): FreeIntentId {
  for (const def of FREE_INTENTS) {
    if (def.keywords.some((k) => chunk.toLowerCase().includes(k.toLowerCase()))) return def.id;
  }
  return "ASK";
}

function engineForIntent(id: FreeIntentId): string {
  return FREE_INTENTS.find((d) => d.id === id)?.targetEngine ?? "sequenceAI";
}

export function splitFreeTasks(norm: NormalizedFreeInput): FreeTaskPlan {
  const chunks = norm.cleanedText
    .split(VERB_SPLIT)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  const tasks: FreeTask[] = [];
  let prev: string | undefined;
  chunks.forEach((chunk, idx) => {
    const intent = intentForChunk(chunk);
    const id = `t${idx + 1}`;
    tasks.push({
      id,
      taskType: intent,
      taskIntent: intent,
      targetEngine: engineForIntent(intent),
      inputSlice: chunk,
      priority: idx + 1,
      dependsOn: prev ? [prev] : undefined,
    });
    prev = id;
  });

  if (tasks.length === 0) {
    tasks.push({
      id: "t1", taskType: "ASK", taskIntent: "ASK",
      targetEngine: "sequenceAI", inputSlice: norm.cleanedText, priority: 1,
    });
  }

  return {
    tasks,
    executionOrder: tasks.map((t) => t.id),
    canAnswerDirectly: tasks.length <= 1,
    needsClarification: norm.cleanedText.trim().length < 4,
  };
}
