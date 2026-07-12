import { getWebLkmOverview } from "@/lib/web-knowledge-trinity/weblkm/webLkmRuntime";
import type { RetrievedKnowledge } from "@/lib/web-knowledge-trinity/weblkm/webLkmKnowledgeRetriever";

export function WebLkmPanel({ retrieved }: { retrieved?: RetrievedKnowledge[] }) {
  const overview = getWebLkmOverview();
  return (
    <div className="space-y-3 text-xs">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="知识总数" value={overview.index.total} />
        <Stat label="过期项" value={overview.stale.length} />
        <Stat label="冲突项" value={overview.conflicts.length} />
      </div>
      <div className="rounded border border-border/40 p-2">
        <div className="font-semibold mb-1">按源类型分布</div>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(overview.index.bySource).map(([k, v]) => (
            <span key={k} className="px-1.5 py-0.5 rounded bg-muted/30 text-[10px]">{k}:{v}</span>
          ))}
        </div>
      </div>
      <div className="rounded border border-border/40 p-2">
        <div className="font-semibold mb-1">检索结果 ({retrieved?.length ?? 0})</div>
        {!retrieved?.length && <div className="text-muted-foreground">尚未检索。</div>}
        <div className="space-y-1.5 max-h-72 overflow-y-auto">
          {retrieved?.map((r) => (
            <div key={r.item.knowledgeId} className="rounded border border-border/30 p-2">
              <div className="font-medium">{r.item.title} <span className="text-muted-foreground">(score {r.score.toFixed(1)})</span></div>
              <div className="text-muted-foreground">{r.item.contentSummary}</div>
              <div className="text-[10px] mt-1">
                <span className="text-amber-400">{r.item.sourceType}</span>
                {r.matchedKeywords.length > 0 && <> · 命中：{r.matchedKeywords.join(", ")}</>}
                {r.item.version && <> · v{r.item.version}</>}
                <> · {r.item.freshnessStatus}</>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded border border-border/40 p-2">
      <div className="text-muted-foreground text-[10px]">{label}</div>
      <div className="font-mono text-lg">{value}</div>
    </div>
  );
}
