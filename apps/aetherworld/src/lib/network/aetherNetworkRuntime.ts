// Aether Network Runtime · 主运行时
// 统一聚合：读取 → 抽取 → 评分 → 安全 → 转 NetworkSource → 内部桥接（容错）

import {
  nextNetworkId,
  type NetworkSource,
  type NetworkSourceType,
  type NetworkReadRequest,
  type NetworkReadPurpose,
} from "./aetherNetworkTypes";
import { readPublicUrl, type WebReadResult } from "./aetherWebReader";
import { detectSourceType, stripHtml, extractTitle, buildSummary } from "./aetherSourceExtractor";
import { scoreTrust } from "./aetherSourceTrustScorer";
import { classifyUrlSafety } from "./aetherNetworkSafetyPolicy";
import { checkNetworkAction } from "./aetherNetworkPermissionGuard";

// ===== Request 工厂 =====
export function createReadRequest(input: {
  url?: string;
  query?: string;
  purpose?: NetworkReadPurpose;
}): NetworkReadRequest {
  const purpose = input.purpose ?? "RESEARCH";
  return {
    id: nextNetworkId("NRQ"),
    url: input.url,
    query: input.query,
    purpose,
    requiresUserConfirmation: false,
    createdAt: new Date().toISOString(),
  };
}

// ===== Source 构造 =====
function buildSourceFromText(input: {
  url: string;
  rawText?: string;
  html?: string;
  title?: string;
  origin?: NetworkSource["origin"];
  warn?: string[];
}): NetworkSource {
  const text = input.html ? stripHtml(input.html) : (input.rawText ?? "");
  const sourceType: NetworkSourceType = detectSourceType(input.url, text);
  let domain = "";
  try { domain = new URL(input.url).hostname; } catch { /* */ }
  const safety = classifyUrlSafety(input.url);
  return {
    id: nextNetworkId("NS"),
    sourceType,
    url: input.url,
    domain,
    title: input.title ?? (input.html ? extractTitle(input.html) : undefined),
    extractedText: text.slice(0, 8000),
    summary: buildSummary(text || input.rawText || "", 320),
    fetchedAt: new Date().toISOString(),
    trustScore: scoreTrust(input.url, sourceType),
    safetyStatus: safety.status,
    origin: input.origin ?? "FETCH",
    notes: [...safety.reasons, ...(input.warn ?? [])],
  };
}

// ===== 主入口：读取 URL → Source =====
export interface NetworkReadOutcome {
  request: NetworkReadRequest;
  source?: NetworkSource;
  raw?: WebReadResult;
  ok: boolean;
  reasons: string[];
}

export async function readUrlAsSource(url: string, purpose: NetworkReadPurpose = "RESEARCH"): Promise<NetworkReadOutcome> {
  const request = createReadRequest({ url, purpose });
  const perm = checkNetworkAction("READ_URL", purpose);
  if (!perm.allowed) {
    return { request, ok: false, reasons: [perm.reason] };
  }
  const raw = await readPublicUrl(url);
  if (!raw.ok || raw.status !== "OK") {
    return { request, raw, ok: false, reasons: raw.reasons.length ? raw.reasons : [raw.error ?? raw.status] };
  }
  const source = buildSourceFromText({ url: raw.finalUrl ?? url, html: raw.html, origin: "FETCH", warn: raw.reasons });
  appendNetworkSource(source);
  return { request, source, raw, ok: true, reasons: raw.reasons };
}

/** 手动粘贴正文（CORS / 私有页面回退路径） */
export function ingestPastedSource(input: {
  url: string;
  pasted: string;
  title?: string;
  purpose?: NetworkReadPurpose;
}): NetworkReadOutcome {
  const request = createReadRequest({ url: input.url, purpose: input.purpose });
  const source = buildSourceFromText({
    url: input.url,
    rawText: input.pasted,
    title: input.title,
    origin: "MANUAL_PASTE",
  });
  appendNetworkSource(source);
  return { request, source, ok: true, reasons: ["来源为手动粘贴，请注意核实"] };
}

// ===== 简易内存 + localStorage 持久化 =====
const STORE_KEY = "aether.network.sources.v1";
const MAX_KEEP = 100;
let __cache: NetworkSource[] | null = null;

function loadAll(): NetworkSource[] {
  if (__cache) return __cache;
  try {
    if (typeof window === "undefined") { __cache = []; return __cache; }
    const raw = window.localStorage.getItem(STORE_KEY);
    __cache = raw ? (JSON.parse(raw) as NetworkSource[]) : [];
  } catch { __cache = []; }
  return __cache!;
}
function persist() {
  if (typeof window === "undefined" || !__cache) return;
  try { window.localStorage.setItem(STORE_KEY, JSON.stringify(__cache.slice(0, MAX_KEEP))); } catch {/* */}
}

export function appendNetworkSource(src: NetworkSource) {
  const list = loadAll();
  list.unshift(src);
  if (list.length > MAX_KEEP) list.length = MAX_KEEP;
  persist();
}
export function listNetworkSources(limit = 50): NetworkSource[] {
  return loadAll().slice(0, limit);
}
export function getNetworkSource(id: string): NetworkSource | undefined {
  return loadAll().find((s) => s.id === id);
}
export function clearNetworkSources() { __cache = []; persist(); }

// ===== 内部桥接（全部容错调用，模块不可用时仅记录） =====
export async function bridgeAll(source: NetworkSource): Promise<{ delivered: string[]; warnings: string[] }> {
  const delivered: string[] = [];
  const warnings: string[] = [];

  // Record Center
  try {
    const { recordEvent } = await import("@/lib/record-center/recordCenterRuntime");
    recordEvent({
      eventType: "WORKSPACE_OBJECT",
      sourceModule: "Network",
      title: `联网来源 · ${source.title ?? source.url}`,
      summary: source.summary ?? source.url,
      tags: [source.sourceType, `trust:${source.trustScore.toFixed(2)}`],
      status: source.safetyStatus === "BLOCK" ? "BLOCKED" : source.safetyStatus === "WARN" ? "WARN" : "RECORDED",
      relatedIds: { workspaceObjectId: source.id },
    });
    delivered.push("Record");
  } catch (e) { warnings.push("Record 桥接跳过：" + (e as Error).message); }

  return { delivered, warnings };
}
