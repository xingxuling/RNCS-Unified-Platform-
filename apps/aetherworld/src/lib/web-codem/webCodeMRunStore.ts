// WebCodeM Run 持久化 — 保存到 Workspace 列表，可在历史中回看
import type { WebCodeMRunRecord } from "./webCodeMTypes";

const KEY = "aether.web-codem.runs.v1";
const MAX = 50;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function saveWebCodeMRun(run: WebCodeMRunRecord): void {
  if (!isBrowser()) return;
  try {
    const list = listWebCodeMRuns().filter((r) => r.runId !== run.runId);
    list.unshift(run);
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* ignore */
  }
}

export function listWebCodeMRuns(): WebCodeMRunRecord[] {
  if (!isBrowser()) return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as WebCodeMRunRecord[];
  } catch {
    return [];
  }
}

export function getLatestWebCodeMRun(): WebCodeMRunRecord | undefined {
  return listWebCodeMRuns()[0];
}
