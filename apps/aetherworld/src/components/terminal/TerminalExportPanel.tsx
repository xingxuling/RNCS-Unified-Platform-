import { useState } from "react";
import type { TerminalOutput } from "@/constants/terminal/terminalOutputTypes";
import { exportHistoryArtifact, exportLastOutput, triggerBrowserDownload } from "@/lib/terminal/terminalExportEngine";

interface Props {
  lastOutput: TerminalOutput | null;
  subjectMode: string;
  full60Active: boolean;
}

export function TerminalExportPanel({ lastOutput, subjectMode, full60Active }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [pendingFormat, setPendingFormat] = useState<"markdown" | "json" | null>(null);

  function handleExportLast(format: "markdown" | "json") {
    if (!lastOutput) return;
    if (full60Active && !confirming) {
      setPendingFormat(format);
      setConfirming(true);
      return;
    }
    const artifact = exportLastOutput(lastOutput, format, { subjectMode, full60Active });
    triggerBrowserDownload(artifact);
    setConfirming(false);
    setPendingFormat(null);
  }

  function handleExportHistory(format: "markdown" | "json") {
    if (full60Active && !confirming) {
      setPendingFormat(format);
      setConfirming(true);
      return;
    }
    const artifact = exportHistoryArtifact(format, { subjectMode, full60Active });
    triggerBrowserDownload(artifact);
    setConfirming(false);
    setPendingFormat(null);
  }

  return (
    <div className="border border-amber-500/30 rounded-md p-3 space-y-2 bg-black/30">
      <h3 className="text-xs font-medium text-amber-300">导出</h3>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => handleExportLast("markdown")} disabled={!lastOutput} className="text-[11px] px-2 py-1 rounded bg-amber-500/10 text-amber-100 hover:bg-amber-500/20 disabled:opacity-40">
          导出最近输出 · MD
        </button>
        <button onClick={() => handleExportLast("json")} disabled={!lastOutput} className="text-[11px] px-2 py-1 rounded bg-amber-500/10 text-amber-100 hover:bg-amber-500/20 disabled:opacity-40">
          导出最近输出 · JSON
        </button>
        <button onClick={() => handleExportHistory("markdown")} className="text-[11px] px-2 py-1 rounded bg-amber-500/10 text-amber-100 hover:bg-amber-500/20">
          导出历史 · MD
        </button>
        <button onClick={() => handleExportHistory("json")} className="text-[11px] px-2 py-1 rounded bg-amber-500/10 text-amber-100 hover:bg-amber-500/20">
          导出历史 · JSON
        </button>
      </div>
      {confirming && (
        <div className="border border-yellow-500/40 rounded p-2 text-[11px] text-yellow-100 bg-yellow-900/10">
          检测到 Full60 / 私有数据。确认要导出吗？
          <div className="mt-1 flex gap-2">
            <button
              onClick={() => {
                if (!pendingFormat) return;
                if (lastOutput) {
                  const a = exportLastOutput(lastOutput, pendingFormat, { subjectMode, full60Active });
                  triggerBrowserDownload(a);
                }
                setConfirming(false); setPendingFormat(null);
              }}
              className="px-2 py-0.5 rounded bg-yellow-500/30 hover:bg-yellow-500/50"
            >
              确认导出
            </button>
            <button onClick={() => { setConfirming(false); setPendingFormat(null); }} className="px-2 py-0.5 rounded bg-white/5">取消</button>
          </div>
        </div>
      )}
      <p className="text-[10px] text-muted-foreground">导出资产将附带 metadata（exportedAt / subjectMode / privacy / safetyNotes）。</p>
    </div>
  );
}
