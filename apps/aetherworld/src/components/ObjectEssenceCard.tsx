import type { ObjectEssence } from "@/lib/objectEssenceResolver";

export function ObjectEssenceCard({ essence }: { essence: ObjectEssence }) {
  return (
    <div className="aether-card p-4 space-y-2">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Essence · 本质</div>
      <div className="text-sm font-medium leading-relaxed">{essence.essenceStatement}</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
        <div><span className="text-foreground/80">核心需求：</span>{essence.coreNeed}</div>
        <div><span className="text-foreground/80">核心驱动：</span>{essence.coreDrive}</div>
        <div><span className="text-foreground/80">核心功能：</span>{essence.coreFunction}</div>
      </div>
      {essence.notThis.length > 0 && (
        <div className="text-xs">
          <div className="text-muted-foreground mb-1">它不是：</div>
          <ul className="list-disc list-inside space-y-0.5">
            {essence.notThis.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
      <div className="text-[11px] text-muted-foreground">
        本质置信度：{essence.essenceConfidence}/100 · {essence.confidenceLevel}
      </div>
    </div>
  );
}
