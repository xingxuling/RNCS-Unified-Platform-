import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { ResonanceMap } from "@/components/ResonanceMap";
import { lockResonance } from "@/lib/resonanceLock";
import { useAetherData } from "@/lib/useAetherData";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/resonance")({ component: ResonancePage });

function ResonancePage() {
  const { active, ready } = useAetherData();
  const [objectName, setObjectName] = useState("Lovable");
  const [fieldSupport, setFieldSupport] = useState(6);
  const [feedbackDirection, setFeedbackDirection] = useState(4);
  const [mainline, setMainline] = useState(7);
  const [noise, setNoise] = useState(3);

  const result = useMemo(() => {
    if (!active) return null;
    return lockResonance(active, {
      objectName,
      fieldSupport, feedbackDirection,
      mainlineLegitimacy: mainline, noise,
    });
  }, [active, objectName, fieldSupport, feedbackDirection, mainline, noise]);

  if (!ready || !active || !result) return <div className="p-10 text-muted-foreground">引擎启动中…</div>;

  return (
    <>
      <PageHeader
        caption="Resonance Lock · 共振锁定"
        title="主体 × 对象 共振判断"
        subtitle="把人名、项目名、公司名、地点或日期转为数字频率，判断是否会从感觉变成现实事件。"
      />
      <div className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="aether-card p-5 space-y-4">
          <div>
            <div className="text-sm mb-1">对象名 / 项目 / 地点</div>
            <Input value={objectName} onChange={(e) => setObjectName(e.target.value)} placeholder="如：Lovable / 香港 / Ari" />
          </div>
          <Field label="场域承载" hint="目标场域是否能承载这段关系/合作" v={fieldSupport} set={setFieldSupport} max={10} />
          <Field label="反馈方向" hint="对方/对象给的反馈是正向还是负向" v={feedbackDirection} set={setFeedbackDirection} min={-10} max={10} />
          <Field label="主线合法性" hint="对主体长期主线是否合理" v={mainline} set={setMainline} max={10} />
          <Field label="噪声" hint="情绪/误解/外界干扰" v={noise} set={setNoise} max={10} />
        </div>
        <ResonanceMap result={result} />
      </div>
    </>
  );
}

function Field({ label, hint, v, set, min = 0, max = 10 }: { label: string; hint?: string; v: number; set: (n: number) => void; min?: number; max?: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div className="text-sm">{label}</div>
        <div className="font-mono text-xs text-muted-foreground">{v}/{max}</div>
      </div>
      {hint && <div className="text-[10px] text-muted-foreground mb-2">{hint}</div>}
      <Slider min={min} max={max} step={1} value={[v]} onValueChange={(x) => set(x[0])} />
    </div>
  );
}
