import { listVersionTimeline } from "@/lib/version-leap/versionTimelineEngine";

const LEVEL_COLOR: Record<string, string> = {
  PATCH: "text-emerald-500", MINOR: "text-sky-500", MAJOR: "text-amber-500",
  LEAP: "text-fuchsia-500", GENERATION: "text-rose-500",
};

export function VersionTimelinePanel() {
  const entries = listVersionTimeline();
  return (
    <div className="space-y-2">
      {entries.map((e) => (
        <div key={e.version} className="border border-border/40 rounded-md p-3 bg-muted/10">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">{e.version}</span>
              <span className={`text-xs font-semibold ${LEVEL_COLOR[e.leapLevel]}`}>{e.leapLevel}</span>
              {e.milestone && <span className="text-[10px] px-1.5 rounded bg-primary/20 text-primary">里程碑</span>}
            </div>
            <span className="text-xs text-muted-foreground">{e.date} · {e.readinessStatus}</span>
          </div>
          <p className="text-sm mt-1">{e.releaseName}</p>
          <p className="text-xs text-muted-foreground mt-1">{e.summary}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {e.changedModules.map((m) => (
              <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{m}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
