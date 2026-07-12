import type { SequenceObjectSeed } from "@/lib/sequence-object/motherSequenceObjectSeedEngine";

export function SequenceObjectSeedPanel({ seed }: { seed: SequenceObjectSeed | null }) {
  if (!seed) return <div className="text-xs text-muted-foreground">无种子（非数列来源）。</div>;
  return (
    <div className="rounded-md border border-border bg-card/40 p-3 text-sm">
      <div className="mb-2 font-medium">对象种子 · Object Seed</div>
      <div className="text-xs text-muted-foreground mb-2">{seed.seedPattern}</div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>主导数字：{seed.dominantDigits.join(", ")}</div>
        <div>建议层级：{seed.suggestedObjectLayer}</div>
        <div>重复模式：{seed.patternFlags.repetitionPattern}</div>
        <div>跃迁模式：{seed.patternFlags.transitionPattern}</div>
        <div>导出潜力：{seed.patternFlags.exportPotential}</div>
        <div>运行潜力：{seed.patternFlags.runtimePotential}</div>
      </div>
      <div className="mt-2 text-xs">候选类型：{seed.objectPotentialTypes.join(", ")}</div>
      <ul className="mt-2 text-xs text-muted-foreground space-y-0.5">
        {seed.safetyNotes.map((n, i) => <li key={i}>· {n}</li>)}
      </ul>
    </div>
  );
}
