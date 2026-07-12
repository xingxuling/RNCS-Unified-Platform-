import { createFileRoute } from "@tanstack/react-router";
import { runCrossFunctional } from "@/lib/cross-functional/crossFunctionalApplicationCalculus";
import { CROSS_FUNCTIONAL_EXAMPLES } from "@/lib/cross-functional/crossFunctionalExamplesRegistry";
import { CrossFunctionalQaPanel } from "@/components/cross-functional/CrossFunctionalQaPanel";
import { CrossFunctionalSafetyNote } from "@/components/cross-functional/CrossFunctionalSafetyNote";

export const Route = createFileRoute("/cross-functional-audit")({
  head: () => ({
    meta: [
      { title: "跨功能审计 · Cross-Functional Audit" },
      { name: "description", content: "对跨功能调度进行意义漂移、安全边界、Demo/Real、Founder 泄漏审计。" },
    ],
  }),
  component: AuditPage,
});

function AuditPage() {
  const reports = CROSS_FUNCTIONAL_EXAMPLES.slice(0, 6).map((ex) => ({
    ex,
    result: runCrossFunctional({ text: ex.inputText, objectTypeHint: ex.inputObjectType }),
  }));
  const totals = reports.reduce(
    (acc, r) => {
      if (r.result.qa.status === "FAIL") acc.fail++;
      else if (r.result.qa.status === "WARN") acc.warn++;
      else acc.pass++;
      if (r.result.safety.blocked) acc.blocked++;
      return acc;
    },
    { pass: 0, warn: 0, fail: 0, blocked: 0 },
  );
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="font-display text-2xl gold-text">跨功能审计</h1>
        <p className="text-sm text-muted-foreground">对常见跨功能调度模式进行漂移、安全与隐私审计。</p>
      </header>
      <CrossFunctionalSafetyNote />
      <div className="aether-card p-4 text-sm">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">汇总</div>
        通过 {totals.pass} · 警告 {totals.warn} · 失败 {totals.fail} · 安全拦截 {totals.blocked}
      </div>
      <div className="space-y-4">
        {reports.map(({ ex, result }) => (
          <div key={ex.id} className="space-y-2">
            <div className="text-sm font-display">{ex.title}</div>
            <CrossFunctionalQaPanel qa={result.qa} drift={result.drift} safety={result.safety} />
          </div>
        ))}
      </div>
    </div>
  );
}
