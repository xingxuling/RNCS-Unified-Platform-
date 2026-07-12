import { listConstants } from "./webCoMConstantIndexer";
import type { WebCoMConstraintBundle } from "../webKnowledgeTrinityTypes";
import { newWktId } from "../webKnowledgeTrinityTypes";

const BASE = [
  "LOCAL_FIRST",
  "RULE_LAYER_PRIORITY",
  "QA_REQUIRED_FOR_RUNTIME",
  "WORKSPACE_TRACE_REQUIRED",
  "DEMO_REAL_SEPARATION",
  "FULL60_PRIVACY",
  "FOUNDER_ONLY_PROTECTION",
];

export interface ConstraintContext {
  taskType?: "CODE" | "WORLD" | "MODEL" | "DEPLOY" | "CURRENCY" | "GENERAL";
  contextSummary?: string;
}

export function buildConstraintBundle(ctx: ConstraintContext = {}): WebCoMConstraintBundle {
  const ids = new Set<string>(BASE);
  switch (ctx.taskType) {
    case "CODE":
      ids.add("NO_DANGEROUS_CODE"); ids.add("SIMULATION_NOT_EXECUTION"); break;
    case "CURRENCY":
      ids.add("NO_FINANCIALIZATION_OF_SEQUENCE_CURRENCY"); break;
    case "WORLD":
      ids.add("VIRTUAL_NOT_REALITY"); break;
    case "MODEL":
      ids.add("NO_VENDOR_LOCK_IN"); ids.add("RULE_LAYER_PRIORITY"); ids.add("FULL60_PRIVACY"); break;
    case "DEPLOY":
      ids.add("NO_UNSAFE_AUTONOMY"); ids.add("HUMAN_CONFIRMATION_REQUIRED"); break;
  }
  const known = new Set(listConstants().map((c) => c.constantId));
  const appliedConstantIds = [...ids].filter((i) => known.has(i));
  return {
    bundleId: newWktId("cons"),
    appliedConstantIds,
    contextSummary: ctx.contextSummary ?? `taskType=${ctx.taskType ?? "GENERAL"}`,
    taskType: ctx.taskType ?? "GENERAL",
    createdAt: new Date().toISOString(),
  };
}

export function inferTaskType(userIntent: string): ConstraintContext["taskType"] {
  if (/(代码|code|patch|sandbox|执行|build)/i.test(userIntent)) return "CODE";
  if (/(货币|currency|金融|token)/i.test(userIntent)) return "CURRENCY";
  if (/(世界|world|剧情|narrative|预测|玄征)/i.test(userIntent)) return "WORLD";
  if (/(模型|llm|webllm|ai)/i.test(userIntent)) return "MODEL";
  if (/(部署|deploy|发布|执行动作)/i.test(userIntent)) return "DEPLOY";
  return "GENERAL";
}
