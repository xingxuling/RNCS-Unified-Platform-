import type { DigitalRoleConflict } from "@/lib/digital-roles/digitalRoleConflictDetector";

export function DigitalRoleConflictPanel({ conflicts }: { conflicts: DigitalRoleConflict[] }) {
  if (!conflicts.length) {
    return <div className="aether-card p-3 text-xs text-muted-foreground">未检测到角色冲突。</div>;
  }
  return (
    <div className="aether-card p-3 space-y-2">
      <div className="text-xs text-muted-foreground">角色冲突 ({conflicts.length})</div>
      {conflicts.map((c) => (
        <div key={c.conflictId} className="border-l-2 border-amber-500/40 pl-2 text-xs space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-medium">{c.conflictType}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${c.severity === "CRITICAL" ? "bg-red-500/10 text-red-600" : "bg-amber-500/10 text-amber-600"}`}>{c.severity}</span>
          </div>
          <div className="text-muted-foreground">{c.explanation}</div>
          <div className="text-[11px]">建议：{c.suggestedResolution}</div>
        </div>
      ))}
    </div>
  );
}
