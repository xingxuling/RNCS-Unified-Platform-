export interface RealityDataSafetyRule {
  id: string;
  title: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export const REALITY_DATA_SAFETY_RULES: RealityDataSafetyRule[] = [
  { id: "RD_NO_FULL60_OVERWRITE",    title: "禁止用外部数据改写 Full60", description: "Full60 主体数列不可被外部数据自动改写。",   severity: "CRITICAL" },
  { id: "RD_NO_LIGHT20_OVERWRITE",   title: "禁止用外部数据改写 Light20", description: "Light20 不可被外部数据自动改写。",         severity: "CRITICAL" },
  { id: "RD_NO_DEMO_AS_REAL",        title: "Demo 不可作为 Real 证据",    description: "Demo 数据不得当作 Real 证据。",            severity: "CRITICAL" },
  { id: "RD_NO_FICTIONAL_AS_REAL",   title: "虚构世界不可作为现实证据",   description: "FICTIONAL_LORE 不得当作现实证据。",        severity: "CRITICAL" },
  { id: "RD_REQUIRE_SOURCE",         title: "无来源不得标记 VERIFIED",    description: "无来源数据不能被标记为 VERIFIED。",        severity: "HIGH" },
  { id: "RD_HIGH_RISK_BOUNDARY",     title: "高风险领域必须显示安全边界", description: "医疗/法律/金融必须显示专业边界。",         severity: "HIGH" },
  { id: "RD_PRIVACY_PROTECTION",     title: "保护用户私有数据",           description: "USER_PRIVATE 不得对外公开。",              severity: "HIGH" },
  { id: "RD_STALE_FLAGGED",          title: "过期数据必须标记",           description: "stale 数据必须显示提示并触发重算。",       severity: "MEDIUM" },
  { id: "RD_NOT_ABSOLUTE_FACT",      title: "外部数据不是绝对事实",       description: "不得把外部数据陈述为绝对事实。",           severity: "MEDIUM" },
  { id: "RD_FOUNDER_PRIVACY",        title: "Founder 数据隔离",           description: "Founder 私有数据不得进入普通模式。",       severity: "CRITICAL" },
];
