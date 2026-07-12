import type { ObjectInvariants } from "@/lib/objectInvariantDetector";

export function ObjectInvariantMatrix({ invariants }: { invariants: ObjectInvariants }) {
  return (
    <div className="aether-card p-4 space-y-2">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Invariants · 核心不变量</div>
      <div>
        <div className="text-xs text-muted-foreground mb-1">主要不变量</div>
        <ul className="list-disc list-inside text-sm space-y-0.5">
          {invariants.primaryInvariants.map((s,i)=><li key={i}>{s}</li>)}
        </ul>
      </div>
      {invariants.secondaryInvariants.length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground mb-1">次要不变量</div>
          <ul className="list-disc list-inside text-xs space-y-0.5 text-foreground/80">
            {invariants.secondaryInvariants.map((s,i)=><li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
      <div className="text-[11px] text-muted-foreground">{invariants.ifLostThen}</div>
    </div>
  );
}
