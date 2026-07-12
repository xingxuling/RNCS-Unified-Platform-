const KEY = "aether.first-use.workspace-log";

export function recordFirstUseEvent(event: string, payload?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    arr.push({ event, payload: payload ?? {}, at: new Date().toISOString() });
    localStorage.setItem(KEY, JSON.stringify(arr.slice(-200)));
  } catch {}
}

export function listFirstUseEvents() {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}
