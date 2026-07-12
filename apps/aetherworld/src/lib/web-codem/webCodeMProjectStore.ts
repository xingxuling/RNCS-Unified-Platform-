// WebCodeM 项目缓存 — 持久化最近一次创建的 AppProject，用于 CHECK / REPAIR / HANDOFF
import type { AppProjectObject } from "@/lib/app-runtime/appProjectObjectEngine";

const KEY = "aether.web-codem.latest-project.v1";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function saveLatestWebCodeMProject(project: AppProjectObject): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(project));
  } catch {
    /* quota / serialization fallback ignored */
  }
}

export function getLatestWebCodeMProject(): AppProjectObject | undefined {
  if (!isBrowser()) return undefined;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AppProjectObject) : undefined;
  } catch {
    return undefined;
  }
}
