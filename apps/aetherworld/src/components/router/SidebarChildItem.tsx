/**
 * Sidebar Child Item — 子路由按钮
 */
import { Link } from "@tanstack/react-router";
import type { SubRouteDefinition } from "@/constants/router/subRouteDefinitions";
import type { PermissionStatus } from "@/lib/router/subRoutePermissionGuard";
import { RoutePermissionBadge } from "./RoutePermissionBadge";

interface Props {
  route: SubRouteDefinition;
  status: PermissionStatus;
  active: boolean;
  indent?: number;
  onNavigate?: () => void;
}

export function SidebarChildItem({ route, status, active, indent = 1, onNavigate }: Props) {
  const locked = status === "LOCKED";
  const padLeft = 8 + indent * 12;
  const baseClass =
    "flex items-center gap-2 py-1.5 pr-2 rounded-md text-sm transition-colors w-full";
  const stateClass = active
    ? "bg-sidebar-accent text-sidebar-accent-foreground"
    : "text-muted-foreground hover:bg-sidebar-accent/30 hover:text-foreground";

  if (locked) {
    return (
      <div
        className={`${baseClass} ${stateClass} opacity-60 cursor-not-allowed`}
        style={{ paddingLeft: padLeft }}
        title="权限不足"
      >
        <span className="flex-1 truncate">{route.chineseTitle}</span>
        <RoutePermissionBadge route={route} status={status} />
      </div>
    );
  }

  return (
    <Link
      to={route.path}
      onClick={onNavigate}
      className={`${baseClass} ${stateClass}`}
      style={{ paddingLeft: padLeft }}
    >
      <span className="flex-1 truncate">
        <span className="block leading-tight">{route.chineseTitle}</span>
        <span className="block text-[10px] text-muted-foreground/70 leading-tight">{route.title}</span>
      </span>
      <RoutePermissionBadge route={route} status={status} />
    </Link>
  );
}
