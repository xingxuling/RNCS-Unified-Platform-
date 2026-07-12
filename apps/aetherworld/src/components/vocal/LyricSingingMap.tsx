import type { LyricSingingAnalysis } from "@/lib/vocal/lyricSingingAnalyzer";

export function LyricSingingMap({ analyses }: { analyses: LyricSingingAnalysis[] }) {
  return (
    <div className="aether-card p-4 space-y-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Lyric Singing · 歌词演唱分析</div>
      {analyses.map((a, i) => (
        <div key={i} className="border border-border/40 rounded p-3 space-y-1.5 bg-secondary/15">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">[{a.section}]</div>
            <div className="text-[10px] text-muted-foreground">{a.emotion} · {a.vocalDelivery} · intensity {Math.round(a.intensity * 100)}</div>
          </div>
          <pre className="text-xs whitespace-pre-wrap font-sans">{a.lyricText}</pre>
          {a.breathingNotes.length > 0 && (
            <div className="text-[11px] text-muted-foreground">
              换气：{a.breathingNotes.join(" / ")}
            </div>
          )}
          {a.difficultLines.length > 0 && (
            <div className="text-[11px] text-amber-500/80">
              难点：{a.difficultLines.length} 行
            </div>
          )}
          {a.rewriteSuggestions && (
            <ul className="text-[11px] list-disc list-inside text-muted-foreground">
              {a.rewriteSuggestions.map((r, j) => <li key={j}>{r}</li>)}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
