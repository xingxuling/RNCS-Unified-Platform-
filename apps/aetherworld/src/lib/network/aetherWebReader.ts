// 受控 Web 读取器：尝试浏览器端 fetch，失败时回退为「需用户粘贴正文」
// 不携带 cookie / 不自动登录 / 不提交表单。

import { classifyUrlSafety, sanitizeNetworkText } from "./aetherNetworkSafetyPolicy";

export interface WebReadResult {
  ok: boolean;
  status: "OK" | "BLOCKED" | "CORS_BLOCKED" | "NETWORK_ERROR" | "TIMEOUT";
  url: string;
  finalUrl?: string;
  contentType?: string;
  html?: string;
  textPreview?: string;
  error?: string;
  reasons: string[];
}

const DEFAULT_TIMEOUT = 10_000;
const MAX_BYTES = 600_000;

export async function readPublicUrl(url: string, timeoutMs = DEFAULT_TIMEOUT): Promise<WebReadResult> {
  const safety = classifyUrlSafety(url);
  if (safety.status === "BLOCK") {
    return { ok: false, status: "BLOCKED", url, reasons: safety.reasons };
  }
  const reasons = [...safety.reasons];

  const ctl = new AbortController();
  const tid = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      mode: "cors",
      credentials: "omit",
      redirect: "follow",
      signal: ctl.signal,
      headers: { "Accept": "text/html,text/plain,application/json;q=0.9,*/*;q=0.5" },
    });
    clearTimeout(tid);
    const contentType = res.headers.get("content-type") ?? "";
    const raw = await res.text();
    const trimmed = raw.length > MAX_BYTES ? raw.slice(0, MAX_BYTES) : raw;
    const sanitized = sanitizeNetworkText(trimmed) ?? "";
    return {
      ok: res.ok,
      status: "OK",
      url,
      finalUrl: res.url,
      contentType,
      html: sanitized,
      textPreview: sanitized.slice(0, 4000),
      reasons,
    };
  } catch (e: unknown) {
    clearTimeout(tid);
    const msg = e instanceof Error ? e.message : String(e);
    if (/aborted/i.test(msg)) return { ok: false, status: "TIMEOUT", url, error: msg, reasons };
    if (/cors|opaque|failed to fetch/i.test(msg)) {
      return {
        ok: false,
        status: "CORS_BLOCKED",
        url,
        error: msg,
        reasons: [...reasons, "浏览器端 CORS 拒绝，请改用手动粘贴正文"],
      };
    }
    return { ok: false, status: "NETWORK_ERROR", url, error: msg, reasons };
  }
}
