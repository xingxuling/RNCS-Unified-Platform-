import type { WorldTimeState } from "@/lib/sequence-world/simulation/worldTimeEngine";

export function WorldTimePanel({ time }: { time: WorldTimeState }) {
  return (
    <div className="aether-card p-4">
      <h3 className="font-display gold-text mb-2">世界时间</h3>
      <div className="grid grid-cols-5 gap-2 text-center text-xs">
        {([["Tick", time.tick], ["Day", time.day], ["Arc", time.arc], ["Era", time.era], ["Cycle", time.cycle]] as const).map(([k, v]) => (
          <div key={k} className="aether-card p-2"><div className="text-muted-foreground">{k}</div><div className="text-lg font-medium">{v}</div></div>
        ))}
      </div>
      <div className="text-xs text-muted-foreground mt-3">时间情绪：<span className="text-foreground">{time.timeMood}</span>　·　相位偏向：{time.phaseBias.join(" · ") || "—"}</div>
    </div>
  );
}
