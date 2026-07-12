import { getArchetypes } from "@/lib/archetypalMemoryMapper";

export function ArchetypalMemoryCard({ ids }: { ids: string[] }) {
  const archetypes = getArchetypes(ids);
  if (archetypes.length === 0) {
    return <div className="aether-card p-4 text-xs text-muted-foreground">暂无明确原型匹配。</div>;
  }
  return (
    <div className="aether-card p-5 space-y-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">Archetypal Memory · 原型记忆匹配</div>
      <div className="space-y-3">
        {archetypes.map(a => (
          <div key={a.id} className="border-l-2 border-primary/40 pl-3">
            <div className="text-sm font-medium">{a.userFriendlyName} <span className="text-[10px] text-muted-foreground">{a.name}</span></div>
            <div className="text-xs text-foreground/80 mt-1">{a.description}</div>
            <div className="text-[11px] text-muted-foreground mt-1">
              优势：{a.strengths.join("、")}　·　风险：{a.risks.join("、")}
            </div>
            <div className="text-[11px] text-muted-foreground">
              创作用途：{a.creativeUses.join("、")}
            </div>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-muted-foreground/80 pt-2">
        提示：这只是「象征性原型匹配」，不代表你的真实身份或前世经历。
      </div>
    </div>
  );
}
