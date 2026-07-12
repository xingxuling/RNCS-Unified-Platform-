import type {
  AetherStoreItem,
  AetherStoreTransaction,
  AetherStorePublishDraft,
} from "./aetherStoreTypes";
import type { AetherStoreItemStatus } from "@/constants/store/storeItemStatuses";

const STORAGE_KEY = "aether.store.registry.v1";

interface State {
  // 非 WebXXM 条目的本地状态（WebXXM 仍由其原注册表管理）
  itemStatus: Record<string, AetherStoreItemStatus>;
  transactions: AetherStoreTransaction[];
  publishDrafts: AetherStorePublishDraft[];
  favorites: string[];
}

let STATE: State | null = null;
const listeners = new Set<() => void>();

function load(): State {
  if (STATE) return STATE;
  const initial: State = {
    itemStatus: {},
    transactions: [],
    publishDrafts: [],
    favorites: [],
  };
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<State>;
        if (p.itemStatus) initial.itemStatus = p.itemStatus;
        if (p.transactions) initial.transactions = p.transactions.slice(0, 200);
        if (p.publishDrafts) initial.publishDrafts = p.publishDrafts.slice(0, 100);
        if (p.favorites) initial.favorites = p.favorites;
      }
    } catch {}
  }
  STATE = initial;
  return STATE;
}

function persist() {
  if (typeof window === "undefined" || !STATE) return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE)); } catch {}
  listeners.forEach((l) => l());
}

export function subscribeStoreRegistry(l: () => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

export function getLocalStatus(itemId: string): AetherStoreItemStatus | undefined {
  return load().itemStatus[itemId];
}

export function setLocalStatus(itemId: string, status: AetherStoreItemStatus) {
  const s = load();
  s.itemStatus[itemId] = status;
  persist();
}

export function listTransactions(): AetherStoreTransaction[] {
  return [...load().transactions];
}

export function recordTransaction(t: Omit<AetherStoreTransaction, "transactionId" | "createdAt">): AetherStoreTransaction {
  const s = load();
  const rec: AetherStoreTransaction = {
    ...t,
    transactionId: `TX-${Date.now().toString(36)}-${s.transactions.length + 1}`,
    createdAt: new Date().toISOString(),
  };
  s.transactions.unshift(rec);
  if (s.transactions.length > 200) s.transactions.length = 200;
  persist();
  return rec;
}

export function listPublishDrafts(): AetherStorePublishDraft[] {
  return [...load().publishDrafts];
}

export function addPublishDraft(d: Omit<AetherStorePublishDraft, "draftId" | "createdAt" | "updatedAt" | "status" | "qaIssues">, qaIssues: string[] = []): AetherStorePublishDraft {
  const s = load();
  const now = new Date().toISOString();
  const draft: AetherStorePublishDraft = {
    ...d,
    draftId: `DR-${Date.now().toString(36)}-${s.publishDrafts.length + 1}`,
    status: "PUBLISH_DRAFT",
    qaIssues,
    createdAt: now,
    updatedAt: now,
  };
  s.publishDrafts.unshift(draft);
  persist();
  return draft;
}

export function listFavorites(): string[] { return [...load().favorites]; }
export function toggleFavorite(itemId: string) {
  const s = load();
  const i = s.favorites.indexOf(itemId);
  if (i >= 0) s.favorites.splice(i, 1); else s.favorites.unshift(itemId);
  persist();
}

/** 用于发布前安全检查的简易 QA */
export function qaPublishDraft(input: { description: string; name: string }): string[] {
  const issues: string[] = [];
  const txt = `${input.name} ${input.description}`.toLowerCase();
  if (/password|secret|token|api[_\s-]?key/.test(txt)) issues.push("可能包含密钥或敏感凭据。");
  if (/full60/.test(txt)) issues.push("不允许在公开包中分发 Full60。");
  if (/rm\s+-rf|sudo\s+rm/.test(txt)) issues.push("包含危险命令。");
  if (input.name.trim().length < 2) issues.push("名称过短。");
  if (input.description.trim().length < 10) issues.push("描述过短，需补充使用说明。");
  return issues;
}
