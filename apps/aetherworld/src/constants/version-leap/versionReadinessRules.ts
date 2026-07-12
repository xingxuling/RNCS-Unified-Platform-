export interface ReadinessRule {
  id: string;
  label: string;
  severityIfFail: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  hint: string;
}

export const VERSION_READINESS_RULES: ReadinessRule[] = [
  { id: "QA_PASS",            label: "Software QA 通过或可接受 WARN", severityIfFail: "CRITICAL", hint: "前往 /software-qa 重新扫描。" },
  { id: "UI_NO_CRITICAL",     label: "Interface Audit 无 CRITICAL",   severityIfFail: "CRITICAL", hint: "前往 /interface-audit 修复。" },
  { id: "DOCS_NO_CRITICAL",   label: "Docs Audit 无 CRITICAL",        severityIfFail: "HIGH",     hint: "前往 /docs-audit。" },
  { id: "TEXT_NO_CRITICAL",   label: "Text Audit 无 CRITICAL",        severityIfFail: "HIGH",     hint: "前往 /text-audit。" },
  { id: "CONSTANT_NO_CRITICAL", label: "Constant Audit 无 CRITICAL",  severityIfFail: "CRITICAL", hint: "前往 /constant-audit。" },
  { id: "CONSTITUTION_OK",    label: "宪法合规无 CRITICAL",            severityIfFail: "CRITICAL", hint: "前往 /constitution-violations。" },
  { id: "DEAD_ROUTES_ZERO",   label: "Dead routes = 0",               severityIfFail: "HIGH",     hint: "前往 /subroute-audit。" },
  { id: "FOUNDER_NOT_EXPOSED",label: "Founder-only 未暴露",           severityIfFail: "CRITICAL", hint: "审查权限规则。" },
  { id: "FULL60_PRIVACY",     label: "Full60 隐私提示存在",            severityIfFail: "HIGH",     hint: "检查 Full60 入口安全文案。" },
  { id: "CURRENCY_NON_FIN",   label: "数列货币非金融化",               severityIfFail: "CRITICAL", hint: "检查货币相关文案。" },
  { id: "WORLD_NOT_REALITY",  label: "虚拟世界 ≠ 现实",                severityIfFail: "HIGH",     hint: "检查世界引擎文案。" },
  { id: "QUICK_START_OK",     label: "Quick Start 覆盖核心入口",       severityIfFail: "MEDIUM",   hint: "前往 /quick-start-manager。" },
  { id: "EXAMPLES_OK",        label: "Usage Examples 覆盖核心模块",    severityIfFail: "MEDIUM",   hint: "前往 /ui-update-engine。" },
  { id: "EMPTY_STATES_OK",    label: "Empty States 覆盖核心页面",      severityIfFail: "MEDIUM",   hint: "前往 /ui-update-engine。" },
  { id: "RECALC_OK",          label: "Recalculation stale 可接受",     severityIfFail: "MEDIUM",   hint: "前往 /recalculation。" },
  { id: "RELEASE_NOTES_OK",   label: "Release Notes 已生成",           severityIfFail: "MEDIUM",   hint: "前往 /release-notes。" },
];
