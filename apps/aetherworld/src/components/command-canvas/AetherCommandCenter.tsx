import { useState } from "react";
import { runCommandCanvas } from "@/lib/command-canvas/aetherCommandCanvasRuntime";
import { COMMAND_CANVAS_EXAMPLES } from "@/lib/command-canvas/commandCanvasExamplesRegistry";
import type { CommandCanvasRunResult } from "@/lib/command-canvas/aetherCommandCanvasRuntime";

interface Props { onResult?: (r: CommandCanvasRunResult) => void; }

export function AetherCommandCenter({ onResult }: Props) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<CommandCanvasRunResult | null>(null);

  const run = () => {
    if (!value.trim()) return;
    const r = runCommandCanvas(value.trim());
    setResult(r);
    onResult?.(r);
  };

  return (
    <div className="rounded-lg border border-border/50 bg-card/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">指挥中心 · Command Center</h2>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Sequence AI 路由</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="说出你的目标：做一个 App、修复代码、生成歌曲、推进世界..."
        className="w-full min-h-[88px] resize-y rounded-md border border-border/40 bg-background/60 p-3 text-sm outline-none focus:border-primary/60"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={run}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          运行命令
        </button>
        <span className="text-xs text-muted-foreground">Ctrl/Cmd + Enter</span>
      </div>

      <div className="flex flex-wrap gap-1.5 pt-2">
        {COMMAND_CANVAS_EXAMPLES.map((ex) => (
          <button
            key={ex.id}
            onClick={() => setValue(ex.command)}
            className="rounded-full border border-border/40 bg-background/40 px-2.5 py-1 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
            {ex.command}
          </button>
        ))}
      </div>

      {result && (
        <div className="mt-3 rounded-md border border-border/40 bg-background/40 p-3 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">路由结果</span>
            <span className={
              result.qa.status === "BLOCK" ? "text-red-400" :
              result.qa.status === "WARN" ? "text-amber-400" : "text-emerald-400"
            }>QA: {result.qa.status}</span>
          </div>
          <div className="text-muted-foreground">意图：{result.command.intentType}</div>
          <div className="text-muted-foreground">运行时：{result.command.targetRuntime}</div>
          {result.command.selectedCapabilityIds.length > 0 && (
            <div className="text-muted-foreground">能力：{result.command.selectedCapabilityIds.join(", ")}</div>
          )}
          <div className="text-muted-foreground">下一步：{result.command.nextActions.join(" → ")}</div>
          {result.createdObjectId && <div className="text-muted-foreground">对象：{result.createdObjectId}</div>}
          {result.runId && <div className="text-muted-foreground">Run：{result.runId}</div>}
          {result.qa.blockedReasons.length > 0 && (
            <div className="text-red-400">阻断：{result.qa.blockedReasons.join("；")}</div>
          )}
        </div>
      )}
    </div>
  );
}
