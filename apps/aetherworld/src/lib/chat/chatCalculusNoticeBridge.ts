// Calculus / Tool / Drift / Fingerprint 通知桥。
// 优先调用项目已有 toast；不存在时静默。
import { toast } from "sonner";
import type { CalculusRoute, ConstantsDriftReport } from "./calculusRouteResultTypes";
import { CALCULUS_LABEL } from "./calculusRouteResultTypes";
import type { ChatToolCallResult } from "./chatToolExecutionResult";

export function notifyCalculusRouted(route: CalculusRoute) {
  if (!route.calculusIds.length) return;
  toast.message("已命中计算法路由", {
    description: route.calculusIds.map((id) => CALCULUS_LABEL[id]).join(" → "),
  });
}

export function notifyDrift(report: ConstantsDriftReport) {
  if (report.severity === "NONE") return;
  toast.warning(
    report.severity === "SEVERE" ? "检测到严重常数漂移" : "检测到轻微常数漂移",
    { description: report.notes[0] },
  );
}

export function notifyToolResults(results: ChatToolCallResult[]) {
  for (const r of results) {
    if (r.status === "EXECUTED") toast.success(`工具已执行：${r.toolId}`, { description: r.message });
    else if (r.status === "PENDING_CONFIRM") toast.warning(`工具待确认：${r.toolId}`, { description: r.message });
    else if (r.status === "BLOCKED") toast.error(`工具被阻断：${r.toolId}`, { description: r.message });
  }
}

export function notifyCalculusFallback() {
  toast.message("模型不可用，已使用计算法骨架 Fallback。");
}

export function notifyFingerprint(code: string) {
  toast.message("已生成语义指纹", { description: code });
}
