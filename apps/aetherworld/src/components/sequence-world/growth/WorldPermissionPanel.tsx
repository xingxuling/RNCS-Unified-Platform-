import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROLE_PERMISSIONS, WORLD_PERMISSIONS } from "@/constants/sequence-world/growth/worldPermissionTypes";
import { useFounderState } from "@/hooks/useFounderState";

export function WorldPermissionPanel() {
  const { active: isFounder } = useFounderState();
  const role = isFounder ? "FOUNDER" : "ADVANCED";
  const perms = ROLE_PERMISSIONS[role];
  return (
    <Card className="p-4 space-y-2">
      <div className="text-sm font-medium">当前角色：<Badge>{role}</Badge></div>
      <div className="grid grid-cols-2 gap-1 text-xs">
        {WORLD_PERMISSIONS.map(p => (
          <div key={p} className="flex items-center gap-1">
            <Badge variant={perms.includes(p) ? "default" : "outline"}>{perms.includes(p) ? "✓" : "—"}</Badge>
            <span>{p}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
