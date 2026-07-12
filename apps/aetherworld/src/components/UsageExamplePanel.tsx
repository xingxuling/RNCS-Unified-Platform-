import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Sparkles } from "lucide-react";
import { ExampleUserTypeSelector } from "./ExampleUserTypeSelector";
import { ExampleScenarioCard } from "./ExampleScenarioCard";
import { ExampleInputOutputBlock } from "./ExampleInputOutputBlock";
import { ExampleActionSteps } from "./ExampleActionSteps";
import { ExampleSafetyNote } from "./ExampleSafetyNote";
import { EXAMPLE_SCENARIO_TYPES } from "@/constants/exampleScenarioTypes";
import { MODULE_EXAMPLE_GUIDES } from "@/constants/exampleModuleTypes";
import { queryExamples, type UsageExample } from "@/lib/usageExampleCalculus";
import { isBeginnerMode } from "@/constants/onboardingUserStates";
import { useFounderState } from "@/hooks/useFounderState";

export function UsageExamplePanel() {
  const [beginner, setBeginner] = useState(true);
  const { active: founder } = useFounderState();
  const [userType, setUserType] = useState<string | undefined>();
  const [scenario, setScenario] = useState<string | undefined>();
  const [moduleId, setModuleId] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState<UsageExample | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") setBeginner(isBeginnerMode());
  }, []);

  const examples = useMemo(
    () => queryExamples({ userType, scenarioType: scenario, moduleId, beginner, founder, search }),
    [userType, scenario, moduleId, beginner, founder, search],
  );

  return (
    <div className="space-y-5">
      <div className="aether-card-elevated p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Usage Example Calculus · 使用示例计算法</div>
        </div>
        <h2 className="font-display text-lg gold-text mt-1">不知道怎么用？先选一个场景</h2>
        <p className="text-xs text-muted-foreground mt-1.5">
          根据你的身份与场景，自动匹配最合适的输入模板、输出样例与下一步动作。可一键复制并跳转到对应模块。
        </p>
      </div>

      <ExampleSafetyNote compact />

      <div className="space-y-3">
        <div className="text-[11px] text-muted-foreground">我是谁</div>
        <ExampleUserTypeSelector value={userType} onChange={setUserType} />
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <div className="text-[11px] text-muted-foreground mb-1.5">场景</div>
          <select
            value={scenario ?? ""}
            onChange={(e) => setScenario(e.target.value || undefined)}
            className="w-full h-9 text-xs rounded-md bg-secondary/30 border border-border/60 px-2"
          >
            <option value="">全部场景</option>
            {EXAMPLE_SCENARIO_TYPES.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>
        <div>
          <div className="text-[11px] text-muted-foreground mb-1.5">模块</div>
          <select
            value={moduleId ?? ""}
            onChange={(e) => setModuleId(e.target.value || undefined)}
            className="w-full h-9 text-xs rounded-md bg-secondary/30 border border-border/60 px-2"
          >
            <option value="">全部模块</option>
            {MODULE_EXAMPLE_GUIDES.map((m) => (
              <option key={m.moduleId} value={m.moduleId}>{m.moduleName}</option>
            ))}
          </select>
        </div>
        <div>
          <div className="text-[11px] text-muted-foreground mb-1.5">搜索</div>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="例如：行动、虚拟生活、Bug"
            className="h-9 text-xs"
          />
        </div>
      </div>

      <div className="text-[11px] text-muted-foreground">
        匹配到 {examples.length} 个示例 · 当前可见复杂度：
        {founder ? " 全部（含 Founder）" : beginner ? " 新手 + 引导" : " 新手 → 高阶"}
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {examples.map((e) => (
          <ExampleScenarioCard key={e.id} example={e} onOpen={setFocused} />
        ))}
        {examples.length === 0 && (
          <div className="aether-card p-6 text-xs text-muted-foreground text-center">
            没有匹配到示例。试试清除筛选或前往 <Link to="/example-library" className="text-primary hover:underline">示例库</Link>。
          </div>
        )}
      </div>

      {focused && (
        <div className="aether-card-elevated p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">示例详情</div>
              <div className="font-display text-lg mt-0.5">{focused.title}</div>
            </div>
            <button onClick={() => setFocused(null)} className="text-[11px] text-muted-foreground hover:text-foreground">关闭</button>
          </div>
          <ExampleInputOutputBlock example={focused} />
          <ExampleActionSteps example={focused} />
          {focused.safetyNote && <ExampleSafetyNote note={focused.safetyNote} compact />}
        </div>
      )}
    </div>
  );
}
