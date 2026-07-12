/**
 * Route Breadcrumb
 */
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { buildBreadcrumbs } from "@/lib/router/routeBreadcrumbEngine";

export function RouteBreadcrumb({ compact = false }: { compact?: boolean }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const items = buildBreadcrumbs(path);
  if (items.length <= 1) return null;

  return (
    <nav aria-label="面包屑" className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const label = compact ? item.chineseLabel : `${item.chineseLabel}`;
        return (
          <span key={`${item.label}-${idx}`} className="flex items-center gap-1.5">
            {item.path && !isLast ? (
              <Link to={item.path} className="hover:text-foreground transition-colors">
                {label}
              </Link>
            ) : (
              <span className={isLast ? "text-foreground" : ""}>{label}</span>
            )}
            {!isLast && <ChevronRight className="w-3 h-3 opacity-60" />}
          </span>
        );
      })}
    </nav>
  );
}
