import type { ResonanceResult } from "@/lib/resonanceLock";

export function ResonanceMap({ result }: { result: ResonanceResult }) {
  const typeName = {
    same: "同频",
    compensation: "补频",
    conflict: "冲频",
    low: "低共振",
  }[result.type];
  return (
    <div className="aether-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Resonance Lock</div>
          <div className="font-display text-xl gold-text mt-1">{result.objectName || "对象"} · {typeName}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-3xl gold-text">{result.index}</div>
          <div className="text-[10px] text-muted-foreground tracking-wider">{result.formsReality ? "可形成现实事件" : "目前停留在感觉层"}</div>
        </div>
      </div>

      <div className="gold-divider my-4" />

      <div className="grid grid-cols-5 gap-2 text-center">
        {["主权","关系","表达","结构","变局"].map((n, i) => (
          <div key={n} className="rounded-md bg-muted/20 p-2">
            <div className="text-[10px] text-muted-foreground">{n}</div>
            <div className="mt-1 font-mono text-xs">
              <span className="text-primary">{result.subjectAvg[i]}</span>
              <span className="mx-1 text-muted-foreground">·</span>
              <span className="text-foreground">{result.objectDigits[i]}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
        <Stat label="同频" v={result.similarity} />
        <Stat label="补频" v={result.compensation} />
        <Stat label="冲频" v={result.conflict} />
      </div>

      {result.missing.length > 0 && (
        <div className="mt-3 text-xs text-muted-foreground">
          <span className="text-primary/80">补偿：</span>{result.missing.join(" · ")}
        </div>
      )}
      {result.conflicts.length > 0 && (
        <div className="mt-1 text-xs text-muted-foreground">
          <span className="text-destructive/80">冲突：</span>{result.conflicts.join(" · ")}
        </div>
      )}
      <div className="mt-3 text-sm">{result.action}</div>
    </div>
  );
}

function Stat({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded-md bg-muted/20 py-2">
      <div className="text-[10px] text-muted-foreground tracking-wider">{label}</div>
      <div className="font-mono text-base mt-1">{v}</div>
    </div>
  );
}
