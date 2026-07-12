// 来源可信度评分：基于域名 + 路径特征
import type { NetworkSourceType } from "./aetherNetworkTypes";

const HIGH_TRUST_DOMAINS = [
  "github.com", "developer.mozilla.org", "w3.org", "ietf.org", "rfc-editor.org",
  "python.org", "nodejs.org", "typescriptlang.org", "react.dev", "vercel.com",
  "cloudflare.com", "openai.com", "anthropic.com", "google.com", "tanstack.com",
  "huggingface.co", "kubernetes.io", "rust-lang.org", "wikipedia.org", "arxiv.org",
  "supabase.com", "vitejs.dev", "tailwindcss.com",
];

const MID_TRUST_DOMAINS = [
  "stackoverflow.com", "dev.to", "medium.com", "smashingmagazine.com",
  "css-tricks.com", "freecodecamp.org", "digitalocean.com",
];

const LOW_TRUST_HINTS = [/seo/i, /\.cn-mirror\./i, /aggregat/i, /clickbait/i];

export function scoreTrust(url: string, sourceType: NetworkSourceType): number {
  let host = "";
  try { host = new URL(url).hostname.toLowerCase(); } catch { return 0.3; }

  if (HIGH_TRUST_DOMAINS.some((d) => host === d || host.endsWith("." + d))) return 0.95;
  if (sourceType === "GITHUB_REPO" || sourceType === "GITHUB_README") return 0.9;
  if (sourceType === "OFFICIAL_DOCS" || sourceType === "API_DOCS" || sourceType === "MODEL_CARD") return 0.85;
  if (MID_TRUST_DOMAINS.some((d) => host === d || host.endsWith("." + d))) return 0.6;
  if (LOW_TRUST_HINTS.some((re) => re.test(host) || re.test(url))) return 0.2;
  if (sourceType === "BLOG") return 0.5;
  if (sourceType === "NEWS") return 0.55;
  return 0.45;
}

export function trustLabel(score: number): "高可信" | "中可信" | "低可信" {
  if (score >= 0.75) return "高可信";
  if (score >= 0.45) return "中可信";
  return "低可信";
}
