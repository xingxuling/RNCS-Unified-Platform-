import { useState } from "react";
import { searchConcepts } from "@/lib/weblcm/webLcmConceptSearchEngine";
import { listWorkspaceConcepts } from "@/lib/weblcm/webLcmWorkspaceBridge";
import type { ConceptSearchResult } from "@/lib/weblcm/webLcmTypes";

export function WebLcmConceptSearchPanel() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<ConceptSearchResult | null>(null);
  function onSearch() {
    if (!query.trim()) return;
    setResult(searchConcepts(query, listWorkspaceConcepts(), { topK: 10 }));
  }
  return (
    <div className="space-y-3 text-xs">
      <div className="flex gap-2">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="输入要检索的概念（关键词 / 标签 / 主题）"
          className="flex-1 px-2 py-1.5 rounded border border-border/40 bg-background text-xs" />
        <button onClick={onSearch} className="px-3 py-1.5 rounded border border-border/40 hover:bg-muted/30">检索</button>
      </div>
      {result && (
        <div className="space-y-2">
          <div className="text-muted-foreground">匹配方式：{result.matchedBy} · 置信度：{result.confidence.toFixed(2)} · 共 {result.results.length} 项</div>
          {result.results.length === 0 ? <div className="text-muted-foreground">无匹配概念。请先运行一次概念抽取。</div> :
            result.results.map(c => (
              <div key={c.conceptId} className="rounded border border-border/40 p-2">
                <div className="font-semibold">{c.title} <span className="text-muted-foreground text-[10px]">[{c.conceptType}]</span></div>
                <div className="text-muted-foreground">{c.summary}</div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
