import { getDomains } from "@/lib/symbolicMemoryAnalyzer";

export function SymbolicMemoryMatrix({ ids }: { ids: string[] }) {
  const domains = getDomains(ids);
  return (
    <div className="aether-card p-5 space-y-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">Symbolic Domains · 符号领域</div>
      {domains.length === 0 ? (
        <div className="text-xs text-muted-foreground">未匹配到符号领域，可补充符号标签。</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {domains.map(d => (
            <div key={d.id} className="aether-card p-2.5">
              <div className="text-sm">{d.userFriendlyName}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{d.description}</div>
              <div className="text-[10px] text-muted-foreground mt-1">{d.symbols.slice(0, 4).join("·")}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
