import { Link } from "@tanstack/react-router";

const PRIMARY = [
  { id: "COMMAND", label: "Command", to: "/command-center" },
  { id: "WORKSPACE", label: "Workspace", to: "/canvas-workspace" },
  { id: "OBJECTS", label: "Objects", to: "/sequence-objects" },
  { id: "RUNS", label: "Runs", to: "/run-console" },
  { id: "WEB_MODELS", label: "Web Models", to: "/capability-dock" },
  { id: "WORLDS", label: "Worlds", to: "/world-engine" },
  { id: "APPS", label: "Apps", to: "/app-projects" },
  { id: "SYSTEM", label: "System", to: "/system-audit" },
];

export function AetherPrimarySidebar() {
  return (
    <nav className="flex h-full w-44 shrink-0 flex-col gap-1 border-r border-border/40 bg-card/30 p-2">
      <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">Aether</div>
      {PRIMARY.map((p) => (
        <Link
          key={p.id}
          to={p.to}
          className="rounded-md px-2 py-1.5 text-xs text-foreground/80 hover:bg-background/60 hover:text-foreground"
          activeProps={{ className: "rounded-md px-2 py-1.5 text-xs bg-primary/15 text-foreground" }}
        >
          {p.label}
        </Link>
      ))}
    </nav>
  );
}
