// 联网 → Chat 桥接：识别意图 + URL，触发只读读取
import { readUrlAsSource, ingestPastedSource, bridgeAll } from "./aetherNetworkRuntime";
import type { NetworkSource } from "./aetherNetworkTypes";

export interface ChatNetworkInfo {
  question: string;
  url?: string;
  source?: NetworkSource;
  status: "PENDING" | "OK" | "FAILED" | "BLOCKED";
  reasons: string[];
  forwardedToOpenArchitecture?: boolean;
}

const URL_RE = /(https?:\/\/[^\s）)】\]，。、,]+)/i;
const TRIGGER = [
  "读取这个链接", "读一下这个", "打开这个网址", "抓一下这个", "看一下这个链接",
  "分析这个 github", "分析这个项目", "查一下官方文档", "查这个文档",
  "搜一下", "查一下", "搜索", "联网", "在线查", "外部资料", "用网上资料",
  "读取链接", "读取网址", "把这个项目吸收",
];

export function detectNetworkIntent(raw: string): boolean {
  if (!raw) return false;
  if (URL_RE.test(raw)) return true;
  return TRIGGER.some((k) => raw.toLowerCase().includes(k.toLowerCase()));
}

export function extractUrl(raw: string): string | undefined {
  const m = raw.match(URL_RE);
  return m ? m[1] : undefined;
}

/** 异步触发联网读取（Chat streaming 中可 fire-and-forget） */
export async function buildChatNetworkInfo(raw: string): Promise<ChatNetworkInfo | undefined> {
  if (!detectNetworkIntent(raw)) return undefined;
  const url = extractUrl(raw);
  if (!url) {
    return {
      question: raw,
      status: "PENDING",
      reasons: ["未提供 URL；请粘贴 https:// 链接或使用 /system/network 工作台"],
    };
  }
  const outcome = await readUrlAsSource(url, /github\.com/i.test(url) ? "OPEN_ARCHITECTURE_ABSORPTION" : "RESEARCH");
  if (!outcome.ok || !outcome.source) {
    return { question: raw, url, status: outcome.raw?.status === "BLOCKED" ? "BLOCKED" : "FAILED", reasons: outcome.reasons };
  }
  await bridgeAll(outcome.source);
  // GitHub / README 自动标记可转交 OA
  const forwardedToOpenArchitecture = /github\.com/i.test(url) || outcome.source.sourceType === "GITHUB_README";
  return {
    question: raw,
    url,
    source: outcome.source,
    status: "OK",
    reasons: outcome.reasons,
    forwardedToOpenArchitecture,
  };
}

export { ingestPastedSource };
