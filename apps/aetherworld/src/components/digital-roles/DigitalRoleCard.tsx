import type { DigitalRole } from "@/lib/digital-roles/digitalRoleRegistry";

export function DigitalRoleCard({ role, onSelect }: { role: DigitalRole; onSelect?: (id: string) => void }) {
  return (
    <button
      onClick={() => onSelect?.(role.roleId)}
      className="aether-card p-3 text-left space-y-2 hover:bg-muted/30 transition-colors w-full"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">{role.chineseName}</div>
          <div className="text-[10px] text-muted-foreground">{role.englishName}</div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary">{role.authorityLevel}</span>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">{role.description}</p>
      <div className="flex flex-wrap gap-1">
        {role.coreResponsibility.slice(0, 3).map((r, i) => (
          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/40">{r}</span>
        ))}
      </div>
    </button>
  );
}
