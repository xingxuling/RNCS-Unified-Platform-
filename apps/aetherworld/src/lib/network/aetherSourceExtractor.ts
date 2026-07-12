// 来源类型识别 + 文本抽取（HTML → 纯文本 + 摘要）

import type { NetworkSourceType } from "./aetherNetworkTypes";

export function detectSourceType(url: string, text?: string): NetworkSourceType {
  let host = ""; let path = "";
  try { const u = new URL(url); host = u.hostname.toLowerCase(); path = u.pathname.toLowerCase(); } catch {/* */}
  if (host.includes("github.com")) {
    if (/\/readme/i.test(path) || /raw\.githubusercontent\.com/.test(host)) return "GITHUB_README";
    return "GITHUB_REPO";
  }
  if (host.includes("huggingface.co") && /\/models?\//.test(path)) return "MODEL_CARD";
  if (/docs?\.|developer\.|api\./.test(host)) return /\/api\b|openapi|swagger/.test(path) ? "API_DOCS" : "OFFICIAL_DOCS";
  if (/blog|medium\.com|dev\.to/.test(host) || /\/blog\b/.test(path)) return "BLOG";
  if (/news|nytimes|bbc|reuters/.test(host)) return "NEWS";
  if (text && /^#\s|##\s|readme/i.test(text.slice(0, 200))) return "GITHUB_README";
  return url ? "WEB_PAGE" : "UNKNOWN";
}

/** 极简 HTML → 文本剥离（不引入额外依赖） */
export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function extractTitle(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim().slice(0, 160) : undefined;
}

export function buildSummary(text: string, max = 320): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max).replace(/[，。,.\s][^，。,.\s]*$/, "") + "…";
}
