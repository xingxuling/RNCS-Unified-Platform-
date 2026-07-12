import type { SocialRiskType } from "./socialRiskTypes";

export interface SocialSafetyRule {
  id: SocialRiskType;
  pattern: RegExp;
  message: string;
  severity: "BLOCK" | "WARN";
}

export const SOCIAL_SAFETY_RULES: SocialSafetyRule[] = [
  { id: "FULL60_LEAK", pattern: /full60[\s_-]?raw|原始数列|Full60Raw/i, message: "检测到 Full60 原始数列，禁止公开。", severity: "BLOCK" },
  { id: "FOUNDER_LEAK", pattern: /founder[\s_-]?only|创始者专属/i, message: "包含 Founder 专属内容，禁止公开发布。", severity: "BLOCK" },
  { id: "SECRET_LEAK", pattern: /(api[_-]?key|secret|token|password|sk-[A-Za-z0-9]{8,})/i, message: "检测到疑似密钥 / Token / 密码。", severity: "BLOCK" },
  { id: "WORKSPACE_DUMP", pattern: /workspace[_-]?dump|私密工作区导出/i, message: "包含私密工作区完整 Dump。", severity: "BLOCK" },
  { id: "DANGEROUS_COMMAND", pattern: /rm\s+-rf\s+\/|sudo\s+rm|format\s+c:/i, message: "包含高危系统命令。", severity: "BLOCK" },
  { id: "UNAUDITED_CODE", pattern: /eval\s*\(|new\s+Function\s*\(/i, message: "包含未审计的危险代码模式。", severity: "WARN" },
  { id: "HIGH_RISK_DOMAIN", pattern: /(确诊|可治愈|保证收益|稳赚|法律责任由)/i, message: "包含医疗 / 法律 / 金融高风险断言。", severity: "WARN" },
  { id: "REALITY_CONFUSION", pattern: /(经官方证实|真实事件|已发生)/i, message: "可能把虚拟内容写成现实事实。", severity: "WARN" },
];
