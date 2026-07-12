import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronRight, PanelRightClose, PanelRightOpen } from "lucide-react";
import { resolveContextPanel } from "@/lib/layout/contextPanelResolver";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Props {
  forceOpen?: boolean;
  embedded?: boolean; // 内嵌于 Sheet 时不显示折叠按钮
}

export function AetherContextPanel({ embedded }: Props) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const data = resolveContextPanel(path);
  const [open, setOpen] = useState<boolean>(!data.collapsedByDefault);

  useEffect(() => {
    setOpen(!data.collapsedByDefault);
  }, [path, data.collapsedByDefault]);

  if (!embedded && !open) {
    return (
      <aside className="hidden xl:flex flex-col w-10 shrink-0 border-l border-border/40 bg-background/40">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="m-2 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40"
          title="展开上下文"
        >
          <PanelRightOpen className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "flex flex-col bg-background/40 border-l border-border/40",
        embedded ? "w-full h-full" : "hidden xl:flex w-[300px] shrink-0"
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">上下文</div>
          <div className="font-display text-sm mt-0.5">{data.domainLabel}</div>
        </div>
        {!embedded && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40"
            title="收起"
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {data.cards.map((c) => (
            <div key={c.id} className="aether-card p-3">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                {c.title}
              </div>
              <dl className="space-y-1.5">
                {c.rows.map((r, i) => (
                  <div key={i} className="flex items-baseline justify-between gap-3 text-xs">
                    <dt className="text-muted-foreground shrink-0">{r.label}</dt>
                    <dd
                      className={cn(
                        "text-right truncate",
                        r.tone === "ok" && "text-emerald-400",
                        r.tone === "warn" && "text-amber-400",
                        r.tone === "muted" && "text-muted-foreground"
                      )}
                    >
                      {r.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}

          {data.nextActions.length > 0 && (
            <div className="aether-card p-3">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                下一步
              </div>
              <ul className="space-y-1">
                {data.nextActions.map((a, i) =>
                  a.to ? (
                    <li key={i}>
                      <Link
                        to={a.to}
                        className="flex items-center justify-between gap-2 text-xs px-2 py-1.5 rounded hover:bg-muted/40 text-foreground"
                      >
                        <span>{a.label}</span>
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                      </Link>
                    </li>
                  ) : (
                    <li key={i} className="text-xs text-muted-foreground px-2 py-1.5">
                      {a.label}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
