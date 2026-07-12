import type { MultilingualVocalAdaptation } from "@/lib/vocal/multilingualVocalAdapter";

export function MultilingualVocalPanel({ data }: { data: MultilingualVocalAdaptation }) {
  return (
    <div className="aether-card p-4 space-y-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Multilingual Vocal · 多语言演唱适配</div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div><span className="text-muted-foreground">目标 </span>{data.targetLanguage}</div>
        <div><span className="text-muted-foreground">音节密度 </span>{data.syllableDensity}</div>
        <div><span className="text-muted-foreground">难度 </span>{data.singingDifficulty}</div>
      </div>
      <div className="text-xs"><span className="text-muted-foreground">元音流动：</span>{data.vowelFlow}</div>
      <div className="text-xs"><span className="text-muted-foreground">节奏匹配：</span>{data.rhythmFit}</div>
      <div className="text-[11px] text-amber-500/80">{data.rewriteNeeded ? "需要重写歌词以适配演唱（标记为「演唱适配版」，不是直译）。" : "可作为直接适配版本使用。"}</div>
      <ul className="text-[11px] list-disc list-inside text-muted-foreground">
        {data.adaptationNotes.map((n, i) => <li key={i}>{n}</li>)}
      </ul>
    </div>
  );
}
