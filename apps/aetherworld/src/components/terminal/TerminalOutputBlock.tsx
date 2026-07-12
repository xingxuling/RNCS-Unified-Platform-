import { useState } from "react";
import type { TerminalOutput } from "@/constants/terminal/terminalOutputTypes";
import { formatOutputAsMarkdown, formatOutputForCopy } from "@/lib/terminal/terminalOutputFormatter";

const TYPE_STYLES: Record<TerminalOutput["type"], string> = {
  TEXT:         "border-amber-500/20 text-amber-100",
  STRUCTURED:   "border-blue-500/30 text-blue-100",
  JSON:         "border-blue-500/30 text-blue-100",
  MARKDOWN:     "border-amber-500/20 text-amber-100",
  TRACE:        "border-purple-500/30 text-purple-100",
  TABLE:        "border-blue-500/30 text-blue-100",
  ERROR:        "border-red-500/50 text-red-200",
  WARNING:      "border-yellow-500/40 text-yellow-100",
  SUCCESS:      "border-emerald-500/40 text-emerald-100",
  EXPORT_READY: "border-amber-500/40 text-amber-100",
};

interface Props {
  output: TerminalOutput;
  onCopy?: () => void;
  onExport?: () => void;
  onSendToPromptForge?: () => void;
}

export function TerminalOutputBlock({ output, onCopy, onExport, onSendToPromptForge }: Props) {
  const [showTrace, setShowTrace] = useState(false);

  function copy() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(formatOutputForCopy(output)).catch(() => {});
    }
    onCopy?.();
  }

  return (
    <div className={`border ${TYPE_STYLES[output.type]} bg-black/40 rounded-md p-3 font-mono text-xs`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5">{output.type}</span>
          {output.title && <span className="text-sm font-medium">{output.title}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copy} className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10">Copy</button>
          {onExport && <button onClick={onExport} className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10">Export</button>}
          {onSendToPromptForge && <button onClick={onSendToPromptForge} className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10">→ Prompt Forge</button>}
        </div>
      </div>
      <pre className="whitespace-pre-wrap break-words leading-relaxed">{formatOutputAsMarkdown(output)}</pre>

      {output.trace && (
        <div className="mt-2 border-t border-white/10 pt-2">
          <button onClick={() => setShowTrace((v) => !v)} className="text-[10px] text-purple-300 hover:underline">
            {showTrace ? "▾" : "▸"} trace
          </button>
          {showTrace && (
            <pre className="mt-1 text-[10px] text-purple-200/80 whitespace-pre-wrap break-words">
              {JSON.stringify(output.trace, null, 2)}
            </pre>
          )}
        </div>
      )}

      {output.quickActions && output.quickActions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {output.quickActions.map((qa) => (
            <span key={qa} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-200">{qa}</span>
          ))}
        </div>
      )}

      <div className="mt-1 text-[10px] text-muted-foreground/60">{new Date(output.createdAt).toLocaleTimeString()}</div>
    </div>
  );
}
