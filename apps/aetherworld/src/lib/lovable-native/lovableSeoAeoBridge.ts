/**
 * Lovable SEO / AEO Bridge
 *
 * 把 Lovable 的 SEO/AEO 检查抽象成 Aetherworld 发布前体检的一项。
 * 真实扫描由 Lovable SEO 系统执行，这里只提供「检查清单」与「摘要结构」。
 */
export type SeoCheckSeverity = "OK" | "INFO" | "WARN" | "FAIL";

export interface SeoCheckItem {
  itemId: string;
  chineseName: string;
  enLabel: string;
  severity: SeoCheckSeverity;
  hint: string;
}

export const SEO_RELEASE_CHECKLIST: SeoCheckItem[] = [
  { itemId: "title",        chineseName: "页面标题",          enLabel: "Title",            severity: "INFO", hint: "每个主路由都应有独立 <title>，不要保留 Lovable 默认。" },
  { itemId: "description",  chineseName: "页面描述",          enLabel: "Description",      severity: "INFO", hint: "<160 字符，包含主关键词。" },
  { itemId: "h1",           chineseName: "H1 标签",           enLabel: "H1",               severity: "INFO", hint: "每页一个 H1，与 title 含义对应。" },
  { itemId: "og",           chineseName: "社交分享卡 (og:*)", enLabel: "Open Graph",       severity: "INFO", hint: "为可分享路由配置 og:title / og:description / og:image。" },
  { itemId: "canonical",    chineseName: "Canonical 链接",    enLabel: "Canonical",        severity: "INFO", hint: "叶子路由设置，避免重复内容。" },
  { itemId: "sitemap",      chineseName: "站点地图",          enLabel: "sitemap.xml",      severity: "INFO", hint: "包含全部公开路由。" },
  { itemId: "robots",       chineseName: "Robots",            enLabel: "robots.txt",       severity: "INFO", hint: "不要在生产环境保留 Disallow: /。" },
  { itemId: "json_ld",      chineseName: "结构化数据",        enLabel: "JSON-LD",          severity: "INFO", hint: "应用 / 文章 / FAQ 等适配 schema.org。" },
  { itemId: "ai_visibility",chineseName: "AI 搜索可见性",      enLabel: "AEO",              severity: "INFO", hint: "AI 搜索关注语义清晰度与可引用性。" },
];

export interface SeoSummary {
  totalChecks: number;
  passCount: number;
  warnCount: number;
  failCount: number;
  highlights: string[];
}

export function summarizeSeoChecklist(items: SeoCheckItem[] = SEO_RELEASE_CHECKLIST): SeoSummary {
  let pass = 0, warn = 0, fail = 0;
  items.forEach((i) => {
    if (i.severity === "OK") pass++;
    else if (i.severity === "WARN") warn++;
    else if (i.severity === "FAIL") fail++;
  });
  return {
    totalChecks: items.length,
    passCount: pass,
    warnCount: warn,
    failCount: fail,
    highlights: items.filter((i) => i.severity === "WARN" || i.severity === "FAIL").map((i) => i.chineseName),
  };
}
