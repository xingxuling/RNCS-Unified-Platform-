import type { FiveDomainMapping } from "@/lib/fiveDomainMappingEngine";

export function FiveDomainMappingCard({ data }: { data: FiveDomainMapping }) {
  const rows: { k: keyof FiveDomainMapping; label: string }[] = [
    { k: "heaven", label: "天｜时机" },
    { k: "earth",  label: "地｜场域" },
    { k: "human",  label: "人｜关系" },
    { k: "spirit", label: "神｜主线" },
    { k: "wind",   label: "风｜变化" },
  ];
  return (
    <section className="aether-card-elevated p-5 space-y-3">
      <h3 className="font-display text-base gold-text">五域映射</h3>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.k} className="text-sm">
            <span className="text-muted-foreground text-xs mr-2">{r.label}</span>
            <span>{data[r.k] as string}</span>
          </li>
        ))}
      </ul>
      <div className="text-xs text-muted-foreground border-t border-border/60 pt-2">
        强域：<span className="text-foreground">{data.strongestDomain}</span> ·
        弱域：<span className="text-foreground"> {data.weakestDomain}</span>
        {data.missingDomain.length > 0 && <> · 缺：{data.missingDomain.join("、")}</>}
      </div>
      <div className="text-xs">{data.interpretation}</div>
    </section>
  );
}
