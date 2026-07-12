import { listDigitalRoles } from "@/lib/digital-roles/digitalRoleRegistry";
import { DigitalRoleCard } from "./DigitalRoleCard";

export function DigitalRoleRegistryTable({ onSelect }: { onSelect?: (id: string) => void }) {
  const roles = listDigitalRoles();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {roles.map((r) => (
        <DigitalRoleCard key={r.roleId} role={r} onSelect={onSelect} />
      ))}
    </div>
  );
}
