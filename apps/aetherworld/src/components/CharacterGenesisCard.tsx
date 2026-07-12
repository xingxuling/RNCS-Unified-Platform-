import type { GeneratedCharacter } from "@/lib/characterGenesisEngine";

export function CharacterGenesisCard({ character }: { character: GeneratedCharacter }) {
  return (
    <div className="aether-card-elevated p-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Character · 角色生成</div>
      <div className="font-display text-2xl gold-text mt-1">{character.characterName}</div>
      <div className="text-sm text-muted-foreground">{character.className} · {character.archetype}</div>
      <div className="gold-divider my-3" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <Field label="主属性" value={character.primaryAttribute} />
        <Field label="副属性" value={character.secondaryAttribute} />
        <Field label="隐藏天赋" value={character.hiddenTalent} />
        <Field label="弱点" value={character.weakness} />
        <Field label="出生区域" value={character.startingZone} />
        <Field label="主线偏向" value={character.mainQuestBias} />
        <Field label="关系偏向" value={character.relationshipBias} />
        <Field label="成长路径" value={character.growthPath} />
      </div>
    </div>
  );
}
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-foreground/90 mt-0.5 leading-snug">{value}</div>
    </div>
  );
}
