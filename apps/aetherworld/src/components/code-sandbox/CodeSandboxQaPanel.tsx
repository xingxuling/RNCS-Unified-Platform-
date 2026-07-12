import type { CodeSandboxQaResult } from "@/lib/code-sandbox/codeRunRequestEngine";

const COLOR: Record<string, string> = {
  PASS: "text-emerald-300",
  WARN: "text-amber-300",
  FAIL: "text-red-400",
  BLOCKED: "text-red-400",
};

export function CodeSandboxQaPanel({ qa }: { qa?: CodeSandboxQaResult }) {
  if (!qa) return null;
  return (
    <div className="border border-border/40 rounded p-3 space-y-1 text-sm">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">QA Recheck · 质量复检</div>
      <div className={`text-base font-medium ${COLOR[qa.status] || ""}`}>{qa.status}</div>
      <ul className="text-[11px] space-y-0.5">
        {qa.issues.map((i) => (
          <li key={i.ruleId} className="flex gap-2">
            <span className="font-mono text-muted-foreground w-16">{i.severity}</span>
            <span>{i.message}</span>
          </li>
        ))}
        {qa.issues.length === 0 && <li className="text-muted-foreground">未发现 QA 问题。</li>}
      </ul>
    </div>
  );
}
