import { useState } from "react";
import { ALL_FAILURE_TYPES, type RecursiveResolveSuggestion, type RecursiveFailureType } from "@/lib/recursiveReseolver";

interface Props {
  suggestions: RecursiveResolveSuggestion[];
  onReRun: (failure: RecursiveFailureType) => void;
}

const LABELS: Record<RecursiveFailureType, string> = {
  WRONG_OBJECT: "对象识别错了",
  WRONG_STAGE: "阶段判断错了",
  WRONG_GAP: "缺口判断错了",
  WRONG_ACTION: "行动许可错了",
  FIELD_BLOCKED: "场域阻断超预期",
  HUMAN_VARIABLE_MISSING: "关键人未到位",
  RESOURCE_NOT_ENOUGH: "资源不足",
  NOISE_TOO_HIGH: "噪声过高",
  TIMING_WRONG: "时间窗口错",
  EXTERNAL_RANDOMNESS: "外部随机性强",
};

export function RecursiveBreakthroughPanel({ suggestions, onReRun }: Props) {
  const [pick, setPick] = useState<RecursiveFailureType>("WRONG_ACTION");
  return (
    <section className="aether-card-elevated p-5 space-y-3">
      <h3 className="font-display text-base gold-text">递归再破解 · Recursive Re-Solving</h3>
      <p className="text-xs text-muted-foreground">
        失败不是终点，是下一轮输入。选择失败类型，系统会用新输入重新破解。
      </p>
      <ul className="space-y-2">
        {suggestions.map((s) => (
          <li key={s.failureType} className="border border-border rounded p-3 text-sm space-y-1">
            <div className="font-medium">{LABELS[s.failureType]}</div>
            <div className="text-xs text-muted-foreground">{s.diagnosis}</div>
            <div className="text-[11px]">下轮调整：{s.nextRoundAdjustments.join(" · ")}</div>
            <div className="text-[11px] text-muted-foreground">下轮输入：{s.nextRoundInputs.join(" · ")}</div>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2 border-t border-border/60 pt-3">
        <select value={pick} onChange={(e) => setPick(e.target.value as RecursiveFailureType)}
          className="bg-background border border-border rounded px-2 py-1 text-xs">
          {ALL_FAILURE_TYPES.map((f) => <option key={f} value={f}>{LABELS[f]}</option>)}
        </select>
        <button onClick={() => onReRun(pick)}
          className="text-xs px-3 py-1 rounded bg-primary text-primary-foreground">
          按此失败类型重算
        </button>
      </div>
    </section>
  );
}
