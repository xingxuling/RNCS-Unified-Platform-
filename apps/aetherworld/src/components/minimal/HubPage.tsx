import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export interface HubItem {
  to: string;
  label: string;
  desc?: string;
}

export function HubPage({
  caption,
  title,
  subtitle,
  groups,
}: {
  caption: string;
  title: string;
  subtitle?: string;
  groups: { id: string; label: string; items: HubItem[] }[];
}) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <header className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{caption}</div>
          <h1 className="text-2xl font-display">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </header>

        {groups.map((g) => (
          <section key={g.id} className="space-y-2">
            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{g.label}</div>
            <div className="aether-card divide-y divide-border/40">
              {g.items.map((it) => (
                <Link
                  key={it.to + it.label}
                  to={it.to}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30 group"
                >
                  <div className="min-w-0">
                    <div className="text-sm">{it.label}</div>
                    {it.desc && <div className="text-[11px] text-muted-foreground mt-0.5">{it.desc}</div>}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
