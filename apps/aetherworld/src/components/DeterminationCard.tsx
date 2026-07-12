// 定数判断卡片
import { DETERMINATION_STATES } from "@/constants/determinationStates";
import type { DeterminationResult } from "@/lib/determinantNumber";
import { ShieldCheck, AlertTriangle, CircleDot, Lock, Unlock, Activity } from "lucide-react";

interface Props {
  result: DeterminationResult;
  compact?: boolean;
  title?: string;
  caption?: string;
}

export function DeterminationCard({ result, compact, title = "定数判断", caption = "Determinant Number" }: Props) {
  const meta = DETERMINATION_STATES[result.status];

  return (
    <div className="aether-card-elevated p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{caption}</div>
          <div className="font-display text-xl gold-text mt-1">{title}</div>
          <div className="mt-2 text-xs text-muted-foreground max-w-md">{meta.desc}</div>
        </div>
        <div className="text-right shrink-0">
          <div
            className="font-display text-3xl"
            style={{ color: meta.colorVar }}
          >
            {result.determinationScore}
          </div>
          <div
            className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px]"
            style={{ borderColor: meta.colorVar, color: meta.colorVar }}
          >
            <CircleDot className="w-3 h-3" /> {meta.label}
          </div>
        </div>
      </div>

      {/* 进度条 */}
      <div className="mt-4 h-1.5 rounded-full bg-muted/20 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${result.determinationScore}%`,
            background: meta.colorVar,
            opacity: 0.85,
          }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground font-mono">
        <span>未定</span><span>半定</span><span>接近</span><span>已定</span>
      </div>

      {!compact && (
        <>
          <div className="gold-divider my-4" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Block icon={<Lock className="w-3.5 h-3.5" />} title="已固定变量" items={result.fixedVariables} tone="good" empty="尚无已收束变量" />
            <Block icon={<Unlock className="w-3.5 h-3.5" />} title="仍开放变量" items={result.openVariables} tone="warn" empty="无明显开放变量" />
            <Block icon={<AlertTriangle className="w-3.5 h-3.5" />} title="假信号 / 噪声" items={result.falseSignals} tone="bad" empty="未检出假信号" />
            <Block icon={<ShieldCheck className="w-3.5 h-3.5" />} title="定数来源" items={result.determiningFactors} tone="primary" empty="尚未形成定数源" />
          </div>

          {result.blockingFactors.length > 0 && (
            <div className="mt-3">
              <Block icon={<Activity className="w-3.5 h-3.5" />} title="阻断来源" items={result.blockingFactors} tone="bad" empty="" />
            </div>
          )}

          <div className="mt-4 rounded-md border border-primary/30 bg-primary/5 p-3">
            <div className="text-[10px] uppercase tracking-widest text-primary/80">最终动作</div>
            <div className="mt-1 text-sm">{result.finalAction}</div>
          </div>

          <div className="mt-3 text-xs text-muted-foreground leading-relaxed">
            {result.explanation}
          </div>

          {result.raw.overrides.length > 0 && (
            <div className="mt-2 text-[10px] text-muted-foreground/80">
              覆盖：{result.raw.overrides.join(" · ")}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Block({
  icon, title, items, tone, empty,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  tone: "good" | "bad" | "warn" | "primary";
  empty: string;
}) {
  const color =
    tone === "good"    ? "text-trigger-high border-trigger-high/30 bg-trigger-high/5" :
    tone === "bad"     ? "text-destructive border-destructive/30 bg-destructive/5" :
    tone === "warn"    ? "text-trigger-mid border-trigger-mid/30 bg-trigger-mid/5" :
                         "text-primary border-primary/30 bg-primary/5";
  return (
    <div className={`rounded-md border p-3 ${color}`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest">
        {icon}{title}
      </div>
      {items.length ? (
        <ul className="mt-1.5 space-y-0.5 text-xs text-foreground/85">
          {items.map((it, i) => (<li key={i}>· {it}</li>))}
        </ul>
      ) : (
        empty ? <div className="mt-1 text-[11px] text-muted-foreground/70">{empty}</div> : null
      )}
    </div>
  );
}
