import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { searchLegacyRoutes } from "@/lib/command-canvas/legacyRouteBridge";

interface Props { open: boolean; onClose: () => void; }

export function AetherLegacyRouteDrawer({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const groups = searchLegacyRoutes(query);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/50" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-auto border-l border-border/60 bg-background"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 border-b border-border/40 bg-background p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Legacy Route Drawer</h2>
            <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">关闭</button>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索旧页面..."
            className="mt-2 w-full rounded-md border border-border/40 bg-card/40 px-2 py-1 text-sm outline-none"
          />
        </div>
        <div className="space-y-3 p-3">
          {groups.map((g) => (
            <div key={g.id}>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{g.label}</div>
              <ul className="mt-1 space-y-0.5">
                {g.entries.map((e) => (
                  <li key={e.route}>
                    <Link
                      to={e.route}
                      onClick={onClose}
                      className="block rounded px-2 py-1 text-xs hover:bg-card/50"
                    >
                      <span className="text-foreground">{e.title}</span>
                      <span className="ml-2 text-[10px] text-muted-foreground">{e.route}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
