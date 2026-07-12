import type { SignalPurificationResult } from "@/lib/signalPurification";
import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

const TONE = {
  YES:     { Icon: ShieldCheck, color: "text-trigger-high",  border: "border-trigger-high/40" },
  CAUTION: { Icon: ShieldAlert, color: "text-trigger-mid",   border: "border-trigger-mid/40" },
  NO:      { Icon: ShieldX,     color: "text-destructive",   border: "border-destructive/40" },
} as const;

export function SignalPurificationCard({ result, compact }: { result: SignalPurificationResult; compact?: boolean }) {
  const meta = TONE[result.permission];
  const Icon = meta.Icon;
  return (
    <div className={`aether-card p-4 border-l-2 ${meta.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Signal Purification</div>
          <div className="font-display text-lg gold-text mt-1">信号净化 · {result.typeName}</div>
        </div>
        <div className={`flex items-center gap-1.5 text-sm font-mono ${meta.color}`}>
          <Icon className="w-4 h-4" />{result.permission}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 text-center">
        <Cell label="质量分" value={`${result.score}`} mono />
        <Cell label="等级" value={result.level} />
        <Cell label="噪声源" value={result.noiseSources.length ? String(result.noiseSources.length) : "0"} mono />
      </div>
      {!compact && (
        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
          {result.noiseSources.length > 0 && (
            <div><span className="text-primary/80">噪声：</span>{result.noiseSources.join(" · ")}</div>
          )}
          <div><span className="text-primary/80">验证点：</span>{result.validation}</div>
          <div><span className="text-primary/80">下一步：</span>{result.nextObservation}</div>
        </div>
      )}
    </div>
  );
}

function Cell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-md bg-muted/20 py-1.5">
      <div className="text-[10px] text-muted-foreground tracking-wider">{label}</div>
      <div className={`text-sm mt-0.5 ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
