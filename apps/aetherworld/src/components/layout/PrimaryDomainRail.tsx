import { Link, useRouterState } from "@tanstack/react-router";
import { AETHER_NAV_DOMAINS, findDomainByPath } from "@/config/aetherNavigationDomains";
import { useFounderState } from "@/hooks/useFounderState";
import { cn } from "@/lib/utils";

interface Props {
  activeDomainId?: string;
  onSelectDomain?: (id: string) => void;
}

export function PrimaryDomainRail({ activeDomainId, onSelectDomain }: Props) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const founder = useFounderState();
  const currentDomain = activeDomainId ?? findDomainByPath(path)?.id;

  const visible = AETHER_NAV_DOMAINS.filter((d) => !d.founderOnly || founder.active);

  return (
    <aside
      aria-label="一级域导航"
      className="hidden md:flex flex-col items-center w-16 shrink-0 border-r border-border/40 bg-background/60 backdrop-blur py-3 gap-1 overflow-y-auto"
    >
      <Link to="/" className="mb-2 w-9 h-9 rounded-md bg-gradient-to-br from-amber-400/80 to-amber-700/60 flex items-center justify-center text-[11px] font-bold text-background">
        A
      </Link>
      {visible.map((d) => {
        const Icon = d.icon;
        const active = d.id === currentDomain;
        const content = (
          <span
            className={cn(
              "group relative flex flex-col items-center justify-center gap-0.5 w-12 h-12 rounded-md text-[10px] transition-colors",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="leading-none">{d.label}</span>
          </span>
        );
        return onSelectDomain ? (
          <button key={d.id} type="button" onClick={() => onSelectDomain(d.id)} title={d.label}>
            {content}
          </button>
        ) : (
          <Link key={d.id} to={d.primaryPath} title={d.label}>
            {content}
          </Link>
        );
      })}
    </aside>
  );
}
