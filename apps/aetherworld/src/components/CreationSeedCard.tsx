import type { CreationSeed } from "@/lib/creationSeedCompiler";

export function CreationSeedCard({ seed }: { seed: CreationSeed }) {
  return (
    <div className="aether-card p-5 space-y-2">
      <div className="flex justify-between items-baseline">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Creation Seed · 创造物种子</div>
        <div className="text-[11px] font-mono text-primary">{seed.signature}</div>
      </div>
      <div className="text-sm">{seed.name}</div>
      <div className="text-[11px] text-muted-foreground">类型：{seed.objectType.userFriendlyName}　·　复杂度 {seed.seedComplexity}/100</div>
      <div className="flex flex-wrap gap-1">
        {seed.seedKeywords.map(k => (
          <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-background/60 border border-border/40">{k}</span>
        ))}
      </div>
    </div>
  );
}
