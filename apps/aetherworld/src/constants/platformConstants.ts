// 常数宇宙 v1.0 · 平台常数
export type PlatformId =
  | "XIAOHONGSHU" | "WECHAT_MOMENTS" | "QQ_ZONE" | "TWITTER_X"
  | "LINKEDIN" | "PRODUCT_HUNT" | "REDDIT" | "DISCORD"
  | "WEBSITE_DIRECT" | "ENTERPRISE_DEMO";

export interface PlatformConstant {
  id: PlatformId;
  name: string;
  language: "zh-CN" | "en" | "mixed";
  defaultBias: "VISUAL" | "TEXT" | "COMMUNITY" | "PRO";
  weights: Record<string, number>;
}

export const XIAOHONGSHU_CONSTANTS = {
  initialTrafficPool: 200,         // 首池
  titleHookWeight: 1.4,
  coverStopWeight: 1.6,
  tagMatchWeight: 1.1,
  mentionWeight: 0.9,
  pollInteractionWeight: 1.2,
  saveWeight: 1.8,                  // 收藏权重最高
  commentWeight: 1.3,
  shareWeight: 1.5,
  profileClickWeight: 1.2,
  externalLinkPenalty: -0.6,
  adFeelingPenalty: -0.7,
  jargonPenalty: -0.4,
  secondDistributionThreshold: 0.65, // 二次分发阈值（综合互动率）
};

export const PLATFORM_CONSTANTS: PlatformConstant[] = [
  { id: "XIAOHONGSHU",   name: "小红书",       language: "zh-CN", defaultBias: "VISUAL",   weights: XIAOHONGSHU_CONSTANTS as unknown as Record<string, number> },
  { id: "WECHAT_MOMENTS",name: "微信朋友圈",   language: "zh-CN", defaultBias: "TEXT",     weights: { socialGraphWeight: 1.5, externalLinkPenalty: -0.5 } },
  { id: "QQ_ZONE",       name: "QQ空间",       language: "zh-CN", defaultBias: "COMMUNITY",weights: { youthBias: 1.2 } },
  { id: "TWITTER_X",     name: "Twitter / X",  language: "en",    defaultBias: "TEXT",     weights: { replyWeight: 1.3, retweetWeight: 1.5 } },
  { id: "LINKEDIN",      name: "LinkedIn",     language: "en",    defaultBias: "PRO",      weights: { authorityWeight: 1.4 } },
  { id: "PRODUCT_HUNT",  name: "Product Hunt", language: "en",    defaultBias: "PRO",      weights: { launchDayBoost: 2.0 } },
  { id: "REDDIT",        name: "Reddit",       language: "en",    defaultBias: "COMMUNITY",weights: { subredditFitWeight: 1.5 } },
  { id: "DISCORD",       name: "Discord",      language: "mixed", defaultBias: "COMMUNITY",weights: { activeMemberWeight: 1.3 } },
  { id: "WEBSITE_DIRECT",name: "官网直访",     language: "mixed", defaultBias: "PRO",      weights: { intentWeight: 1.6 } },
  { id: "ENTERPRISE_DEMO",name: "企业 Demo",   language: "mixed", defaultBias: "PRO",      weights: { trustWeight: 1.7 } },
];

export const getPlatformConstant = (id: PlatformId) =>
  PLATFORM_CONSTANTS.find((p) => p.id === id);
