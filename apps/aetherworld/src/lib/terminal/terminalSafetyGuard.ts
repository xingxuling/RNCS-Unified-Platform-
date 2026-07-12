import { TERMINAL_SAFETY_RULES } from "@/constants/terminal/terminalSafetyRules";
import type { ParsedTerminalCommand } from "./terminalCommandParser";

export interface SafetyCheck {
  blocked: boolean;
  requireConfirm: boolean;
  notes: string[];
  triggeredRules: string[];
}

export interface SafetyContext {
  subjectMode: "DEMO" | "REAL" | "FOUNDER";
  permission: string;
  full60Active: boolean;
  confirmed?: boolean;
}

const DANGEROUS_TEXT_PATTERNS = [
  /rm\s+-rf/i,
  /drop\s+table/i,
  /format\s+c:/i,
  /(诊断|处方|确诊|投资买入|必胜|稳赚)/,
];

export function checkSafety(parsed: ParsedTerminalCommand, ctx: SafetyContext): SafetyCheck {
  const notes: string[] = [];
  const triggered: string[] = [];
  let blocked = false;
  let requireConfirm = false;

  const def = parsed.resolvedDefinition;
  const fullText = `${parsed.raw} ${parsed.quotedText ?? ""}`;

  // Founder 命令越权 → 已经在 PermissionGuard 处理，这里只追加 note
  if (def?.requiredPermission === "FOUNDER" && ctx.subjectMode !== "FOUNDER") {
    notes.push("此命令属于 Founder 范畴，请在 Founder Mode 下执行。");
    triggered.push("NO_PRIVILEGE_ESCALATION");
  }

  // Demo / Real 隔离
  if (ctx.subjectMode === "DEMO" && def && !def.readOnly) {
    notes.push("当前为 Demo 模式：写入与导出动作将被降级或拦截，请切换到 Real 主体后再操作。");
    triggered.push("NO_DEMO_REAL_MIX");
    if (parsed.command === "export") {
      blocked = true;
    }
  }

  // Full60 / 私有导出需确认
  if (parsed.command === "export") {
    const fmtPrivate = ctx.full60Active || /full.?60|private|user_private/i.test(fullText);
    if (fmtPrivate && !ctx.confirmed) {
      requireConfirm = true;
      notes.push("Full60 / 私有数据导出需要二次确认。请在导出面板再次确认。");
      triggered.push("NO_PRIVATE_EXPORT");
    }
    notes.push("导出资产将附带 metadata（exportedAt / subjectMode / privacy / safetyNotes）。");
    triggered.push("EXPORT_METADATA");
  }

  // 危险代码 / 关键词
  for (const re of DANGEROUS_TEXT_PATTERNS) {
    if (re.test(fullText)) {
      notes.push("检测到高风险关键词（医疗 / 法律 / 金融 / 危险代码），输出已降级为提示。");
      triggered.push("NO_DANGEROUS_CODE");
      triggered.push("NO_MEDICAL_LEGAL");
      blocked = true;
      break;
    }
  }

  // MSL 预测说明
  if (def?.targetEngine === "msl") {
    notes.push("MSL 输出为母体数列推演，不等同于现实事实。");
    triggered.push("NO_PREDICTION_GUARANTEE");
  }

  // 模糊目标
  if (parsed.command === "encyclopedia.write" && parsed.args.length === 0) {
    blocked = true;
    notes.push("目标 entryId 不明确，已拦截。请提供 encyclopedia.write <entryId>。");
    triggered.push("AMBIGUOUS_TARGET");
  }

  return { blocked, requireConfirm, notes, triggeredRules: Array.from(new Set(triggered)) };
}

export function describeTriggeredRules(ids: string[]): string[] {
  return ids
    .map((id) => TERMINAL_SAFETY_RULES.find((r) => r.id === id))
    .filter(Boolean)
    .map((r) => `[${r!.severity}] ${r!.label}：${r!.description}`);
}
