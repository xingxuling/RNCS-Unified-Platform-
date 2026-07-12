import type { CodeRepairSuggestion } from "@/lib/code-sandbox/codeRunRequestEngine";

export function CodeRepairSuggestionPanel({ suggestions }: { suggestions: CodeRepairSuggestion[] }) {
  return (
    <div className="border border-border/40 rounded p-3 space-y-2">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Repair Suggestions · 修复建议</div>
      {suggestions.length === 0 && <div className="text-[12px] text-muted-foreground">暂无修复建议。</div>}
      <ul className="space-y-2">
        {suggestions.map((s) => (
          <li key={s.suggestionId} className="border border-border/30 rounded p-2 text-[12px] space-y-1">
            <div className="flex items-center justify-between">
              <div className="font-medium">{s.title}</div>
              <span className="text-[10px] text-muted-foreground">置信度 {(s.confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="text-[11px] text-muted-foreground whitespace-pre-wrap">{s.explanation}</div>
            <ul className="text-[11px] text-muted-foreground space-y-0.5">
              {s.suggestedActions.map((a, i) => <li key={i}>· {a}</li>)}
            </ul>
            <div className="text-[10px] text-muted-foreground">
              {s.canAutoPatch ? "可生成 Patch Draft" : "需要人工修复"} · {s.requiresHumanReview ? "需人工审查" : "无强制审查"}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
