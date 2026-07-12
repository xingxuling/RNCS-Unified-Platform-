import { runCommandCanvas, type CommandCanvasRunResult } from "@/lib/command-canvas/aetherCommandCanvasRuntime";

export interface ChatRuntimeSpineResult {
  runId?: string;
  createdObjectId?: string;
  runType: string;
  status: string;
  summary: string;
  qaStatus: "PASS" | "WARN" | "BLOCK";
  blocked: boolean;
  blockedReasons: string[];
}

export function callRuntimeSpine(raw: string): ChatRuntimeSpineResult {
  const r: CommandCanvasRunResult = runCommandCanvas(raw);
  const qaStatus: "PASS" | "WARN" | "BLOCK" =
    r.qa.status === "BLOCK" ? "BLOCK" : r.qa.status === "WARN" ? "WARN" : "PASS";
  return {
    runId: r.runId,
    createdObjectId: r.createdObjectId,
    runType: r.command.targetRuntime,
    status: qaStatus === "BLOCK" ? "BLOCKED" : (qaStatus === "WARN" ? "WARN" : "DONE"),
    summary: r.command.nextActions.join(" → "),
    qaStatus,
    blocked: qaStatus === "BLOCK",
    blockedReasons: r.qa.blockedReasons ?? [],
  };
}
