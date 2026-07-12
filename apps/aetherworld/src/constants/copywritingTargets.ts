// 文案目标 Copywriting Targets
export interface CopywritingTarget {
  id: string;
  name: string;
  enName: string;
  defaultChannel: string;
  defaultLengthHint: string;
  description: string;
  requiresSafetyNote: boolean;
}

export const COPYWRITING_TARGETS: CopywritingTarget[] = [
  { id: "HOMEPAGE_HERO", name: "首页首屏", enName: "Homepage Hero", defaultChannel: "WEBSITE",
    defaultLengthHint: "MICRO", description: "首页主标题与副标题。", requiresSafetyNote: false },
  { id: "BEGINNER_ONBOARDING", name: "新手引导", enName: "Beginner Onboarding", defaultChannel: "IN_APP",
    defaultLengthHint: "SHORT", description: "新手第一次使用的引导文案。", requiresSafetyNote: true },
  { id: "DEMO_EXPLANATION", name: "Demo 说明", enName: "Demo Explanation", defaultChannel: "IN_APP",
    defaultLengthHint: "SHORT", description: "Demo 数据的说明。", requiresSafetyNote: true },
  { id: "PREDICTION_DETAIL_COPY", name: "预测详情文案", enName: "Prediction Detail", defaultChannel: "IN_APP",
    defaultLengthHint: "MEDIUM", description: "预测详情页的用户文案。", requiresSafetyNote: true },
  { id: "FEEDBACK_EXPLANATION", name: "回验说明", enName: "Feedback Explanation", defaultChannel: "IN_APP",
    defaultLengthHint: "SHORT", description: "记录中心的回验说明。", requiresSafetyNote: false },
  { id: "FULL60_PRIVACY_COPY", name: "Full 60 隐私文案", enName: "Full 60 Privacy", defaultChannel: "IN_APP",
    defaultLengthHint: "SHORT", description: "Full 60 隐私提示文案。", requiresSafetyNote: true },
  { id: "FOUNDER_MODE_COPY", name: "创始人模式文案", enName: "Founder Mode Copy", defaultChannel: "IN_APP",
    defaultLengthHint: "SHORT", description: "Founder Mode 入口与说明。", requiresSafetyNote: true },
  { id: "ENCYCLOPEDIA_ENTRY", name: "百科条目", enName: "Encyclopedia Entry", defaultChannel: "ENCYCLOPEDIA",
    defaultLengthHint: "MEDIUM", description: "百科条目正文。", requiresSafetyNote: true },
  { id: "PRODUCT_DOCS_SECTION", name: "产品文档章节", enName: "Product Docs Section", defaultChannel: "PRODUCT_DOCS",
    defaultLengthHint: "LONG", description: "产品文档的一节。", requiresSafetyNote: true },
  { id: "XIAOHONGSHU_POST", name: "小红书笔记", enName: "Xiaohongshu Post", defaultChannel: "XIAOHONGSHU",
    defaultLengthHint: "MEDIUM", description: "小红书正文。", requiresSafetyNote: false },
  { id: "XIAOHONGSHU_TITLE", name: "小红书标题", enName: "Xiaohongshu Title", defaultChannel: "XIAOHONGSHU",
    defaultLengthHint: "MICRO", description: "小红书钩子标题。", requiresSafetyNote: false },
  { id: "ENTERPRISE_SAFE_COPY", name: "企业安全文案", enName: "Enterprise Safe Copy", defaultChannel: "ENTERPRISE_DECK",
    defaultLengthHint: "MEDIUM", description: "面向企业客户的安全去命运化文案。", requiresSafetyNote: true },
  { id: "INVESTOR_PITCH_COPY", name: "投资人文案", enName: "Investor Pitch", defaultChannel: "INVESTOR_PITCH",
    defaultLengthHint: "MEDIUM", description: "投资人/合作方文案。", requiresSafetyNote: true },
  { id: "IN_APP_MICROCOPY", name: "App 内短文案", enName: "In-App Microcopy", defaultChannel: "IN_APP",
    defaultLengthHint: "MICRO", description: "App 内短文案与提示。", requiresSafetyNote: false },
  { id: "ERROR_EMPTY_STATE", name: "空状态/错误", enName: "Error / Empty State", defaultChannel: "IN_APP",
    defaultLengthHint: "MICRO", description: "空状态与错误文案。", requiresSafetyNote: false },
  { id: "CTA_COPY", name: "CTA 按钮", enName: "CTA Copy", defaultChannel: "IN_APP",
    defaultLengthHint: "MICRO", description: "按钮与行动召唤文案。", requiresSafetyNote: false },
  { id: "SAFETY_BOUNDARY_COPY", name: "安全边界文案", enName: "Safety Boundary Copy", defaultChannel: "IN_APP",
    defaultLengthHint: "SHORT", description: "Safety Boundary 显式文案。", requiresSafetyNote: true },
  { id: "WORLD_REPORT_COPY", name: "虚拟世界报告", enName: "World Report", defaultChannel: "EXPORT_REPORT",
    defaultLengthHint: "LONG", description: "虚拟世界叙事报告。", requiresSafetyNote: true },
  { id: "QUEST_DESCRIPTION", name: "任务描述", enName: "Quest Description", defaultChannel: "GAME_LORE",
    defaultLengthHint: "SHORT", description: "虚拟世界任务描述。", requiresSafetyNote: false },
  { id: "NPC_DIALOGUE", name: "NPC 对白", enName: "NPC Dialogue", defaultChannel: "GAME_LORE",
    defaultLengthHint: "SHORT", description: "NPC 对话文案。", requiresSafetyNote: true },
];

export function getCopyTarget(id: string): CopywritingTarget | undefined {
  return COPYWRITING_TARGETS.find(t => t.id === id);
}
