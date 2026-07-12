import { useMemo } from "react";
import { buildFitMatrix, type UIFitContext } from "@/lib/multiClientUIFitEngine";
import { CLIENT_PROFILES } from "@/constants/clientProfiles";
import { DEVICE_PROFILES } from "@/constants/deviceProfiles";
import { getFitLevel } from "@/constants/uiFitFactors";

const TONE: Record<string, string> = {
  emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  cyan:    "bg-cyan-500/15 text-cyan-300 border-cyan-500/40",
  amber:   "bg-amber-500/15 text-amber-300 border-amber-500/40",
  orange:  "bg-orange-500/15 text-orange-300 border-orange-500/40",
  rose:    "bg-rose-500/15 text-rose-300 border-rose-500/40",
};

export function DeviceFitMatrix({ context }: { context?: UIFitContext }) {
  const cells = useMemo(() => buildFitMatrix(context), [context]);

  return (
    <div className="aether-card-elevated p-5">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Device × Role Fit Matrix
          </div>
          <div className="font-display text-lg gold-text">多端适配矩阵</div>
        </div>
        <div className="text-[10px] text-muted-foreground">Score · 密度 · 模块开放</div>
      </div>

      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-[11px] border-collapse min-w-[800px]">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="p-2 sticky left-0 bg-background/95">角色 / 设备</th>
              {DEVICE_PROFILES.map(d => (
                <th key={d.id} className="p-2 font-normal text-center">
                  <div>{d.name}</div>
                  <div className="text-[10px] text-muted-foreground/70">{d.nameEn}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CLIENT_PROFILES.map(c => (
              <tr key={c.id} className="border-t border-border/40">
                <td className="p-2 sticky left-0 bg-background/95">
                  <div className="font-medium text-foreground/90">{c.name}</div>
                  <div className="text-[10px] text-muted-foreground">{c.nameEn}</div>
                </td>
                {DEVICE_PROFILES.map(d => {
                  const cell = cells.find(x => x.clientId === c.id && x.deviceId === d.id)!;
                  const lvl = getFitLevel(cell.score);
                  return (
                    <td key={d.id} className="p-1.5 align-top">
                      <div className={`rounded border px-2 py-1.5 ${TONE[lvl.tone]}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-mono">{cell.score}</span>
                          <span className="text-[10px]">{lvl.cn}</span>
                        </div>
                        <div className="mt-1 text-[10px] text-foreground/80">
                          密度 {cell.density}
                        </div>
                        <div className="mt-0.5 text-[10px] text-foreground/70">
                          {cell.openFull60 ? "F60 ✓" : "F60 ✗"} · {cell.openAdvanced ? "Adv ✓" : "Adv ✗"} · {cell.openPromptForge ? "PF ✓" : "PF ✗"}
                        </div>
                        <div className="text-[10px] text-foreground/60">
                          {cell.showSafety ? "Safety ✓" : "—"} · {cell.showFeedback ? "Feedback ✓" : "—"}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
