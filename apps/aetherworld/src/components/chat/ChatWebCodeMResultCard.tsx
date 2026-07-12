import type { WebCodeMResult } from "@/lib/web-codem/webCodeMTypes";

interface Props {
  data: WebCodeMResult;
  onAction?: (action: { type: string; route?: string; payload?: Record<string, unknown> }) => void;
}

const STATUS_TONE: Record<string, string> = {
  PASS: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10",
  WARN: "text-amber-300 border-amber-500/40 bg-amber-500/10",
  FAIL: "text-rose-300 border-rose-500/40 bg-rose-500/10",
  BLOCKED: "text-rose-300 border-rose-500/40 bg-rose-500/10",
};

export function ChatWebCodeMResultCard({ data, onAction }: Props) {
  const { run, qa, cardTitle, cardBullets, modeNote, actions } = data;
  const tone = STATUS_TONE[qa.status] ?? "text-muted-foreground border-border/50 bg-card/40";

  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-4 space-y-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">WebCodeM</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded border border-border/50 text-muted-foreground">
            {run.taskType}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded border border-border/50 text-muted-foreground">
            {run.mode === "REAL_WEBLLM" ? "WebLLM" : "规则模式"}
          </span>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded border ${tone}`}>QA {qa.status}</span>
      </div>

      <div className="text-foreground font-medium">{cardTitle}</div>

      <ul className="space-y-1 text-xs text-muted-foreground">
        {cardBullets.map((b, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-foreground/40">·</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>

      {qa.issues.length > 0 && (
        <div className="rounded-lg border border-border/40 bg-background/40 p-2 text-[11px] space-y-1">
          {qa.issues.slice(0, 3).map((i, idx) => (
            <div key={idx} className="text-muted-foreground">
              <span className="text-foreground/70">[{i.severity}]</span> {i.message}
            </div>
          ))}
        </div>
      )}

      <div className="text-[11px] text-muted-foreground">{modeNote}</div>

      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {actions.map((a, i) => (
            <button
              key={i}
              onClick={() => onAction?.(a)}
              className="text-xs px-3 py-1.5 rounded-full border border-border/60 text-foreground/80 hover:text-foreground hover:border-border transition-colors"
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
