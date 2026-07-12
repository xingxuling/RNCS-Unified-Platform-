import type { FullSubjectAnalysis } from "@/lib/realSubjectCalculus";
import { FIVE_DOMAIN_META } from "@/constants/subjectSequenceModes";
import { Badge } from "@/components/ui/badge";

interface Props {
  analysis: FullSubjectAnalysis;
}

export function FullSubjectProfileCard({ analysis }: Props) {
  const { fiveDomain, terminal, cycleConsistency, dominantCycle, mainlineRisingDigits, fadingDigits } = analysis;

  return (
    <div className="aether-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Full Subject Profile</div>
          <div className="font-display text-xl gold-text">完整主体侧写</div>
        </div>
        <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
          主导循环 {dominantCycle}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <Stat label="最强域" value={FIVE_DOMAIN_META[fiveDomain.strongestDomain].cn} />
        <Stat label="最弱域" value={FIVE_DOMAIN_META[fiveDomain.weakestDomain].cn} />
        <Stat label="最稳定域" value={FIVE_DOMAIN_META[fiveDomain.mostStableDomain].cn} />
        <Stat label="最波动域" value={FIVE_DOMAIN_META[fiveDomain.mostVolatileDomain].cn} />
        <Stat label="三循环一致性" value={`${cycleConsistency} / 100`} />
        <Stat label="终端集中度" value={`${terminal.terminalConcentrationScore} / 100`} />
        <Stat label="主导终端数字" value={String(terminal.dominantTerminal)} accent={terminal.singularityLikePattern} />
        <Stat label="风域收束结构" value={terminal.singularityLikePattern ? "已形成" : "未形成"} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <DigitsRow title="主线增强数字（三轮持续上升）" digits={mainlineRisingDigits} tone="up" />
        <DigitsRow title="退场变量（三轮持续衰减）" digits={fadingDigits} tone="down" />
      </div>

      <div className="rounded-md border border-border/60 bg-secondary/20 p-3">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">终端模式解释</div>
        <div className="text-xs text-muted-foreground leading-relaxed">{terminal.interpretation}</div>
      </div>

      <div className="text-[10px] text-muted-foreground/70 italic leading-relaxed">
        当前系统将三轮解释为「底盘 → 现实压力 → 终局收束」结构；它是默认解释模板，不应被视为绝对命运判断。
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-secondary/20 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`font-display text-base mt-0.5 ${accent ? "gold-text" : ""}`}>{value}</div>
    </div>
  );
}

function DigitsRow({ title, digits, tone }: { title: string; digits: number[]; tone: "up" | "down" }) {
  return (
    <div className="rounded-md border border-border bg-secondary/20 p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{title}</div>
      {digits.length === 0 ? (
        <div className="text-xs text-muted-foreground italic">无</div>
      ) : (
        <div className="flex gap-2 flex-wrap">
          {digits.map((d) => (
            <div
              key={d}
              className={`font-display text-base px-3 py-1 rounded border ${
                tone === "up"
                  ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/5"
                  : "border-destructive/40 text-destructive bg-destructive/5"
              }`}
            >
              {d}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
