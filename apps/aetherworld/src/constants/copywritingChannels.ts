// 文案渠道 Copywriting Channels
export interface CopywritingChannel {
  id: string;
  name: string;
  enName: string;
  recommendedLength: "MICRO" | "SHORT" | "MEDIUM" | "LONG";
  forbiddenWords: string[];
  CTAStyle: "soft" | "direct" | "none";
  safetyRequirement: "required" | "recommended" | "optional";
  jargonTolerance: "low" | "medium" | "high";
  platformFitRules: string[];
}

export const COPYWRITING_CHANNELS: CopywritingChannel[] = [
  { id: "IN_APP", name: "App 内", enName: "In-App", recommendedLength: "SHORT",
    forbiddenWords: ["保证", "必然", "100%"], CTAStyle: "direct",
    safetyRequirement: "recommended", jargonTolerance: "medium",
    platformFitRules: ["短", "清楚", "下一步明确"] },
  { id: "PRODUCT_DOCS", name: "产品文档", enName: "Product Docs", recommendedLength: "LONG",
    forbiddenWords: ["保证", "必然"], CTAStyle: "soft",
    safetyRequirement: "required", jargonTolerance: "high",
    platformFitRules: ["结构化", "可索引", "覆盖术语解释"] },
  { id: "ENCYCLOPEDIA", name: "百科", enName: "Encyclopedia", recommendedLength: "MEDIUM",
    forbiddenWords: ["保证", "必然", "命中注定"], CTAStyle: "none",
    safetyRequirement: "required", jargonTolerance: "high",
    platformFitRules: ["三层解释", "相关条目", "安全边界"] },
  { id: "XIAOHONGSHU", name: "小红书", enName: "Xiaohongshu", recommendedLength: "MEDIUM",
    forbiddenWords: ["保证", "必然", "100%", "限时秒杀", "立刻购买"], CTAStyle: "soft",
    safetyRequirement: "recommended", jargonTolerance: "low",
    platformFitRules: ["痛点开头", "首段3秒共鸣", "结尾引导评论", "避免广告感"] },
  { id: "WECHAT_MOMENTS", name: "朋友圈", enName: "WeChat Moments", recommendedLength: "SHORT",
    forbiddenWords: ["保证", "必然", "100%"], CTAStyle: "soft",
    safetyRequirement: "recommended", jargonTolerance: "low",
    platformFitRules: ["短", "情绪饱满", "可截图"] },
  { id: "QQ_ZONE", name: "QQ空间", enName: "QQ Zone", recommendedLength: "SHORT",
    forbiddenWords: ["保证", "必然"], CTAStyle: "soft",
    safetyRequirement: "recommended", jargonTolerance: "low",
    platformFitRules: ["年轻语态", "话题感"] },
  { id: "WEBSITE", name: "网站", enName: "Website", recommendedLength: "MEDIUM",
    forbiddenWords: ["保证", "必然"], CTAStyle: "direct",
    safetyRequirement: "recommended", jargonTolerance: "medium",
    platformFitRules: ["首屏冲击", "层级清楚"] },
  { id: "ENTERPRISE_DECK", name: "企业演示", enName: "Enterprise Deck", recommendedLength: "MEDIUM",
    forbiddenWords: ["命运", "算命", "玄学", "保证", "必然"], CTAStyle: "soft",
    safetyRequirement: "required", jargonTolerance: "medium",
    platformFitRules: ["去命运化", "强调流程与验证", "可审计"] },
  { id: "INVESTOR_PITCH", name: "投资人", enName: "Investor Pitch", recommendedLength: "MEDIUM",
    forbiddenWords: ["命运", "算命", "保证回报"], CTAStyle: "soft",
    safetyRequirement: "required", jargonTolerance: "medium",
    platformFitRules: ["市场+模型+护城河", "去命运化", "可验证"] },
  { id: "EMAIL", name: "邮件", enName: "Email", recommendedLength: "MEDIUM",
    forbiddenWords: ["保证", "必然"], CTAStyle: "direct",
    safetyRequirement: "recommended", jargonTolerance: "medium",
    platformFitRules: ["主题简短", "一封一意图"] },
  { id: "SOCIAL_SHORT", name: "短社媒", enName: "Social Short", recommendedLength: "MICRO",
    forbiddenWords: ["保证", "必然"], CTAStyle: "soft",
    safetyRequirement: "optional", jargonTolerance: "low",
    platformFitRules: ["1-2句", "可转发"] },
  { id: "GAME_LORE", name: "游戏世界观", enName: "Game Lore", recommendedLength: "MEDIUM",
    forbiddenWords: ["保证现实结果"], CTAStyle: "none",
    safetyRequirement: "recommended", jargonTolerance: "high",
    platformFitRules: ["叙事语调", "角色视角", "世界感"] },
  { id: "EXPORT_REPORT", name: "导出报告", enName: "Export Report", recommendedLength: "LONG",
    forbiddenWords: ["保证", "必然"], CTAStyle: "soft",
    safetyRequirement: "required", jargonTolerance: "high",
    platformFitRules: ["可存档", "包含安全边界", "可分享给非用户"] },
];

export function getChannel(id: string): CopywritingChannel | undefined {
  return COPYWRITING_CHANNELS.find(c => c.id === id);
}
