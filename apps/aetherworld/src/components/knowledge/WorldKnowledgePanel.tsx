import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KnowledgeSearchBox } from "./KnowledgeSearchBox";
import { KnowledgeEntryCard } from "./KnowledgeEntryCard";
import { KnowledgeImportPanel } from "./KnowledgeImportPanel";
import { KnowledgeExportPanel } from "./KnowledgeExportPanel";
import { KnowledgeSafetyNote } from "./KnowledgeSafetyNote";
import { searchKnowledge } from "@/lib/knowledge/knowledgeSearchEngine";
import { knowledgeStats, markEntryStale, listKnowledgeEntries } from "@/lib/knowledge/knowledgeSourceRegistry";
import { KNOWLEDGE_TYPES } from "@/constants/knowledge/knowledgeTypes";
import { useFounderState } from "@/hooks/useFounderState";

export function WorldKnowledgePanel() {
  const { active: founder } = useFounderState();
  const userMode = founder ? "FOUNDER" : "FULL_60";
  const [query, setQuery] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [tick, setTick] = useState(0);

  const stats = useMemo(() => knowledgeStats(), [tick]);

  const result = useMemo(() => {
    return searchKnowledge({ query, userMode, knowledgeTypes: types.length ? types : undefined });
  }, [query, types, userMode, tick]);

  const toggleType = (id: string) => {
    setTypes(t => t.includes(id) ? t.filter(x => x !== id) : [...t, id]);
  };

  useEffect(() => { /* ensure init */ listKnowledgeEntries(); }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <StatCard label="条目总数" value={stats.total} />
        <StatCard label="来源数量" value={stats.sources} />
        <StatCard label="私有条目" value={stats.userPrivate} />
        <StatCard label="Founder Only" value={stats.founderOnly} />
        <StatCard label="过期条目" value={stats.stale} highlight={stats.stale > 0} />
      </div>

      <KnowledgeSearchBox onSearch={setQuery} />

      <div className="flex flex-wrap gap-1.5">
        {KNOWLEDGE_TYPES.map(t => (
          <Button
            key={t.id}
            size="sm"
            variant={types.includes(t.id) ? "default" : "outline"}
            onClick={() => toggleType(t.id)}
            className="h-7 text-xs"
          >
            {t.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
        {result.usedFilters.map((f, i) => <Badge key={i} variant="outline">{f}</Badge>)}
        {result.hiddenEntriesCount > 0 && (
          <Badge variant="destructive">隐藏 {result.hiddenEntriesCount} 条受权限保护</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {result.entries.length === 0 && (
          <div className="text-sm text-muted-foreground p-4 border border-dashed rounded">没有匹配的知识条目。</div>
        )}
        {result.entries.map(e => (
          <KnowledgeEntryCard
            key={e.id}
            entry={e}
            founder={founder}
            onMarkStale={(id) => { markEntryStale(id, !e.stale); setTick(t => t + 1); }}
          />
        ))}
      </div>

      <KnowledgeImportPanel onAdded={() => setTick(t => t + 1)} />
      <KnowledgeExportPanel founder={founder} />
      <KnowledgeSafetyNote />
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-md border p-3 ${highlight ? "border-amber-500/40 bg-amber-500/5" : "border-border/60"}`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
