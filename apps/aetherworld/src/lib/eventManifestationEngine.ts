// 事件表现形式引擎 — 包装常量并按阶段筛选强度
import { getManifestation } from "@/constants/eventManifestations";
import type { EventStageId } from "@/constants/eventStages";

export interface ManifestationView {
  subtle: string[];
  typical: string[];
  strong: string[];
  falseSignals: string[];
  highlight: "subtle" | "typical" | "strong";
}

export function getEventManifestation(eventId: string, stage: EventStageId): ManifestationView {
  const m = getManifestation(eventId);
  const highlight: ManifestationView["highlight"] =
    stage === "PEAKING" || stage === "CONFIRMING" || stage === "ESCALATING" ? "strong"
    : stage === "TRIGGERED" || stage === "FORMING" ? "typical"
    : "subtle";
  return { ...m, highlight };
}
