import { Link } from "@tanstack/react-router";
import { getCapabilityDockGroups } from "@/lib/command-canvas/capabilityDockEngine";

export function AetherCapabilityDock() {
  const groups = getCapabilityDockGroups();
  return (
    <div className="rounded-lg border border-border/50 bg-card/30 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-medium">能力坞 · Capability Dock</h2>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{groups.length} 组</span>
      </div>
      <div className="space-y-3">
        {groups.map((g) => (
          <div key={g.id}>
            <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">{g.label}</div>
            <div className="flex flex-wrap gap-1.5">
              {g.cards.map((c) => (
                <Link
                  key={c.id}
                  to={c.route}
                  className="rounded-md border border-border/40 bg-background/50 px-2 py-1 text-[11px] hover:border-primary/40 hover:text-foreground"
                  title={`${c.label} · ${c.status}`}
                >
                  {c.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Legacy Pages</div>
          <Link to="/command-canvas" className="text-[11px] text-primary/80 hover:underline">
            打开 Legacy Route Drawer →
          </Link>
        </div>
      </div>
    </div>
  );
}
