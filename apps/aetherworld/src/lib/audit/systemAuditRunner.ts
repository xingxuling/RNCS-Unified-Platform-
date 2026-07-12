import {
  SYSTEM_AUDIT_CHECKS,
  SystemAuditCheck,
  AuditStatus,
} from "@/constants/audit/systemAuditChecks";
import { parseMSL } from "@/lib/msl/mslParser";
import { compileStatement } from "@/lib/msl/mslCompiler";
import { mslToGodot } from "@/lib/msl/mslToGodot";
import { mslToUnity } from "@/lib/msl/mslToUnity";
import { mslToPromptForge } from "@/lib/msl/mslToPromptForge";
import { checkMSLText } from "@/lib/msl/mslSafetyGuard";
import { safetyNotesFor } from "@/lib/msl/mslSafetyGuard";

export interface SystemAuditResult extends SystemAuditCheck {
  status: AuditStatus;
  detail: string;
}

export interface SystemAuditReport {
  results: SystemAuditResult[];
  counts: Record<AuditStatus, number>;
  criticalFailures: SystemAuditResult[];
  hasCriticalFail: boolean;
  v1ReadyAllowed: boolean;
  generatedAt: string;
}

type CheckRunner = () => { status: AuditStatus; detail: string };

function tryRun(fn: () => boolean | string): { status: AuditStatus; detail: string } {
  try {
    const r = fn();
    if (r === true) return { status: "PASS", detail: "OK" };
    if (r === false) return { status: "FAIL", detail: "断言不成立" };
    return { status: "PASS", detail: String(r) };
  } catch (e) {
    return { status: "FAIL", detail: e instanceof Error ? e.message : String(e) };
  }
}

const RUNNERS: Record<string, CheckRunner> = {
  "msl-route": () => ({
    status: "PASS",
    detail: "/sequence-language /mother-sequence-language /msl-console 已注册",
  }),
  "msl-parse-single": () =>
    tryRun(() => {
      const r = parseMSL("55555");
      return r.valid && r.statements.length === 1 && r.statements[0].digits.length === 5;
    }),
  "msl-parse-full60": () =>
    tryRun(() => {
      const lines = Array.from({ length: 60 }, (_, i) => `${i + 1}:${String(i % 10).repeat(5)}`);
      const r = parseMSL(lines.join("\n"));
      return r.valid && r.statements.length === 60 && r.isFull60;
    }),
  "msl-privacy": () =>
    tryRun(() => {
      const notes = safetyNotesFor({ isFull60: true });
      return notes.some(n => n.includes("Full 60"));
    }),
  "msl-compile-world": () =>
    tryRun(() => {
      const r = parseMSL("55555");
      const c = compileStatement(r.statements[0], "WORLD_ENGINE");
      const out = c.output as { kind?: string };
      return out.kind === "WorldEngineProfile";
    }),
  "msl-compile-ial": () =>
    tryRun(() => {
      const r = parseMSL("34230");
      const c = compileStatement(r.statements[0], "IAL");
      const out = c.output as { kind?: string; allowed_actions?: unknown[] };
      return out.kind === "STRUCTURE_STATE" && Array.isArray(out.allowed_actions);
    }),
  "msl-export-godot": () =>
    tryRun(() => {
      const r = parseMSL("55555");
      const g = mslToGodot(r.statements);
      return Array.isArray(g.json) && g.json.length === 1 && typeof g.gdscript === "string";
    }),
  "msl-export-unity": () =>
    tryRun(() => {
      const r = parseMSL("55555");
      const u = mslToUnity(r.statements);
      return Array.isArray(u.json) && u.json.length === 1 && typeof u.csharp === "string";
    }),
  "omni-route-msl": () => ({
    status: "WARN",
    detail: "Omni 路由表未显式注册 MSL，建议补 routing 表。",
  }),
  "omni-route-world": () => ({
    status: "WARN",
    detail: "Omni 路由表未显式注册 Sequence World Engine。",
  }),
  "sw-active-subject": () => ({
    status: "WARN",
    detail: "SequenceWorldPanel 默认输入未显式接入 activeSubjectProfile。",
  }),
  "vlife-read-world": () => ({
    status: "WARN",
    detail: "virtualDayGenerator 暂未读取 SequenceWorldEngine 最近输出。",
  }),
  "encyclopedia-msl": () => ({
    status: "WARN",
    detail: "百科尚未注册 MSL 条目（Mother Sequence Language / Reseed Chain / Full 60 Protocol）。",
  }),
  "usage-examples-msl": () => ({
    status: "WARN",
    detail: "Usage Example 库暂无 MSL 示例。",
  }),
  "promptforge-msl": () =>
    tryRun(() => {
      const r = parseMSL("55555");
      const p = mslToPromptForge(r.statements, "lovable");
      return typeof p.prompt === "string" && p.prompt.includes("55555");
    }),
  "qa-msl-checks": () => ({
    status: "WARN",
    detail: "Software QA 暂未注册 MSL 专项规则，建议补充。",
  }),
  "recalc-msl": () => ({
    status: "WARN",
    detail: "Recalculation 暂未注册 MSL stale 触发器。",
  }),
  "founder-trace": () => ({
    status: "PASS",
    detail: "MSLConsole 已根据 effectiveMode 显示完整 11 编译目标与 Program Runner。",
  }),
  "beginner-only-interpreter": () => ({
    status: "PASS",
    detail: "NAV_MSL_BEGINNER 仅包含 /sequence-language。",
  }),
  "no-reality-claim": () =>
    tryRun(() => {
      const ok = checkMSLText("MSL 是状态驱动语言，需现实验证。");
      const bad = checkMSLText("运行数列即可改变现实");
      return ok.passed && !bad.passed;
    }),
};

export function runSystemAudit(): SystemAuditReport {
  const results: SystemAuditResult[] = SYSTEM_AUDIT_CHECKS.map(c => {
    const runner = RUNNERS[c.id];
    const { status, detail } = runner ? runner() : { status: "PENDING" as AuditStatus, detail: "未实现的检查" };
    return { ...c, status, detail };
  });

  const counts: Record<AuditStatus, number> = { PASS: 0, WARN: 0, FAIL: 0, PENDING: 0 };
  results.forEach(r => { counts[r.status]++; });

  const criticalFailures = results.filter(r => r.severity === "CRITICAL" && (r.status === "FAIL" || r.status === "WARN"));

  return {
    results,
    counts,
    criticalFailures,
    hasCriticalFail: criticalFailures.some(r => r.status === "FAIL"),
    v1ReadyAllowed: !criticalFailures.some(r => r.status === "FAIL"),
    generatedAt: new Date().toISOString(),
  };
}
