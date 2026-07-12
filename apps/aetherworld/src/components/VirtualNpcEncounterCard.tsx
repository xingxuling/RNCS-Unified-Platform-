import type { VirtualNpcEncounter } from "@/lib/virtualLifeNpcEncounterEngine";

export function VirtualNpcEncounterCard({ encounter }: { encounter?: VirtualNpcEncounter }) {
  if (!encounter) {
    return (
      <div className="aether-card p-5 text-xs text-muted-foreground">
        今天没有 NPC 遭遇。可以专心做你的主任务。
      </div>
    );
  }
  return (
    <div className="aether-card p-5 space-y-2">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">NPC Encounter · 今日遭遇</div>
      <div className="flex items-baseline justify-between">
        <div className="text-sm font-display">{encounter.npcName}</div>
        <div className="text-[10px] text-muted-foreground">{encounter.archetype}</div>
      </div>
      <div className="text-[11px] text-muted-foreground">{encounter.encounterScene}</div>
      <div className="text-sm text-foreground/90">「{encounter.message}」</div>
      {encounter.relatedRealQuestion && (
        <div className="text-[11px]"><span className="text-primary">相关现实问题：</span>{encounter.relatedRealQuestion}</div>
      )}
      <div className="text-[11px]"><span className="text-primary">建议回应：</span>{encounter.recommendedResponse}</div>
      <div className="text-[10px] text-amber-200/70">{encounter.safetyNote}</div>
    </div>
  );
}
