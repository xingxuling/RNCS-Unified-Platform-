import { useMemo, useState } from "react";
import { runCrossFunctional, saveCrossFunctionalToWorkspace, type CrossFunctionalRunResult } from "@/lib/cross-functional/crossFunctionalApplicationCalculus";
import { CROSS_FUNCTIONAL_EXAMPLES } from "@/lib/cross-functional/crossFunctionalExamplesRegistry";
import { CrossFunctionalIntentCard } from "./CrossFunctionalIntentCard";
import { CrossFunctionalVariableMap as VariableMapView } from "./CrossFunctionalVariableMap";
import { CrossFunctionalWorkflowPanel } from "./CrossFunctionalWorkflowPanel";
import { CrossFunctionalEngineBridgePanel } from "./CrossFunctionalEngineBridgePanel";
import { CrossFunctionalOutputPreview } from "./CrossFunctionalOutputPreview";
import { CrossFunctionalQaPanel } from "./CrossFunctionalQaPanel";
import { CrossFunctionalSafetyNote } from "./CrossFunctionalSafetyNote";

const DEFAULT_TEXT = "把角色蓝天机变成一首角色歌，并生成 Suno Prompt 和宣传文案。";

export function CrossFunctionalPanel() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [result, setResult] = useState<CrossFunctionalRunResult | null>(() => runCrossFunctional({ text: DEFAULT_TEXT }));
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const examples = useMemo(() => CROSS_FUNCTIONAL_EXAMPLES.slice(0, 6), []);

  const run = (nextText: string) => {
    setText(nextText);
    setResult(runCrossFunctional({ text: nextText }));
    setSaveMsg(null);
  };

  return (
    <div className="space-y-5">
      <CrossFunctionalSafetyNote />

      <div className="aether-card p-4 space-y-3">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">输入对象 / 跨域意图</div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="w-full bg-background/40 border border-border/60 rounded p-2 text-sm focus:outline-none focus:border-primary/50"
          placeholder="例如：把这个角色生成角色曲、剧情片段和视觉 Prompt"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => run(text)}
            className="text-xs rounded border border-primary/50 text-primary px-3 py-1.5 hover:bg-primary/10 transition"
          >
            生成跨域方案
          </button>
          <span className="text-[10px] text-muted-foreground">示例：</span>
          {examples.map((ex) => (
            <button
              key={ex.id}
              onClick={() => run(ex.inputText)}
              className="text-[11px] rounded border border-border/60 px-2 py-1 hover:border-primary/40 transition"
            >
              {ex.title}
            </button>
          ))}
        </div>
      </div>

      {result && (
        <>
          <CrossFunctionalIntentCard intent={result.intent} />
          <VariableMapView maps={result.variableMaps} />
          <CrossFunctionalWorkflowPanel
            workflow={result.workflow}
            alternatives={result.alternativeWorkflows.slice(0, 3)}
            onSwitch={(w) => setResult({ ...result, workflow: w })}
          />
          <CrossFunctionalEngineBridgePanel bridges={result.bridges} />
          <CrossFunctionalOutputPreview
            output={result.output}
            onSave={() => {
              const obj = saveCrossFunctionalToWorkspace(result.output, "USER_PRIVATE");
              setSaveMsg(`已保存为 Workspace 对象：${obj.objectId}`);
            }}
          />
          {saveMsg && <div className="text-xs text-emerald-400">{saveMsg}</div>}
          <CrossFunctionalQaPanel qa={result.qa} drift={result.drift} safety={result.safety} />
        </>
      )}
    </div>
  );
}
