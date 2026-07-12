import type { CanvasObjectRef } from "./canvasObjectResolver";
import type { InspectorTabId } from "@/constants/command-canvas/inspectorTabTypes";

export interface InspectorViewModel {
  objectId: string;
  objectType: string;
  status: string;
  tabs: { id: InspectorTabId; available: boolean; summary: string }[];
}

export function buildInspectorViewModel(obj: CanvasObjectRef | undefined): InspectorViewModel | null {
  if (!obj) return null;
  return {
    objectId: obj.id,
    objectType: obj.type,
    status: "READY",
    tabs: [
      { id: "OVERVIEW", available: true, summary: obj.summary ?? obj.title },
      { id: "INPUTS", available: true, summary: "输入来源：Sequence AI / Command Center" },
      { id: "OUTPUTS", available: true, summary: "输出结果：保存在 Workspace" },
      { id: "QA", available: true, summary: "QA 状态：READY（未发现阻断）" },
      { id: "TRACE", available: true, summary: "调用路径：Sequence AI → Capability → Runtime" },
      { id: "VERSION", available: true, summary: "版本未发生跃迁" },
      { id: "RECALCULATION", available: true, summary: "无需重算" },
      { id: "CONSTANTS", available: true, summary: "应用常数：USER_VALUE_FIRST 等" },
      { id: "CONCEPTS", available: true, summary: "WebLCM 概念链未生成" },
      { id: "EXPORT", available: true, summary: "可导出为 Handoff Pack" },
    ],
  };
}
