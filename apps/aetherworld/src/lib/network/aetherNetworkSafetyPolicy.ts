// 联网安全策略：仅允许只读公开内容，剥离敏感模式

import type { NetworkSafetyStatus } from "./aetherNetworkTypes";

const SECRET_PATTERNS = [
  /sk-[a-zA-Z0-9]{16,}/g,
  /Bearer\s+[A-Za-z0-9\-_.=]+/gi,
  /api[_-]?key\s*[:=]\s*['\"]?[A-Za-z0-9\-_]{16,}/gi,
  /password\s*[:=]\s*['\"][^'\"]{4,}/gi,
];

const BLOCK_HOST_PATTERNS = [
  /^(localhost|127\.0\.0\.1)$/i,
  /\.local$/i,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
];

export function classifyUrlSafety(url: string): { status: NetworkSafetyStatus; reasons: string[] } {
  const reasons: string[] = [];
  let parsed: URL;
  try { parsed = new URL(url); } catch { return { status: "BLOCK", reasons: ["URL 无法解析"] }; }
  if (!/^https?:$/.test(parsed.protocol)) {
    return { status: "BLOCK", reasons: [`协议 ${parsed.protocol} 不允许，只支持 http/https`] };
  }
  if (BLOCK_HOST_PATTERNS.some((re) => re.test(parsed.hostname))) {
    return { status: "BLOCK", reasons: [`禁止读取内网 / 本地地址：${parsed.hostname}`] };
  }
  // 登录 / 提交 / 写入类路径直接 BLOCK：v0.1 不允许写
  if (/\/(login|signin|signup|register|logout|oauth|checkout|pay|admin)\b/i.test(parsed.pathname)) {
    return { status: "BLOCK", reasons: ["命中登录 / 提交 / 支付 / 后台路径，v0.1 禁止"] };
  }
  if (parsed.search && /token=|access_token=|password=/i.test(parsed.search)) {
    reasons.push("URL 查询包含疑似凭据，已警告");
    return { status: "WARN", reasons };
  }
  return { status: "PASS", reasons };
}

export function sanitizeNetworkText(text: string | undefined): string | undefined {
  if (!text) return text;
  let out = text;
  for (const re of SECRET_PATTERNS) out = out.replace(re, "[REDACTED]");
  return out;
}

/** v0.1 总开关：禁止任何写入外部世界的动作。返回 false 即拦截。 */
export function isWriteActionAllowed(): boolean {
  return false;
}
