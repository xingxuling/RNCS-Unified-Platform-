import { Link, useRouterState } from "@tanstack/react-router";
import { AETHER_NAV_DOMAINS, findDomainByPath } from "@/config/aetherNavigationDomains";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Props {
  domainId?: string;
  onNavigate?: () => void;
  className?: string;
}

export function SecondaryDomainNav({ domainId, onNavigate, className }: Props) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const targetId = domainId ?? findDomainByPath(path)?.id;
  const domain = AETHER_NAV_DOMAINS.find((d) => d.id === targetId) ?? AETHER_NAV_DOMAINS[0];

  return (
    <div className={cn("flex flex-col h-full bg-background/40", className)}>
      <div className="px-4 py-3 border-b border-border/40">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">当前域</div>
        <div className="font-display text-sm mt-0.5">{domain.label}</div>
      </div>
      <ScrollArea className="flex-1">
        <nav className="px-2 py-2 space-y-0.5">
          {domain.children.map((item) => {
            const active = path === item.to || path.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] uppercase text-amber-400">{item.badge}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="border-t border-border/40 px-3 py-2">
        <Link
          to="/command-canvas"
          onClick={onNavigate}
          className="block text-[11px] text-muted-foreground hover:text-foreground"
        >
          打开完整导航 →
        </Link>
      </div>
    </div>
  );
}
