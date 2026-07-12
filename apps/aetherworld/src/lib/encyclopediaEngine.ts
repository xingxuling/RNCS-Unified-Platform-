// 百科核心引擎
import { ENCYCLOPEDIA_SEED_ENTRIES, type EncyclopediaEntry } from "@/constants/encyclopediaSeedEntries";
import { ENCYCLOPEDIA_CATEGORIES } from "@/constants/encyclopediaCategories";

const K_USER_ENTRIES = "aether.encyclopedia.userEntries.v1";

export function loadUserEntries(): EncyclopediaEntry[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(K_USER_ENTRIES) || "[]"); }
  catch { return []; }
}
export function saveUserEntries(entries: EncyclopediaEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(K_USER_ENTRIES, JSON.stringify(entries));
}

export function getAllEntries(): EncyclopediaEntry[] {
  // 用户态条目可覆盖同 id 的种子条目
  const user = loadUserEntries();
  const map = new Map<string, EncyclopediaEntry>();
  for (const s of ENCYCLOPEDIA_SEED_ENTRIES) map.set(s.id, s);
  for (const u of user) map.set(u.id, u);
  return Array.from(map.values());
}

export function getEntryById(id: string): EncyclopediaEntry | undefined {
  return getAllEntries().find(e => e.id === id);
}

export function getEntriesByCategory(category: string): EncyclopediaEntry[] {
  return getAllEntries().filter(e => e.category === category);
}

export interface EncyclopediaCoverage {
  score: number; // 0-100
  totalEntries: number;
  coreConceptCoverage: number;
  moduleCoverage: number;
  calculusCoverage: number;
  userLanguageCoverage: number;
  crossLinkCoverage: number;
  safetyCoverage: number;
  missingEntries: number;
  duplicateDefinitions: number;
  outdatedEntries: number;
  band: "不足" | "基础可用" | "内测可用" | "高覆盖" | "完整百科";
  notes: string[];
}

export function computeEncyclopediaCoverage(): EncyclopediaCoverage {
  const all = getAllEntries();
  const total = all.length;

  const byType = (t: EncyclopediaEntry["entryType"]) => all.filter(e => e.entryType === t);
  const core = byType("CONCEPT");
  const modules = byType("MODULE");
  const calcs = byType("CALCULUS");

  const userLangOk = all.filter(e => e.userFriendlyExplanation && e.userFriendlyExplanation.length > 6).length;
  const xlinkOk = all.filter(e => (e.relatedEntries?.length ?? 0) > 0).length;
  const safetyOk = all.filter(e => (e.safetyNotes?.length ?? 0) > 0).length;

  const coreConceptCoverage = Math.min(100, Math.round((core.length / 20) * 100));
  const moduleCoverage = Math.min(100, Math.round((modules.length / 10) * 100));
  const calculusCoverage = Math.min(100, Math.round((calcs.length / 18) * 100));
  const userLanguageCoverage = Math.round((userLangOk / Math.max(1, total)) * 100);
  const crossLinkCoverage = Math.round((xlinkOk / Math.max(1, total)) * 100);
  const safetyCoverage = Math.round((safetyOk / Math.max(1, total)) * 100);

  // 缺失：约 120 个目标
  const missing = Math.max(0, 120 - total);
  // 重复：title 或 id 重复
  const titleCounts = new Map<string, number>();
  for (const e of all) titleCounts.set(e.title, (titleCounts.get(e.title) ?? 0) + 1);
  const duplicates = Array.from(titleCounts.values()).filter(n => n > 1).length;
  const outdated = all.filter(e => e.status === "DEPRECATED").length;

  const num =
    coreConceptCoverage * moduleCoverage * calculusCoverage *
    userLanguageCoverage * crossLinkCoverage * safetyCoverage;
  const den = Math.pow(100, 5) * Math.max(1, 1 + missing * 0.05 + duplicates * 0.1 + outdated * 0.05);
  let score = Math.round((num / den) * 100);
  score = Math.max(0, Math.min(100, score));

  let band: EncyclopediaCoverage["band"] = "不足";
  if (score >= 95) band = "完整百科";
  else if (score >= 80) band = "高覆盖";
  else if (score >= 60) band = "内测可用";
  else if (score >= 30) band = "基础可用";

  return {
    score, totalEntries: total,
    coreConceptCoverage, moduleCoverage, calculusCoverage,
    userLanguageCoverage, crossLinkCoverage, safetyCoverage,
    missingEntries: missing, duplicateDefinitions: duplicates, outdatedEntries: outdated,
    band,
    notes: [
      `共有 ${total} 条百科条目，分布在 ${ENCYCLOPEDIA_CATEGORIES.length} 个分类。`,
      missing > 0 ? `距离 120 条目标还差 ${missing} 条。` : "条目数已达 v1.0 目标。",
      duplicates > 0 ? `检测到 ${duplicates} 个重复标题。` : "未检测到重复标题。",
    ],
  };
}

export function exportEncyclopediaJSON(): string {
  return JSON.stringify({
    version: "Aether Fate Engine Encyclopedia v1.0",
    exportedAt: new Date().toISOString(),
    entries: getAllEntries(),
  }, null, 2);
}

export function importEncyclopediaJSON(json: string): { ok: boolean; count: number; error?: string } {
  try {
    const data = JSON.parse(json);
    if (!Array.isArray(data.entries)) return { ok: false, count: 0, error: "缺少 entries 字段" };
    saveUserEntries(data.entries);
    return { ok: true, count: data.entries.length };
  } catch (e) {
    return { ok: false, count: 0, error: String(e) };
  }
}
