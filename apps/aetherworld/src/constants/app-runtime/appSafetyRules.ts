export interface AppSafetyRule {
  id: string;
  rule: string;
  severity: "WARN" | "CRITICAL";
}

export const APP_SAFETY_RULES: AppSafetyRule[] = [
  { id: "SAFE-001", rule: "不得执行危险代码或 eval 不可信输入", severity: "CRITICAL" },
  { id: "SAFE-002", rule: "不得让用户输入密码 / token / 支付信息", severity: "CRITICAL" },
  { id: "SAFE-003", rule: "不得声称代码已部署或可生产上线", severity: "CRITICAL" },
  { id: "SAFE-004", rule: "不得删除现有项目功能", severity: "CRITICAL" },
  { id: "SAFE-005", rule: "不得绕过 QA 与治理", severity: "CRITICAL" },
  { id: "SAFE-006", rule: "Founder-only 信息不得泄漏", severity: "CRITICAL" },
  { id: "SAFE-007", rule: "Demo / Real 不得混淆", severity: "WARN" },
  { id: "SAFE-008", rule: "外部 API / 数据库 / 登录功能需额外人工确认", severity: "WARN" },
];

export const APP_SAFETY_FOOTER = "Aether App Runtime v0.1 用于将应用想法转化为需求、架构、文件树、代码草案、预览和外部开发工具交接包。v0.1 生成内容默认是草案项目，不代表生产部署、真实上线或安全审计完成。任何涉及登录、支付、隐私数据、外部 API、数据库或生产部署的功能，都必须经过额外 QA、权限检查和人工确认。";
