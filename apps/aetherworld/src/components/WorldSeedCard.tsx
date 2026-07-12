import type { VirtualWorldSeedResult } from "@/lib/virtualWorldSeedCompiler";

export function WorldSeedCard({ seed }: { seed: VirtualWorldSeedResult }) {
  return (
    <div className="aether-card-elevated p-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">World Seed · 世界种子</div>
      <div className="font-display text-2xl gold-text mt-1">{seed.seedName}</div>
      <div className="text-xs text-muted-foreground mt-1">签名 {seed.seedSignature}</div>
      <div className="gold-divider my-3" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        <Field label="主导数" value={String(seed.dominantNumber)} />
        <Field label="主导域" value={seed.dominantDomain} />
        <Field label="薄弱域" value={seed.weakDomain} />
        <Field label="缺失数" value={seed.missingNumbers.join(" · ") || "无"} />
        <Field label="末段" value={seed.terminalPattern} />
      </div>
      <div className="mt-3 text-sm text-foreground/90 leading-relaxed">{seed.seedInterpretation}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {seed.worldGenerationBias.map(b => (
          <span key={b} className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary">{b}</span>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-foreground/90 mt-0.5">{value}</div>
    </div>
  );
}
