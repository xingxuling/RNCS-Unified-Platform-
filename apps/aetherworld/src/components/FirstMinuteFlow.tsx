import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ONBOARDING_STEPS,
  ONBOARDING_CONCERNS,
  ONBOARDING_SAMPLE_VERDICTS,
} from "@/constants/onboardingSteps";
import { setOnboardingStage } from "@/constants/onboardingUserStates";
import { CheckCircle2, ChevronRight } from "lucide-react";

type EntryKind = "demo" | "light" | "expert";

export function FirstMinuteFlow() {
  const [step, setStep] = useState(0);
  const [entry, setEntry] = useState<EntryKind | null>(null);
  const [concern, setConcern] = useState<string | null>(null);

  const next = () => setStep((s) => Math.min(s + 1, ONBOARDING_STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <Card className="p-5 md:p-6 aether-card space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          First-Minute Flow · 1 分钟入门流程
        </div>
        <Badge variant="outline">{step + 1} / {ONBOARDING_STEPS.length}</Badge>
      </div>

      {/* Step Indicator */}
      <div className="flex gap-1.5">
        {ONBOARDING_STEPS.map((s, i) => (
          <div
            key={s.id}
            className={`h-1.5 flex-1 rounded ${
              i <= step ? "bg-primary" : "bg-border/40"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Choose Entry */}
      {step === 0 && (
        <div className="space-y-3">
          <div className="font-display text-lg">选择你想怎么开始</div>
          <div className="grid sm:grid-cols-3 gap-2">
            {[
              { id: "demo" as const,   label: "先体验 Demo", desc: "30 秒看一个示例判断" },
              { id: "light" as const,  label: "创建轻量模型", desc: "Light 20，可选输入" },
              { id: "expert" as const, label: "我是高级用户", desc: "直接进入主控台" },
            ].map((o) => (
              <button
                key={o.id}
                onClick={() => setEntry(o.id)}
                className={`text-left rounded border p-3 transition ${
                  entry === o.id
                    ? "border-primary bg-primary/5"
                    : "border-border/60 hover:border-primary/50"
                }`}
              >
                <div className="text-sm">{o.label}</div>
                <div className="text-[11px] text-muted-foreground mt-1">{o.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Choose Concern */}
      {step === 1 && (
        <div className="space-y-3">
          <div className="font-display text-lg">你现在最关心哪件事？</div>
          <div className="flex flex-wrap gap-2">
            {ONBOARDING_CONCERNS.map((c) => (
              <Button
                key={c.id}
                size="sm"
                variant={concern === c.id ? "default" : "outline"}
                onClick={() => setConcern(c.id)}
              >
                {c.cn}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Sample Verdict */}
      {step === 2 && (
        <div className="space-y-3">
          <div className="font-display text-lg">一个示例判断</div>
          {(() => {
            const v = ONBOARDING_SAMPLE_VERDICTS[concern ?? "other"];
            return (
              <div className="rounded-md border border-border/60 p-4 space-y-2 bg-background/40">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>当前状态：{v.status}</Badge>
                  <Badge variant="outline">建议动作：{v.suggestion}</Badge>
                </div>
                <div className="text-sm text-foreground/85">为什么：{v.why}</div>
                <div className="text-[11px] text-muted-foreground pt-2 border-t border-border/40">
                  这是模拟数据，用来演示产品怎么工作。
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Step 4: Next Step */}
      {step === 3 && (
        <div className="space-y-3">
          <div className="font-display text-lg">下一步</div>
          <div className="grid sm:grid-cols-2 gap-2">
            <Button asChild variant="outline" className="justify-start gap-2" onClick={() => setOnboardingStage("DEMO_VIEWED")}>
              <Link to="/calendar"><ChevronRight className="w-4 h-4" />看今天的触发日历</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start gap-2" onClick={() => setOnboardingStage("LIGHT_MODEL_CREATED")}>
              <Link to="/subject"><ChevronRight className="w-4 h-4" />创建我的模型</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start gap-2" onClick={() => setOnboardingStage("FEEDBACK_LOGGED")}>
              <Link to="/feedback"><ChevronRight className="w-4 h-4" />记录一次结果</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start gap-2">
              <Link to="/docs"><ChevronRight className="w-4 h-4" />继续了解</Link>
            </Button>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-emerald-300/80 pt-2">
            <CheckCircle2 className="w-3 h-3" /> 你已完成第一次体验。
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-border/40">
        <Button variant="ghost" size="sm" onClick={back} disabled={step === 0}>上一步</Button>
        <Button
          size="sm"
          onClick={next}
          disabled={
            (step === 0 && !entry) ||
            (step === 1 && !concern) ||
            step === ONBOARDING_STEPS.length - 1
          }
        >
          {step === ONBOARDING_STEPS.length - 1 ? "完成" : "下一步"}
        </Button>
      </div>
    </Card>
  );
}
