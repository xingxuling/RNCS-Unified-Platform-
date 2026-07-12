import type { EmotionCurve } from "@/lib/vocal/emotionCurveEngine";

export function EmotionCurveChart({ curve }: { curve: EmotionCurve }) {
  const m = curve.intensityMap;
  const points = [
    { x: "Intro", y: m.intro, label: curve.openingEmotion },
    { x: "Verse", y: m.verse, label: curve.verseEmotion },
    { x: "Pre", y: m.preChorus, label: curve.preChorusEmotion },
    { x: "Chorus", y: m.chorus, label: curve.chorusEmotion },
    { x: "Bridge", y: m.bridge, label: curve.bridgeEmotion },
    { x: "Final", y: m.finalChorus, label: curve.finalEmotion },
  ];
  return (
    <div className="aether-card p-4 space-y-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Emotion Curve · 情绪曲线</div>
      <div className="grid grid-cols-6 gap-1 items-end h-28">
        {points.map((p, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-full bg-primary/70 rounded-t" style={{ height: `${Math.round(p.y * 100)}%` }} />
            <div className="text-[9px] text-muted-foreground">{p.x}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-6 gap-1 text-[10px] text-center text-muted-foreground">
        {points.map((p, i) => <div key={i}>{p.label}</div>)}
      </div>
      <div className="text-[11px] text-amber-500/80">{curve.vocalRisk}</div>
    </div>
  );
}
