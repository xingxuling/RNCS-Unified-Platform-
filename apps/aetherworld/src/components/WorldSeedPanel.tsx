import type { PersonalWorldResult } from "@/lib/personalWorldCalculus";

export function WorldSeedPanel({ result }: { result: PersonalWorldResult }) {
  const domainName: Record<string, string> = { tian: "天", di: "地", ren: "人", shen: "神", feng: "风" };
  return (
    <div className="aether-card p-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">World Seed · 世界种子</div>
      <div className="font-mono text-3xl gold-text mt-2 tracking-widest">{result.worldSeedSignature}</div>
      <div className="gold-divider my-4" />
      <div className="grid grid-cols-2 gap-3 text-xs">
        <Stat label="核心数字" value={String(result.dominantNumber)} mono />
        <Stat label="主导域" value={domainName[result.dominantDomain]} />
        <Stat label="最弱域" value={domainName[result.weakestDomain]} />
        <Stat label="缺位数字" value={result.missingNumbers.length ? result.missingNumbers.join("·") : "无"} mono />
      </div>
    </div>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-secondary/20 p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 text-base ${mono ? "font-mono" : "font-display"}`}>{value}</div>
    </div>
  );
}
