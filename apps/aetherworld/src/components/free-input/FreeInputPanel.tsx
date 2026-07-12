import { useMemo, useState } from "react";
import { runFreeInputEngine, type FreeInputRunResult } from "@/lib/free-input/freeInputEngine";
import { listFreeInputMemory, clearFreeInputMemory, isFreeInputMemoryEnabled, setFreeInputMemoryEnabled } from "@/lib/free-input/freeInputMemory";
import { useFounderState } from "@/hooks/useFounderState";
import { isBeginnerMode } from "@/constants/onboardingUserStates";
import { Button } from "@/components/ui/button";
import { FreeInputBox } from "./FreeInputBox";
import { FreeAnswerCard } from "./FreeAnswerCard";
import { FreeTaskBreakdown } from "./FreeTaskBreakdown";
import { FreeInputTrace } from "./FreeInputTrace";
import { FreeClarificationCard } from "./FreeClarificationCard";
import { FreeQuickActions } from "./FreeQuickActions";
import { FreeSafetyNote } from "./FreeSafetyNote";

export function FreeInputPanel() {
  const { active: founderActive } = useFounderState();
  const beginner = isBeginnerMode();
  const subjectMode = founderActive ? "FOUNDER" : "DEMO";

  const [input, setInput] = useState("");
  const [result, setResult] = useState<FreeInputRunResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [memoryOn, setMemoryOn] = useState(() => isFreeInputMemoryEnabled());

  const submit = (skipClarify = false) => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const r = runFreeInputEngine(input, { founderActive, beginnerMode: beginner, subjectMode });
      if (skipClarify && r.answer.clarificationQuestion) {
        r.answer.clarificationQuestion = undefined;
      }
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  const memory = useMemo(() => listFreeInputMemory(subjectMode), [result, subjectMode, memoryOn]);
  const toggleMemory = () => {
    const next = !memoryOn;
    setFreeInputMemoryEnabled(next);
    setMemoryOn(next);
  };

  const showTrace = founderActive || !beginner;

  return (
    <div className="space-y-5">
      <FreeInputBox value={input} onChange={setInput} onSubmit={() => submit(false)} loading={loading} />

      {result && (
        <div className="space-y-4">
          <FreeClarificationCard
            question={result.answer.clarificationQuestion}
            fallback={result.ambiguity.safeFallback}
            onSkip={() => submit(true)}
          />
          <FreeAnswerCard answer={result.answer} />
          {showTrace && <FreeTaskBreakdown tasks={result.taskPlan.tasks} />}
          <FreeQuickActions actions={result.answer.quickActions} />
          <FreeSafetyNote notes={result.answer.safetyNotes} />
          {showTrace && <FreeInputTrace result={result} />}
        </div>
      )}

      <section className="rounded-md border border-border/60 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            本地记忆 {memoryOn ? "已开启" : "已关闭"}（仅本地，最多 50 条）
          </div>
          <div className="flex gap-1.5">
            <Button size="sm" variant="ghost" onClick={toggleMemory}>{memoryOn ? "关闭记忆" : "开启记忆"}</Button>
            <Button size="sm" variant="ghost" onClick={() => { clearFreeInputMemory(subjectMode); setResult((r) => r); }} disabled={!memory.length}>清空</Button>
          </div>
        </div>
        {memory.length === 0 ? (
          <div className="text-xs text-muted-foreground">暂无记录。</div>
        ) : (
          <ul className="text-xs space-y-1 max-h-48 overflow-y-auto">
            {memory.slice(0, 12).map((m) => (
              <li key={m.id} className="border-b border-border/40 pb-1">
                <span className="text-muted-foreground">{new Date(m.createdAt).toLocaleString()}</span>
                <span className="ml-2">[{m.normalizedInput.inputType}]</span>
                <div className="text-muted-foreground line-clamp-1">{m.rawInput}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
