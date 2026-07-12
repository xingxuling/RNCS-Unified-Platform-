// 层补齐规划器：基于 LayerGapItem 自动生成 P0/P1 补齐动作。
import type {
  LayerAspect,
  LayerActionType,
  LayerCompletionAction,
  LayerGapItem,
  LayerPriority,
  LayerRiskLevel,
} from "./layerAuditTypes";

interface AspectActionHint {
  actionType: LayerActionType;
  riskLevel: LayerRiskLevel;
  filePattern: (layerId: string) => string[];
  titleSuffix: string;
}

const ASPECT_HINT: Record<LayerAspect, AspectActionHint> = {
  SKELETON: {
    actionType: "CREATE_REGISTRY",
    riskLevel: "LOW",
    titleSuffix: "补齐骨架（类型 / 注册表 / 状态机）",
    filePattern: (id) => [`src/lib/${id.toLowerCase()}/registry.ts`, `src/lib/${id.toLowerCase()}/types.ts`],
  },
  MUSCLE: {
    actionType: "CREATE_BRIDGE",
    riskLevel: "MEDIUM",
    titleSuffix: "补齐肌肉（Runtime / Executor / Adapter）",
    filePattern: (id) => [`src/lib/${id.toLowerCase()}/runtime.ts`, `src/lib/${id.toLowerCase()}/executor.ts`],
  },
  BLOOD: {
    actionType: "CONNECT_RECORD",
    riskLevel: "LOW",
    titleSuffix: "接通血液（Record / Memory / Currency / MSL / Analytics）",
    filePattern: (id) => [`src/lib/${id.toLowerCase()}/recordBridge.ts`, `src/lib/${id.toLowerCase()}/memoryBridge.ts`],
  },
  NERVE: {
    actionType: "CONNECT_SCHEDULER",
    riskLevel: "MEDIUM",
    titleSuffix: "接通神经（Scheduler / Notice / QA / Review）",
    filePattern: (id) => [`src/lib/${id.toLowerCase()}/schedulerBridge.ts`, `src/lib/${id.toLowerCase()}/noticeBridge.ts`],
  },
};

function pickPriority(score: number): LayerPriority {
  if (score < 50) return "P0";
  if (score < 65) return "P1";
  if (score < 80) return "P2";
  return "P3";
}

function makeAction(
  item: LayerGapItem,
  aspect: LayerAspect,
  status: { score: number; missing: string[]; duplicated: string[] },
): LayerCompletionAction | undefined {
  if (status.missing.length === 0 && status.duplicated.length === 0) return undefined;
  const hint = ASPECT_HINT[aspect];
  const isMerge = status.duplicated.length > 0 && status.missing.length === 0;
  const actionType: LayerActionType = isMerge ? "MERGE_DUPLICATE" : hint.actionType;
  const priority = pickPriority(status.score);
  const missingDesc = status.missing.length
    ? `缺：${status.missing.slice(0, 3).join("、")}`
    : "";
  const dupDesc = status.duplicated.length
    ? `重复：${status.duplicated.slice(0, 2).join("、")}`
    : "";
  return {
    id: `LCA-${item.layerId}-${aspect}`,
    title: `${item.layerId} · ${item.layerName}：${hint.titleSuffix}`,
    targetLayer: item.layerId,
    aspect,
    priority,
    actionType,
    description: [missingDesc, dupDesc].filter(Boolean).join("；") || "补齐缺口。",
    suggestedFiles: hint.filePattern(item.layerId),
    riskLevel: hint.riskLevel,
  };
}

export function planLayerCompletion(items: LayerGapItem[]): LayerCompletionAction[] {
  const actions: LayerCompletionAction[] = [];
  for (const it of items) {
    (["SKELETON", "MUSCLE", "BLOOD", "NERVE"] as LayerAspect[]).forEach((asp) => {
      const status =
        asp === "SKELETON" ? it.skeleton :
        asp === "MUSCLE"   ? it.muscle   :
        asp === "BLOOD"    ? it.blood    : it.nerve;
      const a = makeAction(it, asp, status);
      if (a) actions.push(a);
    });
  }
  return actions;
}

export function attachActionsToItems(
  items: LayerGapItem[],
  actions: LayerCompletionAction[],
): LayerGapItem[] {
  return items.map((it) => ({
    ...it,
    recommendedActions: actions.filter((a) => a.targetLayer === it.layerId),
  }));
}

export function splitByPriority(actions: LayerCompletionAction[]) {
  return {
    p0: actions.filter((a) => a.priority === "P0"),
    p1: actions.filter((a) => a.priority === "P1"),
    p2: actions.filter((a) => a.priority === "P2"),
    p3: actions.filter((a) => a.priority === "P3"),
  };
}

/** 把动作转为可复制的 Lovable 提示词草案（不执行，仅文本） */
export function buildLovablePromptDraft(action: LayerCompletionAction): string {
  return [
    `请执行 ${action.targetLayer} ${action.aspect} 补齐：${action.title}`,
    `优先级：${action.priority}，风险：${action.riskLevel}`,
    `动作类型：${action.actionType}`,
    `说明：${action.description}`,
    `建议文件：`,
    ...action.suggestedFiles.map((f) => ` - ${f}`),
    `禁止：自动迁移高风险逻辑、修改 Responsive Shell、修改 Ollama Provider。`,
  ].join("\n");
}
