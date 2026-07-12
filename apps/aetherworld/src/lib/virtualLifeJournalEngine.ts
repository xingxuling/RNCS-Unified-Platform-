// 虚拟生活日记引擎 · localStorage 持久化
const K_JOURNAL = "aether.virtualLife.journal.v1";

export interface VirtualLifeJournalEntry {
  id: string;
  date: string;
  lifeMode: string;
  dayTitle: string;
  completedQuests: string[];
  skippedQuests: string[];
  npcEncounters: string[];
  realWorldActions: string[];
  emotionalState?: string;
  reflection: string;
  feedbackResult?: string;
  nextDayHint?: string;
  createdAt: string;
}

function isClient() {
  return typeof window !== "undefined" && !!window.localStorage;
}

function read(): VirtualLifeJournalEntry[] {
  if (!isClient()) return [];
  try { return JSON.parse(localStorage.getItem(K_JOURNAL) ?? "[]") as VirtualLifeJournalEntry[]; } catch { return []; }
}

function write(list: VirtualLifeJournalEntry[]) {
  if (!isClient()) return;
  try { localStorage.setItem(K_JOURNAL, JSON.stringify(list)); } catch { /* noop */ }
}

export function loadJournal(): VirtualLifeJournalEntry[] {
  return read().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveJournalEntry(entry: Omit<VirtualLifeJournalEntry, "id" | "createdAt"> & { id?: string }): VirtualLifeJournalEntry {
  const list = read();
  const id = entry.id ?? `journal_${Date.now().toString(36)}`;
  const next: VirtualLifeJournalEntry = { ...entry, id, createdAt: new Date().toISOString() };
  const i = list.findIndex(e => e.id === id);
  if (i >= 0) list[i] = next; else list.unshift(next);
  write(list);
  return next;
}

export function deleteJournalEntry(id: string) {
  write(read().filter(e => e.id !== id));
}

export function exportJournalMarkdown(entry: VirtualLifeJournalEntry): string {
  return `# 虚拟生活日记 · ${entry.date}

主题：${entry.dayTitle}
模式：${entry.lifeMode}

## 完成
${entry.completedQuests.map(s => `- ${s}`).join("\n") || "（无）"}

## 跳过
${entry.skippedQuests.map(s => `- ${s}`).join("\n") || "（无）"}

## NPC 遭遇
${entry.npcEncounters.map(s => `- ${s}`).join("\n") || "（无）"}

## 现实行动
${entry.realWorldActions.map(s => `- ${s}`).join("\n") || "（无）"}

## 情绪
${entry.emotionalState ?? "（未填）"}

## 反思
${entry.reflection || "（无）"}

## 回验
${entry.feedbackResult ?? "（无）"}

## 明日提示
${entry.nextDayHint ?? "（无）"}

---
本日记仅用于个人理解，不代表对现实的预测。
`;
}
