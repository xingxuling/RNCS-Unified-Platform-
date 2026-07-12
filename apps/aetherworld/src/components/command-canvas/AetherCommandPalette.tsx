import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { searchCommandPalette } from "@/lib/command-canvas/commandPaletteRegistry";

interface Props { open: boolean; onClose: () => void; }

export function AetherCommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchCommandPalette(query), [query]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-24" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-lg border border-border/60 bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索页面、对象、命令、能力、文档..."
          className="w-full rounded-t-lg border-b border-border/40 bg-transparent p-3 text-sm outline-none"
        />
        <div className="max-h-[60vh] overflow-auto">
          {results.length === 0 && (
            <div className="p-4 text-xs text-muted-foreground">无结果。</div>
          )}
          <ul className="divide-y divide-border/30">
            {results.map((r) => (
              <li key={r.id}>
                {r.route ? (
                  <Link
                    to={r.route}
                    onClick={onClose}
                    className="flex items-center justify-between px-3 py-2 hover:bg-card/50"
                  >
                    <div>
                      <div className="text-xs text-foreground">{r.label}</div>
                      <div className="text-[10px] text-muted-foreground">{r.group} · {r.description}</div>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{r.type}</span>
                  </Link>
                ) : (
                  <div className="flex items-center justify-between px-3 py-2">
                    <div>
                      <div className="text-xs text-foreground">{r.label}</div>
                      <div className="text-[10px] text-muted-foreground">{r.group} · {r.description}</div>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{r.type}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
