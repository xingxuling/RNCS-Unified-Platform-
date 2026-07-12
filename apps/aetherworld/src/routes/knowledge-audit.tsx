import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { runKnowledgeAudit } from "@/lib/knowledge/worldKnowledgeEngine";
import { KnowledgeConflictPanel } from "@/components/knowledge/KnowledgeConflictPanel";
import { KnowledgeSafetyNote } from "@/components/knowledge/KnowledgeSafetyNote";

export const Route = createFileRoute("/knowledge-audit")({
  head: () => ({
    meta: [
      { title: "知识审计 · Knowledge Audit" },
      { name: "description", content: "检测冲突、过期、缺失来源与权限风险。" },
    ],
  }),
  component: KnowledgeAuditPage,
});

function KnowledgeAuditPage() {
  const [tick, setTick] = useState(0);
  const result = useMemo(() => runKnowledgeAudit(), [tick]);
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">知识审计</h1>
          <p className="text-sm text-muted-foreground">检查知识库的冲突、过期与权限风险，并给出修复建议。</p>
        </div>
        <Button size="sm" onClick={() => setTick(t => t + 1)}>重新审计</Button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Stat label="条目总数" value={result.totalEntries} />
        <Stat label="冲突" value={result.conflicts.length} hi={result.conflicts.length > 0} />
        <Stat label="过期条目" value={result.staleCount} hi={result.staleCount > 0} />
        <Stat label="缺少来源" value={result.missingSourceCount} hi={result.missingSourceCount > 0} />
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">冲突列表</h2>
        <KnowledgeConflictPanel conflicts={result.conflicts} />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">建议</h2>
        <ul className="text-xs list-disc list-inside text-muted-foreground space-y-1">
          {result.recommendations.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">安全检查</h2>
        {result.safety.triggered.length === 0 ? (
          <div className="text-xs text-muted-foreground">未触发安全规则。</div>
        ) : (
          <ul className="text-xs list-disc list-inside space-y-1">
            {result.safety.triggered.map(t => (
              <li key={t.id}><span className="font-medium">[{t.severity}]</span> {t.label} — {t.description}</li>
            ))}
          </ul>
        )}
      </section>

      <KnowledgeSafetyNote />
    </div>
  );
}

function Stat({ label, value, hi }: { label: string; value: number; hi?: boolean }) {
  return (
    <div className={`rounded-md border p-3 ${hi ? "border-amber-500/40 bg-amber-500/5" : "border-border/60"}`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
