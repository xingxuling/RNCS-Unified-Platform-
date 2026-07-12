import { useState } from "react";
import { runWebLkm } from "@/lib/web-knowledge-trinity/weblkm/webLkmRuntime";
import type { WebLkmRunResult } from "@/lib/web-knowledge-trinity/weblkm/webLkmRuntime";
import { WEB_KNOWLEDGE_RETRIEVAL_MODES, DEFAULT_WEB_KNOWLEDGE_RETRIEVAL_MODE, type WebKnowledgeRetrievalMode } from "@/constants/web-knowledge-trinity/webKnowledgeRetrievalModes";

export function WebKnowledgeSearchPanel() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<WebKnowledgeRetrievalMode>(DEFAULT_WEB_KNOWLEDGE_RETRIEVAL_MODE);
  const [result, setResult] = useState<WebLkmRunResult | null>(null);
  function onSearch() {
    if (!query.trim()) return;
    setResult(runWebLkm({ query, mode, limit: 12 }));
  }
  return (
    <div className="space-y-3 text-xs">
      <div className="flex gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSearch(); }}
          placeholder="搜索本地知识，例如：App Runtime / 沙箱 / 常数"
          className="flex-1 px-2 py-1.5 rounded border border-border/40 bg-background" />
        <select value={mode} onChange={(e) => setMode(e.target.value as WebKnowledgeRetrievalMode)}
          className="px-2 py-1.5 rounded border border-border/40 bg-background">
          {WEB_KNOWLEDGE_RETRIEVAL_MODES.filter((m) => m.supported).map((m) => (
            <option key={m.id} value={m.id}>{m.title}</option>
          ))}
        </select>
        <button onClick={onSearch} className="px-3 py-1.5 rounded border border-border/40 hover:bg-muted/30">检索</button>
      </div>
      {result && (
        <div className="space-y-2">
          <div className="text-muted-foreground">
            Run {result.runId.slice(-8)} · 命中 {result.retrieved.length} · QA {result.qa.status} · stale={result.staleCount} conflict={result.conflictCount}
          </div>
          {result.retrieved.map((r) => (
            <div key={r.item.knowledgeId} className="rounded border border-border/30 p-2">
              <div className="font-medium">{r.item.title}</div>
              <div className="text-muted-foreground">{r.item.contentSummary}</div>
              <div className="text-[10px] mt-1">
                <span className="text-amber-400">{r.item.sourceType}</span> · score {r.score.toFixed(1)} · {r.item.freshnessStatus}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
