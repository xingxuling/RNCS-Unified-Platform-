import { useState, useSyncExternalStore } from "react";
import {
  REAL_WEBLLM_MODELS,
  REAL_WEBLLM_GROUP_LABELS,
  realWebLlmModelsByGroup,
  getRealWebLlmRuntimeState,
  subscribeRealWebLlmRuntime,
  setRealWebLlmRuntimePartial,
  loadRealWebLlmModel,
} from "@/lib/real-webllm/aetherRealWebLlmRuntime";

export function RealWebLlmModelSelector() {
  const s = useSyncExternalStore(subscribeRealWebLlmRuntime, getRealWebLlmRuntimeState, getRealWebLlmRuntimeState);
  const [customId, setCustomId] = useState("");
  const groups = realWebLlmModelsByGroup();
  const busy = s.engineStatus === "LOADING" || s.engineStatus === "GENERATING";

  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([group, models]) => (
        <div key={group} className="space-y-2">
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {REAL_WEBLLM_GROUP_LABELS[group] ?? group}
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {models.map((m) => {
              const active = s.selectedModelId === m.modelId;
              return (
                <button
                  key={m.modelId}
                  disabled={busy}
                  onClick={() => setRealWebLlmRuntimePartial({ selectedModelId: m.modelId })}
                  className={`aether-card p-3 text-left transition-colors ${active ? "border-amber-500/50 bg-amber-500/5" : "hover:border-border"}`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-sm">{m.chineseName}</div>
                    <div className="text-[10px] text-muted-foreground">{m.recommendedDevice}</div>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{m.displayName}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{m.useCases.join(" · ")}</div>
                  {m.warning && <div className="text-[10px] text-amber-400 mt-1">{m.warning}</div>}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="space-y-2">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">自定义模型 ID</div>
        <div className="flex gap-2">
          <input
            value={customId}
            onChange={(e) => setCustomId(e.target.value)}
            placeholder="例如 Phi-3.5-mini-instruct-q4f16_1-MLC"
            className="flex-1 text-xs bg-card border border-border/60 rounded-md px-2.5 py-1.5 outline-none focus:border-border"
          />
          <button
            disabled={!customId.trim() || busy}
            onClick={() => setRealWebLlmRuntimePartial({ selectedModelId: customId.trim() })}
            className="text-xs px-3 py-1.5 rounded-md border border-border/60 hover:bg-muted/40 disabled:opacity-40"
          >
            使用
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          disabled={!s.selectedModelId || busy}
          onClick={() => s.selectedModelId && loadRealWebLlmModel(s.selectedModelId)}
          className="text-xs px-3 py-1.5 rounded-md bg-foreground text-background disabled:opacity-40"
        >
          {s.engineStatus === "LOADING" ? "加载中…" : "加载模型"}
        </button>
        <div className="text-[10px] text-muted-foreground">
          首次加载模型可能需要较长时间，并占用较多内存和显存。
        </div>
      </div>
    </div>
  );
}
