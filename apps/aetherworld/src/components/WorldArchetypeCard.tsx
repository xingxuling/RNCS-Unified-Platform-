import type { WorldArchetype } from "@/constants/worldArchetypes";

export function WorldArchetypeCard({ archetype }: { archetype: WorldArchetype }) {
  return (
    <div className="aether-card-elevated p-6">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">World Archetype · 世界原型</div>
      <div className="font-display text-2xl gold-text mt-1">{archetype.userFriendlyName}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{archetype.name}</div>
      <p className="text-sm text-foreground/90 mt-3 leading-relaxed">{archetype.description}</p>
      <div className="gold-divider my-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <Field label="行动风格" value={archetype.actionStyle} />
        <Field label="主要风险" value={archetype.riskPattern} />
        <Field label="视觉氛围" value={archetype.visualMood} />
        <Field label="叙事基调" value={archetype.narrativeTone} />
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-secondary/20 p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-sm text-foreground/90 mt-1 leading-relaxed">{value}</div>
    </div>
  );
}
