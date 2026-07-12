import { useState, useMemo } from "react";
import { VOCABULARY_REGISTRY } from "@/lib/vocabulary/vocabularyRegistry";
import { searchTerms } from "@/lib/vocabulary/vocabularyRegistry";
import { TermCard } from "./TermCard";

export function VocabularySearchBox() {
  const [q, setQ] = useState("");
  const results = useMemo(
    () => (q.trim() ? searchTerms(q, "ADVANCED").slice(0, 24) : VOCABULARY_REGISTRY.slice(0, 12)),
    [q],
  );
  return (
    <section className="space-y-4">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="搜索中文 / 英文 / 别名，例如 Full60、常数宇宙、calculus"
        className="w-full h-11 rounded-md border border-border/60 bg-card/40 px-3 text-sm
                   focus:outline-none focus:border-primary/60"
      />
      <p className="text-xs text-muted-foreground">
        共 {VOCABULARY_REGISTRY.length} 条词条 · 显示 {results.length} 条
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {results.map((t) => <TermCard key={t.termId} term={t} />)}
      </div>
    </section>
  );
}
