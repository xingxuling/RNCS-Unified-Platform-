import type { VocalStyleResult } from "@/lib/vocal/vocalStyleMapper";

export function VocalStyleCard({ data }: { data: VocalStyleResult }) {
  const Row = ({ label, val }: { label: string; val: string }) => (
    <div className="flex items-baseline justify-between text-xs border-b border-border/30 py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{val}</span>
    </div>
  );
  return (
    <div className="aether-card p-4 space-y-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Vocal Style · 唱法映射</div>
      <Row label="主线" val={data.mainStyle} />
      <Row label="Verse" val={data.verseStyle} />
      <Row label="Pre-Chorus" val={data.preChorusStyle} />
      <Row label="Chorus" val={data.chorusStyle} />
      <Row label="Bridge" val={data.bridgeStyle} />
      <Row label="Ad-lib" val={data.adlibStyle} />
      <div className="pt-2 text-[11px] text-muted-foreground">混音建议：</div>
      <ul className="text-[11px] space-y-0.5 list-disc list-inside">
        {data.mixingAdvice.map((m, i) => <li key={i}>{m}</li>)}
      </ul>
      <div className="pt-2 text-[10px] text-muted-foreground">AI 关键词：</div>
      <div className="flex flex-wrap gap-1">
        {data.aiPromptKeywords.map((k, i) => (
          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/40 border border-border">{k}</span>
        ))}
      </div>
    </div>
  );
}
