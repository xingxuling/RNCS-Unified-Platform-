import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { SignalPurificationCard } from "@/components/SignalPurificationCard";
import { purifySignal, DEFAULT_SIGNAL_INPUT, type SignalInput } from "@/lib/signalPurification";
import { Slider } from "@/components/ui/slider";

export const Route = createFileRoute("/signal")({ component: SignalPage });

const FIELDS: { key: keyof SignalInput; name: string; hint: string; positive: boolean }[] = [
  { key: "repetition",        name: "信号重复度",   hint: "同一信号在不同情境出现的次数", positive: true },
  { key: "crossDomain",       name: "跨域一致性",   hint: "天/地/人/神/风是否都指向同方向", positive: true },
  { key: "realityFeedback",   name: "现实反馈",     hint: "有没有真实事件支撑", positive: true },
  { key: "timeFit",           name: "时间贴合度",   hint: "时机是否对应已知周期", positive: true },
  { key: "mainlineRelevance", name: "主线相关度",   hint: "是否服务主体长期主线", positive: true },
  { key: "emotion",           name: "情绪强度",     hint: "焦虑/兴奋/愤怒带来的放大", positive: false },
  { key: "wish",              name: "愿望污染",     hint: "因渴望而构造的画面", positive: false },
  { key: "fear",              name: "恐惧污染",     hint: "因害怕而构造的画面", positive: false },
  { key: "externalNoise",     name: "外界噪声",     hint: "他人议论 / 平台干扰", positive: false },
];

function SignalPage() {
  const [input, setInput] = useState<SignalInput>(DEFAULT_SIGNAL_INPUT);
  const result = useMemo(() => purifySignal(input), [input]);

  return (
    <>
      <PageHeader
        caption="Signal Purification · 信号净化"
        title="把感觉变成结构信号"
        subtitle="在所有预测开始前，先净化输入：哪部分可入模、哪部分是噪声、需等待哪个验证点。"
      />
      <div className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 aether-card p-5 space-y-4">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Input</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <div className="flex items-baseline justify-between">
                  <div className="text-sm">{f.name}{!f.positive && <span className="text-destructive/70 text-[10px] ml-1">(噪声)</span>}</div>
                  <div className="font-mono text-xs text-muted-foreground">{input[f.key]}/10</div>
                </div>
                <div className="text-[10px] text-muted-foreground mb-2">{f.hint}</div>
                <Slider
                  min={0} max={10} step={1}
                  value={[input[f.key]]}
                  onValueChange={(v) => setInput({ ...input, [f.key]: v[0] })}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <SignalPurificationCard result={result} />
          <div className="aether-card p-4 text-xs text-muted-foreground space-y-1">
            <div className="text-[10px] uppercase tracking-[0.25em] text-foreground/80 mb-1">公式</div>
            <div>真信号值 = (重复 × 跨域 × 反馈 × 时贴 × 主线) ÷ (情绪 × 愿望 × 恐惧 × 噪声)</div>
            <div className="mt-2">分子 ≈ <span className="font-mono">{result.breakdown.numerator}</span></div>
            <div>分母 ≈ <span className="font-mono">{result.breakdown.denominator}</span></div>
          </div>
        </div>
      </div>
    </>
  );
}
