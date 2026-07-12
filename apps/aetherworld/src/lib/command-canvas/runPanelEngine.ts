import type { RunPanelStatus, RunType } from "@/constants/command-canvas/runPanelStatuses";

export interface RunPanelItem {
  runId: string;
  runType: RunType;
  title: string;
  status: RunPanelStatus;
  startedAt: string;
  finishedAt?: string;
  summary: string;
  targetObjectId?: string;
  qaStatus?: string;
}

const RUNS: RunPanelItem[] = [];

export function addRun(item: Omit<RunPanelItem, "runId" | "startedAt"> & { runId?: string; startedAt?: string }): RunPanelItem {
  const full: RunPanelItem = {
    runId: item.runId ?? `RUN-${Date.now().toString(36)}-${RUNS.length + 1}`,
    startedAt: item.startedAt ?? new Date().toISOString(),
    ...item,
  } as RunPanelItem;
  RUNS.unshift(full);
  if (RUNS.length > 200) RUNS.length = 200;
  return full;
}

export function listRuns(): RunPanelItem[] { return RUNS.slice(); }
export function getRun(id: string): RunPanelItem | undefined { return RUNS.find((r) => r.runId === id); }

// Seed a few demo runs so the panel never looks empty.
if (RUNS.length === 0) {
  addRun({ runType: "WEBLLM_RUN", title: "WebLLM 引擎检测", status: "DONE", summary: "本地 WebGPU 可用性已检测", qaStatus: "READY" });
  addRun({ runType: "QA_RUN", title: "系统 QA 巡检", status: "DONE", summary: "无违反系统宪法记录", qaStatus: "READY" });
}
