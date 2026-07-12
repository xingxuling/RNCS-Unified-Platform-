/**
 * Route Permission Badge
 */
import { Lock, Crown, FlaskConical } from "lucide-react";
import type { SubRouteDefinition } from "@/constants/router/subRouteDefinitions";
import type { PermissionStatus } from "@/lib/router/subRoutePermissionGuard";

interface Props {
  route: SubRouteDefinition;
  status: PermissionStatus;
}

export function RoutePermissionBadge({ route, status }: Props) {
  if (status === "LOCKED") {
    return <Lock className="w-3 h-3 text-muted-foreground" aria-label="锁定" />;
  }
  if (route.founderOnly) {
    return <Crown className="w-3 h-3 text-amber-400" aria-label="Founder" />;
  }
  if (route.isExperimental) {
    return <FlaskConical className="w-3 h-3 text-sky-400" aria-label="Beta" />;
  }
  return null;
}
