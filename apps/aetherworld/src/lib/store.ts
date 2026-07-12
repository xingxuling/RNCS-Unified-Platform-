// localStorage 数据层 · 主体 / 当前主体 / 回验
import type { SubjectModel, FeedbackRecord } from "./types";
import { DEMO_SUBJECT } from "./demoPersona";

const K_SUBJECTS = "aether.subjects.v1";
const K_ACTIVE = "aether.activeSubject.v1";
const K_FEEDBACK = "aether.feedback.v1";

function isClient() {
  return typeof window !== "undefined" && !!window.localStorage;
}

function read<T>(key: string, fallback: T): T {
  if (!isClient()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (!isClient()) return;
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ }
}

export function loadSubjects(): SubjectModel[] {
  const list = read<SubjectModel[]>(K_SUBJECTS, []);
  // 始终保证 demo 存在
  if (!list.find((s) => s.id === DEMO_SUBJECT.id)) {
    list.unshift(DEMO_SUBJECT);
    write(K_SUBJECTS, list);
  }
  return list;
}

export function saveSubject(s: SubjectModel) {
  const list = loadSubjects();
  const i = list.findIndex((x) => x.id === s.id);
  if (i >= 0) list[i] = s; else list.push(s);
  write(K_SUBJECTS, list);
  notifyRecalc(i >= 0 ? "SEQUENCE_UPDATED" : "SUBJECT_CHANGED");
}

export function deleteSubject(id: string) {
  if (id === DEMO_SUBJECT.id) return; // demo 不可删
  const list = loadSubjects().filter((s) => s.id !== id);
  write(K_SUBJECTS, list);
  if (getActiveSubjectId() === id) setActiveSubjectId(DEMO_SUBJECT.id);
  notifyRecalc("SUBJECT_DELETED");
}

export function getActiveSubjectId(): string {
  return read<string>(K_ACTIVE, DEMO_SUBJECT.id);
}

export function setActiveSubjectId(id: string) {
  write(K_ACTIVE, id);
  notifyRecalc("SUBJECT_CHANGED");
}

export function getActiveSubject(): SubjectModel {
  const id = getActiveSubjectId();
  return loadSubjects().find((s) => s.id === id) ?? DEMO_SUBJECT;
}

export function loadFeedback(subjectId: string): FeedbackRecord[] {
  const all = read<FeedbackRecord[]>(K_FEEDBACK, []);
  return all.filter((f) => f.subjectId === subjectId);
}

export function saveFeedback(rec: FeedbackRecord) {
  const all = read<FeedbackRecord[]>(K_FEEDBACK, []);
  const i = all.findIndex(
    (f) => f.subjectId === rec.subjectId && f.date === rec.date,
  );
  if (i >= 0) all[i] = rec; else all.push(rec);
  write(K_FEEDBACK, all);
  notifyRecalc(i >= 0 ? "FEEDBACK_UPDATED" : "FEEDBACK_SUBMITTED");
}

export function deleteFeedback(subjectId: string, date: string) {
  const all = read<FeedbackRecord[]>(K_FEEDBACK, []);
  write(K_FEEDBACK, all.filter((f) => !(f.subjectId === subjectId && f.date === date)));
  notifyRecalc("FEEDBACK_DELETED");
}

export function clearAll() {
  if (!isClient()) return;
  window.localStorage.removeItem(K_SUBJECTS);
  window.localStorage.removeItem(K_ACTIVE);
  window.localStorage.removeItem(K_FEEDBACK);
  notifyRecalc("STORAGE_CLEARED");
}

// 间接调用 globalRecalculationEngine.recordTrigger，避免循环依赖：动态 import
function notifyRecalc(trigger: string) {
  if (!isClient()) return;
  import("./globalRecalculationEngine").then((m) => {
    try { m.recordTrigger(trigger as never); } catch { /* noop */ }
  });
}


// 用于触发跨组件刷新
export function emitDataChange() {
  if (!isClient()) return;
  window.dispatchEvent(new CustomEvent("aether:data-change"));
}

export function onDataChange(cb: () => void): () => void {
  if (!isClient()) return () => {};
  const h = () => cb();
  window.addEventListener("aether:data-change", h);
  return () => window.removeEventListener("aether:data-change", h);
}
