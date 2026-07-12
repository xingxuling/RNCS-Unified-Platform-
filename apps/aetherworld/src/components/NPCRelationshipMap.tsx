import type { GeneratedNPC } from "@/lib/npcRelationshipEngine";
import { NPC_DISCLAIMER } from "@/constants/worldSafetyRules";

const STATE_COLOR: Record<string, string> = {
  UNKNOWN: "bg-zinc-500/15 text-zinc-300",
  APPROACHING: "bg-sky-500/15 text-sky-300",
  ACTIVE: "bg-emerald-500/15 text-emerald-300",
  DISTANT: "bg-amber-500/15 text-amber-300",
  CONFLICT: "bg-rose-500/15 text-rose-300",
  LOCKED: "bg-purple-500/15 text-purple-300",
};

export function NPCRelationshipMap({ npcs }: { npcs: GeneratedNPC[] }) {
  return (
    <div className="aether-card-elevated p-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">NPC Network · NPC关系网</div>
      <p className="text-[11px] text-amber-400/80 mt-2">{NPC_DISCLAIMER}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
        {npcs.map(n => (
          <div key={n.id} className="aether-card p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{n.name}</div>
              <span className={`text-[10px] px-2 py-0.5 rounded ${STATE_COLOR[n.relationshipState]}`}>{n.relationshipState}</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">{n.archetype} · {n.relatedDimension}</div>
            <p className="text-xs text-foreground/85 mt-2 leading-snug">{n.description}</p>
            <div className="text-[10px] text-muted-foreground mt-2 flex gap-3">
              <span>信任 {n.trustLevel}</span>
              <span>风险 {n.riskLevel}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
