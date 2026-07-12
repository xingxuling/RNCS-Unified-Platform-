import type { ThingItselfResult } from "@/lib/thingItselfCalculus";
import { buildOntologyPrompt } from "@/lib/thingItselfCalculus";
import { Link } from "@tanstack/react-router";

export function ObjectOntologyReport({ result }: { result: ThingItselfResult }) {
  const md = buildOntologyPrompt(result);
  return (
    <div className="aether-card p-4 space-y-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Ontology Report · 本体读取报告</div>
      <div className="text-sm">
        <div className="font-medium">{result.input.name || "未命名对象"} · {result.typeName}</div>
        <div className="text-xs text-muted-foreground mt-1">阶段：{result.phase.currentPhaseName} · 自洽度：{result.consistency.score}/100</div>
      </div>
      {result.mislabeling.isMislabeling && (
        <div className="text-xs rounded border border-amber-500/30 bg-amber-500/5 px-2 py-1.5">
          ⚠️ 误命名检测：{result.mislabeling.why}
          {result.mislabeling.betterNames.length > 0 && (
            <div className="mt-1">建议名：{result.mislabeling.betterNames.join(" / ")}</div>
          )}
        </div>
      )}
      {result.safety.length > 0 && (
        <div className="text-xs text-amber-400/90">
          {result.safety.map((s, i) => <div key={i}>· {s.message}{s.suggestion ? ` → ${s.suggestion}` : ""}</div>)}
        </div>
      )}
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground">查看 Markdown 报告</summary>
        <pre className="mt-2 p-2 bg-background/60 rounded overflow-auto whitespace-pre-wrap text-[11px]">{md}</pre>
      </details>
      {result.nextEngines.length > 0 && (
        <div className="text-xs">
          <div className="text-muted-foreground mb-1">推荐下一步引擎</div>
          <div className="flex flex-wrap gap-2">
            {result.nextEngines.map(e => (
              <Link key={e} to={`/${e}` as any} className="px-2 py-1 rounded bg-background/60 border border-border/40 hover:border-primary/40">
                {e}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
