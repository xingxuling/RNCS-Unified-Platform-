import { useEffect, useMemo, useState } from "react";
import { runUniversalBreakthrough, type UniversalBreakthroughResult } from "@/lib/universalBreakthroughCalculus";
import type { RecursiveFailureType } from "@/lib/recursiveReseolver";
import { isBeginnerMode } from "@/constants/onboardingUserStates";
import { useFounderState } from "@/hooks/useFounderState";
import { ObjectInputCard } from "./ObjectInputCard";
import { FiveDomainMappingCard } from "./FiveDomainMappingCard";
import { ConstantGapMatrix } from "./ConstantGapMatrix";
import { ResistanceMap } from "./ResistanceMap";
import { ActionPermissionCard } from "./ActionPermissionCard";
import { SolutionPathBoard } from "./SolutionPathBoard";
import { ValidationPathChecklist } from "./ValidationPathChecklist";
import { RecursiveBreakthroughPanel } from "./RecursiveBreakthroughPanel";
import { BreakthroughReport } from "./BreakthroughReport";
import { BreakthroughSafetyNote } from "./BreakthroughSafetyNote";

export function UniversalBreakthroughPanel({ forceBeginner }: { forceBeginner?: boolean }) {
  const [text, setText] = useState("");
  const [objectTypeId, setObjectTypeId] = useState("");
  const [result, setResult] = useState<UniversalBreakthroughResult | null>(null);
  const [beginner, setBeginner] = useState(true);
  const { active: founderActive } = useFounderState();

  useEffect(() => {
    setBeginner(forceBeginner ?? isBeginnerMode());
  }, [forceBeginner]);

  const effectiveBeginner = forceBeginner ?? beginner;

  const run = (failure?: RecursiveFailureType) => {
    if (!text.trim()) return;
    setResult(runUniversalBreakthrough({
      text, objectTypeId: objectTypeId || undefined,
      beginner: effectiveBeginner, observedFailure: failure,
    }));
  };

  const showAdvanced = useMemo(() => !effectiveBeginner, [effectiveBeginner]);

  return (
    <div className="space-y-5">
      <ObjectInputCard
        text={text}
        onTextChange={setText}
        objectTypeId={objectTypeId}
        onObjectTypeChange={setObjectTypeId}
        onRun={() => run()}
        beginner={effectiveBeginner}
      />

      {!result ? (
        <div className="aether-card-elevated p-8 text-center text-sm text-muted-foreground">
          {effectiveBeginner
            ? "把你现在卡住的问题写下来，系统会帮你拆成：卡在哪里、缺什么、先做哪一步、怎么验证。"
            : "等待输入。万物破解计算法将输出五域映射、常数缺口、阻力图、行动许可、解法路径与验证路径。"}
        </div>
      ) : (
        <>
          {effectiveBeginner && (
            <section className="aether-card-elevated p-5 space-y-2">
              <h3 className="font-display text-base gold-text">问题拆解结果</h3>
              <div className="text-sm"><span className="text-muted-foreground text-xs mr-1">你真正卡住的点：</span>{result.beginnerSummary.realStuckPoint}</div>
              <div className="text-sm"><span className="text-muted-foreground text-xs mr-1">当前最缺：</span>{result.beginnerSummary.mostMissing}</div>
              <div className="text-sm"><span className="text-muted-foreground text-xs mr-1">现在最适合的动作：</span>{result.beginnerSummary.bestNextAction}</div>
              <div className="text-sm"><span className="text-muted-foreground text-xs mr-1">不建议做：</span>{result.beginnerSummary.avoid.join("、") || "—"}</div>
              <div className="text-sm">
                <span className="text-muted-foreground text-xs mr-1">怎么验证：</span>
                <ul className="list-disc list-inside mt-1 text-sm">
                  {result.beginnerSummary.howToValidate.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            </section>
          )}

          <BreakthroughSafetyNote findings={result.safety} beginner={effectiveBeginner} />

          {showAdvanced && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FiveDomainMappingCard data={result.domains} />
                <ConstantGapMatrix data={result.gaps} />
                <ResistanceMap data={result.resistance} />
                <ActionPermissionCard data={result.permission} />
              </div>
              <SolutionPathBoard data={result.solution} />
              <ValidationPathChecklist data={result.validation} />
              <RecursiveBreakthroughPanel suggestions={result.recursion} onReRun={(f) => run(f)} />
              <BreakthroughReport data={result} />
            </>
          )}

          {founderActive && showAdvanced && (
            <section className="aether-card-elevated p-5 space-y-2 border-primary/30">
              <div className="text-[10px] uppercase tracking-[0.25em] text-primary">Founder Console</div>
              <h3 className="font-display text-base gold-text">保存为可复用资产</h3>
              <p className="text-xs text-muted-foreground">
                本次破解结果可保存为：新计算法 / 新百科条目 / 新 Prompt 模板 / 新产品模块建议 / 新虚拟世界规则 / 新事件类型 / 新常数候选。
              </p>
              <div className="flex flex-wrap gap-2">
                {["保存为新计算法","写入百科草稿","生成 Prompt 模板","生成产品模块建议","转为虚拟世界任务","加入事件库","建议新常数"].map((b) => (
                  <button key={b}
                    onClick={() => {
                      // store as draft in localStorage
                      try {
                        const key = "breakthrough.drafts";
                        const list = JSON.parse(localStorage.getItem(key) || "[]");
                        list.unshift({ at: Date.now(), kind: b, snapshot: result });
                        localStorage.setItem(key, JSON.stringify(list.slice(0, 50)));
                        alert(`已保存草稿：${b}`);
                      } catch { /* ignore */ }
                    }}
                    className="text-[11px] px-2 py-1 rounded border border-border hover:border-primary/40">
                    {b}
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
