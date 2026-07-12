import type { WebCapabilityId } from "@/constants/web-capability/webCapabilityTypes";

interface RouteRule {
  capability: WebCapabilityId;
  keywords: string[];
  combineWith?: WebCapabilityId[];
}

const RULES: RouteRule[] = [
  { capability: "WEB_CODE_M",     keywords: ["代码", "code", "bug", "修复", "import", "react", "组件", "patch", "运行", "fix"] },
  { capability: "WEB_PRODUCT_M",  keywords: ["产品", "需求", "mvp", "prd", "用户故事", "功能", "app", "做一个"], combineWith: ["WEB_CODE_M"] },
  { capability: "WEB_DESIGN_M",   keywords: ["设计", "ui", "布局", "页面", "视觉", "风格", "组件层级", "design"] },
  { capability: "WEB_MUSIC_M",    keywords: ["歌", "歌词", "音乐", "suno", "udio", "声线", "ost", "主题曲", "vocal"] },
  { capability: "WEB_STORY_M",    keywords: ["剧情", "小说", "漫画", "任务文本", "故事", "章节", "scene", "story", "narrative"] },
  { capability: "WEB_RESEARCH_M", keywords: ["研究", "对比", "资料", "整理", "report", "research", "证据"] },
  { capability: "WEB_BIZ_M",      keywords: ["商业", "销售", "poc", "定价", "市场", "business", "pricing"] },
  { capability: "WEB_TEACH_M",    keywords: ["教学", "学习", "课程", "练习", "tutorial", "course", "lesson"] },
  { capability: "WEB_OPS_M",      keywords: ["运营", "公告", "发布", "release note", "更新日志", "社媒", "推广"] },
  { capability: "WEB_STRATEGY_M", keywords: ["战略", "路线", "优先级", "下一步", "跃迁", "缺层", "roadmap", "strategy"] },
  { capability: "WEB_GAME_M",     keywords: ["游戏", "关卡", "机制", "任务", "godot", "unity", "game"] },
  { capability: "WEB_AGENT_M",    keywords: ["agent", "自动化", "工具调用", "binding", "memory", "权限"] },
];

export interface WebCapabilityRouteResult {
  primary: WebCapabilityId;
  combinedWith: WebCapabilityId[];
  matched: { capability: WebCapabilityId; score: number; hits: string[] }[];
  fallback: boolean;
}

export function routeWebCapability(task: string): WebCapabilityRouteResult {
  const lower = task.toLowerCase();
  const scored = RULES.map((r) => {
    const hits = r.keywords.filter((k) => lower.includes(k.toLowerCase()));
    return { capability: r.capability, score: hits.length, hits, combineWith: r.combineWith ?? [] };
  }).filter((s) => s.score > 0).sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return { primary: "WEB_PRODUCT_M", combinedWith: [], matched: [], fallback: true };
  }
  const primary = scored[0];
  return {
    primary: primary.capability,
    combinedWith: primary.combineWith.filter((c) => c !== primary.capability),
    matched: scored.map(({ capability, score, hits }) => ({ capability, score, hits })),
    fallback: false,
  };
}
