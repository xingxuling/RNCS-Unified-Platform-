import type { ObjectBoundary } from "@/lib/objectBoundaryEngine";

export function ObjectBoundaryMap({ boundary }: { boundary: ObjectBoundary }) {
  return (
    <div className="aether-card p-4 space-y-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Boundary · 边界</div>
      <div className="text-xs">边界风险：<span className="text-foreground/90">{boundary.boundaryRisk}</span></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-muted-foreground mb-1">允许范围</div>
          <ul className="list-disc list-inside space-y-0.5">{boundary.allowedScope.map((s,i)=><li key={i}>{s}</li>)}</ul>
        </div>
        <div>
          <div className="text-muted-foreground mb-1">禁止范围</div>
          <ul className="list-disc list-inside space-y-0.5">{boundary.forbiddenScope.map((s,i)=><li key={i}>{s}</li>)}</ul>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
        {boundary.boundaryByType.map(b => (
          <div key={b.typeId} className="rounded border border-border/40 px-2 py-1.5">
            <div className="text-foreground/85">{b.name}</div>
            <div className="text-muted-foreground">{b.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
