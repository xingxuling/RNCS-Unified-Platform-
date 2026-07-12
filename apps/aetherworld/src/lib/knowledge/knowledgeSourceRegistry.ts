// 世界知识引擎 · 核心数据结构与注册表
import type { KnowledgeTypeId } from "@/constants/knowledge/knowledgeTypes";
import type { KnowledgeSourceTypeId } from "@/constants/knowledge/knowledgeSourceTypes";
import type { KnowledgeAccessLevel } from "@/constants/knowledge/knowledgeAccessLevels";
import type { KnowledgeTrustLevel } from "@/constants/knowledge/knowledgeTrustLevels";
import type { KnowledgeFreshnessLevel } from "@/constants/knowledge/knowledgeFreshnessLevels";
import { DEFAULT_KNOWLEDGE_ENTRIES } from "@/constants/knowledge/defaultKnowledgeDomains";

export interface KnowledgeCitation {
  label: string;
  sourceId: string;
  quote?: string;
  url?: string;
  fileName?: string;
  page?: number;
  note?: string;
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  summary: string;
  body: string;
  knowledgeType: KnowledgeTypeId;
  sourceType: KnowledgeSourceTypeId;
  sourceId?: string;
  tags: string[];
  relatedEngines: string[];
  accessLevel: KnowledgeAccessLevel;
  trustLevel: KnowledgeTrustLevel;
  freshnessLevel: KnowledgeFreshnessLevel;
  citationRequired: boolean;
  citations?: KnowledgeCitation[];
  createdAt: string;
  updatedAt: string;
  stale: boolean;
  language?: string;
}

export interface KnowledgeSource {
  sourceId: string;
  sourceName: string;
  sourceType: KnowledgeSourceTypeId;
  createdAt: string;
  updatedAt: string;
  trustLevel: KnowledgeTrustLevel;
  accessLevel: KnowledgeAccessLevel;
  freshnessLevel: KnowledgeFreshnessLevel;
  citationRequired: boolean;
  ownerMode: "DEMO" | "REAL" | "FOUNDER" | "SYSTEM";
  description?: string;
}

const STORAGE_KEY = "aether.knowledge.entries.v1";
const SOURCE_STORAGE_KEY = "aether.knowledge.sources.v1";

let memoryEntries: KnowledgeEntry[] | null = null;
let memorySources: KnowledgeSource[] | null = null;

function nowIso() { return new Date().toISOString(); }

function loadEntries(): KnowledgeEntry[] {
  if (memoryEntries) return memoryEntries;
  if (typeof window === "undefined") {
    memoryEntries = seedEntries();
    return memoryEntries;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      memoryEntries = JSON.parse(raw) as KnowledgeEntry[];
      return memoryEntries;
    }
  } catch {/* ignore */}
  memoryEntries = seedEntries();
  saveEntries();
  return memoryEntries;
}

function saveEntries() {
  if (typeof window === "undefined" || !memoryEntries) return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryEntries)); } catch {/* ignore */}
}

function loadSources(): KnowledgeSource[] {
  if (memorySources) return memorySources;
  if (typeof window === "undefined") {
    memorySources = seedSources();
    return memorySources;
  }
  try {
    const raw = localStorage.getItem(SOURCE_STORAGE_KEY);
    if (raw) { memorySources = JSON.parse(raw) as KnowledgeSource[]; return memorySources; }
  } catch {/* ignore */}
  memorySources = seedSources();
  saveSources();
  return memorySources;
}

function saveSources() {
  if (typeof window === "undefined" || !memorySources) return;
  try { localStorage.setItem(SOURCE_STORAGE_KEY, JSON.stringify(memorySources)); } catch {/* ignore */}
}

function seedEntries(): KnowledgeEntry[] {
  return DEFAULT_KNOWLEDGE_ENTRIES.map(seed => ({
    ...seed,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    stale: false,
  } as KnowledgeEntry));
}

function seedSources(): KnowledgeSource[] {
  const t = nowIso();
  return [
    { sourceId: "src-encyclopedia", sourceName: "Product Encyclopedia", sourceType: "PRODUCT_ENCYCLOPEDIA", createdAt: t, updatedAt: t, trustLevel: "HIGH", accessLevel: "PUBLIC", freshnessLevel: "SLOW_CHANGING", citationRequired: false, ownerMode: "SYSTEM", description: "系统产品百科。" },
    { sourceId: "src-msl",          sourceName: "MSL Founder Locked", sourceType: "FOUNDER_LOCKED",       createdAt: t, updatedAt: t, trustLevel: "FOUNDER_LOCKED", accessLevel: "PUBLIC", freshnessLevel: "STATIC", citationRequired: false, ownerMode: "FOUNDER", description: "母体数列语言标准定义。" },
    { sourceId: "src-user-local",   sourceName: "Local App State",    sourceType: "LOCAL_APP_STATE",      createdAt: t, updatedAt: t, trustLevel: "HIGH", accessLevel: "USER_PRIVATE", freshnessLevel: "SLOW_CHANGING", citationRequired: false, ownerMode: "REAL", description: "本地浏览器存储。" },
    { sourceId: "src-demo",         sourceName: "Demo Data",          sourceType: "PRODUCT_GENERATED",    createdAt: t, updatedAt: t, trustLevel: "LOW", accessLevel: "PUBLIC", freshnessLevel: "STATIC", citationRequired: false, ownerMode: "DEMO", description: "演示用数据。" },
  ];
}

// public APIs
export function listKnowledgeEntries(): KnowledgeEntry[] { return [...loadEntries()]; }
export function getKnowledgeEntry(id: string): KnowledgeEntry | undefined { return loadEntries().find(e => e.id === id); }
export function upsertKnowledgeEntry(entry: KnowledgeEntry): KnowledgeEntry {
  const list = loadEntries();
  const idx = list.findIndex(e => e.id === entry.id);
  const next: KnowledgeEntry = { ...entry, updatedAt: nowIso() };
  if (idx >= 0) list[idx] = next; else list.unshift(next);
  memoryEntries = list;
  saveEntries();
  return next;
}
export function markEntryStale(id: string, stale = true) {
  const list = loadEntries();
  const e = list.find(x => x.id === id);
  if (e) { e.stale = stale; e.updatedAt = nowIso(); saveEntries(); }
}
export function deleteKnowledgeEntry(id: string) {
  memoryEntries = loadEntries().filter(e => e.id !== id);
  saveEntries();
}

export function listKnowledgeSources(): KnowledgeSource[] { return [...loadSources()]; }
export function getKnowledgeSource(id: string): KnowledgeSource | undefined { return loadSources().find(s => s.sourceId === id); }
export function upsertKnowledgeSource(s: KnowledgeSource): KnowledgeSource {
  const list = loadSources();
  const idx = list.findIndex(x => x.sourceId === s.sourceId);
  const next = { ...s, updatedAt: nowIso() };
  if (idx >= 0) list[idx] = next; else list.unshift(next);
  memorySources = list;
  saveSources();
  return next;
}

export function knowledgeStats() {
  const entries = loadEntries();
  const sources = loadSources();
  return {
    total: entries.length,
    sources: sources.length,
    userPrivate: entries.filter(e => e.accessLevel === "USER_PRIVATE").length,
    founderOnly: entries.filter(e => e.accessLevel === "FOUNDER_ONLY").length,
    stale: entries.filter(e => e.stale).length,
  };
}

export function resetKnowledgeRegistryForTest() {
  memoryEntries = null;
  memorySources = null;
}
