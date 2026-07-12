// 权重状态本地存储：与 Demo / 真实主体隔离
import { createInitialWeightState, type SubjectWeightState } from "./feedbackWeightEngine";

const K = "aether.feedbackWeights.v1";

function isClient() {
  return typeof window !== "undefined" && !!window.localStorage;
}

function readAll(): Record<string, SubjectWeightState> {
  if (!isClient()) return {};
  try {
    return JSON.parse(window.localStorage.getItem(K) ?? "{}");
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, SubjectWeightState>) {
  if (!isClient()) return;
  window.localStorage.setItem(K, JSON.stringify(map));
}

export function loadWeightState(subjectId: string): SubjectWeightState {
  const all = readAll();
  return all[subjectId] ?? createInitialWeightState(subjectId);
}

export function saveWeightState(state: SubjectWeightState) {
  const all = readAll();
  all[state.subjectId] = state;
  writeAll(all);
}

export function resetWeightState(subjectId: string) {
  const all = readAll();
  delete all[subjectId];
  writeAll(all);
}
