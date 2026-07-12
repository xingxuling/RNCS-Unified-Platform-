// UI Update Engine — Safety Rules
export interface UISafetyRule {
  ruleId: string;
  description: string;
  enforcement: "BLOCK" | "WARN" | "AUDIT";
  founderLocked: boolean;
}

export const UI_SAFETY_RULES: UISafetyRule[] = [
  { ruleId: "UI-S-001", description: "普通用户不得看到 Founder-only 页面入口",       enforcement: "BLOCK", founderLocked: true },
  { ruleId: "UI-S-002", description: "Demo 用户不得直接进入 Full60 深度输出",         enforcement: "BLOCK", founderLocked: true },
  { ruleId: "UI-S-003", description: "未设置真实主体不得显示 Real 结果",             enforcement: "BLOCK", founderLocked: true },
  { ruleId: "UI-S-004", description: "Founder Terminal 必须有权限保护",              enforcement: "BLOCK", founderLocked: true },
  { ruleId: "UI-S-005", description: "Full60 导出按钮必须显示隐私提示",              enforcement: "WARN",  founderLocked: true },
  { ruleId: "UI-S-006", description: "数列货币 UI 不得使用现实货币词汇",             enforcement: "BLOCK", founderLocked: true },
  { ruleId: "UI-S-007", description: "世界引擎 UI 不得把虚拟世界说成现实预测",       enforcement: "BLOCK", founderLocked: true },
  { ruleId: "UI-S-008", description: "常数 / 宪法 UI 不允许普通用户修改 Founder Locked", enforcement: "BLOCK", founderLocked: true },
  { ruleId: "UI-S-009", description: "核心页面必须包含 SubjectModeBadge",            enforcement: "WARN",  founderLocked: false },
  { ruleId: "UI-S-010", description: "高风险页面必须包含 Safety Note",               enforcement: "WARN",  founderLocked: false },
  { ruleId: "UI-S-011", description: "不允许快速开始按钮指向无效路由",               enforcement: "BLOCK", founderLocked: false },
  { ruleId: "UI-S-012", description: "快速开始不得只显示高级术语",                   enforcement: "WARN",  founderLocked: false },
];

export const UI_SAFETY_FOOTER =
  "UI 界面更新引擎用于根据当前系统模块、权限、主体模式和安全规则生成快速开始、侧边栏、首页、空状态和示例入口。它不会绕过系统宪法、Founder 权限、Full60 隐私边界或安全规则。";
