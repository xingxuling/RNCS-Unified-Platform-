import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  evaluateOnboardingFriction,
  defaultDashboardSnapshot,
  type OnboardingPageInput,
} from "@/lib/onboardingSimplificationEngine";
import { ONBOARDING_FRICTION_META } from "@/constants/onboardingFrictionTypes";

const SEVERITY_TONE: Record<string, string> = {
  LOW:      "bg-sky-500/15 text-sky-300 border-sky-500/30",
  MEDIUM:   "bg-amber-500/15 text-amber-300 border-amber-500/30",
  HIGH:     "bg-orange-500/15 text-orange-300 border-orange-500/30",
  CRITICAL: "bg-red-500/15 text-red-300 border-red-500/30",
};

/**
 * OnboardingFrictionAudit · 入门摩擦审计
 * 可手动调节参数，模拟当前入门页面的摩擦评估。
 */
export function OnboardingFrictionAudit() {
  const [input, setInput] = useState<OnboardingPageInput>(defaultDashboardSnapshot());

  const result = useMemo(() => evaluateOnboardingFriction(input), [input]);

  const tone = result.simplicityScore >= 75 ? "emerald"
            : result.simplicityScore >= 60 ? "cyan"
            : result.simplicityScore >= 40 ? "amber" : "rose";

  return (
    <Card className="p-5 aether-card space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Onboarding Friction Audit · 入门摩擦审计
          </div>
          <div className="font-display text-2xl gold-text mt-1">{result.simplicityScore}</div>
        </div>
        <Badge variant="outline" className={`tone-${tone}`}>
          {result.simplicityScore >= 70 ? "可进入 Guided Beta" : "建议简化"}
        </Badge>
      </div>
      <Progress value={result.simplicityScore} className="h-2" />

      <div className="grid sm:grid-cols-2 gap-3 text-xs">
        <Toggle label="包含 Demo 入口" value={input.hasDemoEntry} onChange={(v) => setInput({ ...input, hasDemoEntry: v })} />
        <Toggle label="包含下一步动作" value={input.hasNextAction} onChange={(v) => setInput({ ...input, hasNextAction: v })} />
        <Toggle label="强制先建模" value={input.requiresModelFirst} onChange={(v) => setInput({ ...input, requiresModelFirst: v })} />
        <Toggle label="要求复杂输入" value={input.requiresComplexInput} onChange={(v) => setInput({ ...input, requiresComplexInput: v })} />
        <Toggle label="移动端" value={input.isMobile} onChange={(v) => setInput({ ...input, isMobile: v })} />
        <Counter label="按钮数" value={input.buttonCount} onChange={(v) => setInput({ ...input, buttonCount: v })} />
        <Counter label="高阶术语数" value={input.highJargonCount} onChange={(v) => setInput({ ...input, highJargonCount: v })} />
        <Counter label="高级模块数" value={input.advancedModulesVisible} onChange={(v) => setInput({ ...input, advancedModulesVisible: v })} />
      </div>

      <div className="gold-divider" />

      {result.blockers.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Blockers · 阻碍项
          </div>
          <ul className="space-y-1 text-xs">
            {result.blockers.map((b, i) => (
              <li key={i} className="flex items-start gap-2">
                <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" /> {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.detectedFrictions.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">摩擦点</div>
          <div className="flex flex-wrap gap-1.5">
            {result.detectedFrictions.map((f) => {
              const m = ONBOARDING_FRICTION_META[f];
              return (
                <Badge key={f} variant="outline" className={SEVERITY_TONE[m.severity]}>
                  {m.cn} · {m.severity}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {result.recommendedSimplifications.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Recommendations · 建议
          </div>
          <ul className="space-y-1 text-xs text-foreground/85">
            {result.recommendedSimplifications.map((r, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" /> {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button size="sm" variant="outline" onClick={() => setInput(defaultDashboardSnapshot())}>
        重置默认快照
      </Button>
    </Card>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`text-left rounded border px-3 py-2 transition ${
        value ? "border-primary bg-primary/5" : "border-border/60"
      }`}
    >
      <div className="flex items-center justify-between">
        <span>{label}</span>
        <span className="text-[10px] text-muted-foreground">{value ? "是" : "否"}</span>
      </div>
    </button>
  );
}

function Counter({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="rounded border border-border/60 px-3 py-2 flex items-center justify-between">
      <span>{label}</span>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onChange(Math.max(0, value - 1))}>-</Button>
        <span className="w-5 text-center text-xs">{value}</span>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onChange(value + 1)}>+</Button>
      </div>
    </div>
  );
}
