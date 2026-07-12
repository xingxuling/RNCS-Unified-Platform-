import type { DigitalRoleCalculusResult } from "@/lib/digital-roles/digitalRoleCalculus";

export function DigitalRoleCollaborationMap({ result }: { result: DigitalRoleCalculusResult }) {
  return (
    <div className="aether-card p-3 space-y-2">
      <div className="text-xs text-muted-foreground">协作图</div>
      <div className="flex flex-wrap items-center gap-1 text-[11px]">
        {result.collaboration.nodes.map((n, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="px-2 py-0.5 rounded bg-muted/40">{n}</span>
            {i < result.collaboration.nodes.length - 1 && <span className="text-muted-foreground">→</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
