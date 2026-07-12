import { useState } from "react";
import type { WorldSimulationResult } from "@/lib/sequence-world/simulation/worldSimulationCore";
import { exportRuntime } from "@/lib/sequence-world/simulation/worldRuntimeExportEngine";
import { WORLD_RUNTIME_EXPORT_TARGETS, type WorldRuntimeExportTargetId } from "@/constants/sequence-world/simulation/worldRuntimeExportTargets";

export function WorldRuntimeExportPanel({ sim, isFull60 }: { sim: WorldSimulationResult; isFull60?: boolean }) {
  const [target, setTarget] = useState<WorldRuntimeExportTargetId>("GENERIC_JSON");
  const [out, setOut] = useState<{ ext: string; content: string } | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleExport = () => {
    if (isFull60 && !confirmed) {
      alert("Full60 世界：请先勾选确认隐私边界");
      return;
    }
    setOut(exportRuntime(sim, target, { isFull60, subjectMode: isFull60 ? "FULL_60" : "DEMO" }));
  };

  return (
    <div className="aether-card p-4 space-y-3">
      <h3 className="font-display gold-text">运行时导出</h3>
      <div className="flex gap-2 flex-wrap items-center">
        <select value={target} onChange={e => setTarget(e.target.value as WorldRuntimeExportTargetId)}
          className="bg-background border border-border rounded px-2 py-1 text-xs">
          {WORLD_RUNTIME_EXPORT_TARGETS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <button onClick={handleExport} className="px-3 py-1 text-xs rounded bg-primary text-primary-foreground">导出</button>
        {isFull60 && (
          <label className="text-xs text-amber-300 flex items-center gap-1">
            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />
            我已确认 Full60 隐私边界
          </label>
        )}
      </div>
      {out && (
        <pre className="text-xs bg-background border border-border rounded p-2 max-h-64 overflow-auto">{out.content}</pre>
      )}
    </div>
  );
}
