// 真实主体（60 组）数据层 · 仅本地保存
import type { SubjectSequenceMode } from "@/constants/subjectSequenceModes";

const K_FULL = "aether.realSubject.full60.v1";
const K_MODE = "aether.realSubject.mode.v1";

export interface RealSubjectRecord {
  name?: string;
  rows: number[][];      // 60 × 5
  updatedAt: string;
}

function isClient() {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function loadFullSubject(): RealSubjectRecord | null {
  if (!isClient()) return null;
  try {
    const raw = window.localStorage.getItem(K_FULL);
    if (!raw) return null;
    return JSON.parse(raw) as RealSubjectRecord;
  } catch {
    return null;
  }
}

export function saveFullSubject(rec: RealSubjectRecord) {
  if (!isClient()) return;
  window.localStorage.setItem(K_FULL, JSON.stringify(rec));
}

export function deleteFullSubject() {
  if (!isClient()) return;
  window.localStorage.removeItem(K_FULL);
}

export function getSequenceMode(): SubjectSequenceMode {
  if (!isClient()) return "DEMO";
  return (window.localStorage.getItem(K_MODE) as SubjectSequenceMode) || "DEMO";
}

export function setSequenceMode(mode: SubjectSequenceMode) {
  if (!isClient()) return;
  window.localStorage.setItem(K_MODE, mode);
}
