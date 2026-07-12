import type { VirtualDayResult } from "@/lib/virtualDayGenerator";

export function VirtualDayCard({ day }: { day: VirtualDayResult }) {
  return (
    <div className="aether-card p-5 space-y-2">
      <div className="flex items-baseline justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Today · 今日虚拟生活</div>
        <div className="text-[11px] text-muted-foreground">{day.lifeModeName}</div>
      </div>
      <h2 className="text-xl font-display gold-text">{day.dayTitle}</h2>
      <div className="text-xs text-muted-foreground">
        醒来：{day.wakeUpLocation}　·　主区域：{day.mainZone}　·　天气：{day.weatherMood}
      </div>
      <div className="text-sm text-foreground/90">{day.dailyTheme}</div>
      <div className="grid grid-cols-3 gap-2 pt-2 text-[11px]">
        <Pill label="节律" value={day.rhythm.name} />
        <Pill label="状态" value={day.currentLifeState.name} />
        <Pill label="模式" value={day.lifeModeName} />
      </div>
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-background/40 border border-border/40 px-2 py-1">
      <div className="text-[9px] text-muted-foreground tracking-wider">{label}</div>
      <div className="text-foreground">{value}</div>
    </div>
  );
}
