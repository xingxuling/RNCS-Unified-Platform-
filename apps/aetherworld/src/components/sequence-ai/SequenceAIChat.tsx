import { useMemo, useState } from "react";
import { SEQUENCE_AI_MODES, type SequenceAIMode } from "@/constants/sequence-ai/sequenceAIModes";
import { runSequenceAI, type SequenceAIRunResult } from "@/lib/sequence-ai/sequenceAI";
import { listSequenceAIMemory, clearSequenceAIMemory, exportSequenceAIMemory } from "@/lib/sequence-ai/sequenceAIMemory";
import { useFounderState } from "@/hooks/useFounderState";
import { isBeginnerMode } from "@/constants/onboardingUserStates";
import { SequenceAIInputBox } from "./SequenceAIInputBox";
import { SequenceAIResponseCard } from "./SequenceAIResponseCard";
import { SequenceAIEngineTrace } from "./SequenceAIEngineTrace";
import { SequenceAIContextPanel } from "./SequenceAIContextPanel";
import { SequenceAISafetyNote } from "./SequenceAISafetyNote";
import { SequenceAIQuickActions } from "./SequenceAIQuickActions";
import { SequenceAIExportPanel } from "./SequenceAIExportPanel";
import { Button } from "@/components/ui/button";

export function SequenceAIChat() {
  const { active: founderActive } = useFounderState();
  const beginner = isBeginnerMode();
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<SequenceAIMode>("AUTO");
  const [result, setResult] = useState<SequenceAIRunResult | null>(null);
  const [loading, setLoading] = useState(false);

  const subjectMode = founderActive ? "FOUNDER" : "DEMO";
  const memory = useMemo(() => listSequenceAIMemory(subjectMode), [result, subjectMode]);

  const submit = () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const r = runSequenceAI({
        userInput: input,
        founderActive,
        beginnerMode: beginner,
        subjectMode,
      });
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  const clearMem = () => { clearSequenceAIMemory(subjectMode); setResult((r) => r); };
  const exportMem = (fmt: "json" | "markdown") => {
    const data = exportSequenceAIMemory(subjectMode, fmt);
    const blob = new Blob([data], { type: fmt === "json" ? "application/json" : "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `sequence-ai-memory.${fmt === "json" ? "json" : "md"}`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1.5">
        {SEQUENCE_AI_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            disabled={m.id === "FOUNDER" && !founderActive}
            className={`text-[11px] px-2.5 py-1 rounded border ${
              mode === m.id ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:bg-muted"
            } disabled:opacity-40`}
            title={m.hint}
          >
            {m.label}<span className="ml-1 opacity-50">{m.en}</span>
          </button>
        ))}
      </div>

      <SequenceAIInputBox value={input} onChange={setInput} onSubmit={submit} loading={loading} />

      {result && (
        <div className="space-y-4">
          <SequenceAIContextPanel ctx={result.context} />
          <SequenceAIResponseCard response={result.response} />
          <SequenceAIQuickActions
            actions={result.response.quickActions}
            response={result.response}
            sourceInput={input}
            subjectMode={result.context.subjectMode}
            language={result.context.language}
          />
          <SequenceAISafetyNote notes={result.response.safetyNotes} />
          <SequenceAIExportPanel assets={result.response.generatedAssets} exportOptions={result.plan.exportOptions} />
          {(founderActive || !beginner) && <SequenceAIEngineTrace plan={result.response.engineTrace ?? result.plan} />}
        </div>
      )}

      <section className="rounded-md border border-border/60 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">本地记忆（仅本地，最多 50 条）</div>
          <div className="flex gap-1.5">
            <Button size="sm" variant="ghost" onClick={() => exportMem("markdown")} disabled={!memory.length}>导出 MD</Button>
            <Button size="sm" variant="ghost" onClick={() => exportMem("json")} disabled={!memory.length}>导出 JSON</Button>
            <Button size="sm" variant="ghost" onClick={clearMem} disabled={!memory.length}>清空</Button>
          </div>
        </div>
        {memory.length === 0 ? (
          <div className="text-xs text-muted-foreground">暂无对话记录。</div>
        ) : (
          <ul className="text-xs space-y-1 max-h-48 overflow-y-auto">
            {memory.slice(0, 12).map((m) => (
              <li key={m.id} className="border-b border-border/40 pb-1">
                <span className="text-muted-foreground">{new Date(m.createdAt).toLocaleString()}</span>
                <span className="ml-2">{m.intent}</span>
                <div className="text-muted-foreground line-clamp-1">{m.userInput}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
