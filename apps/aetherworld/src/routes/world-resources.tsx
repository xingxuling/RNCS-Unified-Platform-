import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useFounderState } from "@/hooks/useFounderState";
import { WorldResourcePanel } from "@/components/currency/WorldResourcePanel";
import { CurrencySafetyNote } from "@/components/currency/CurrencySafetyNote";
import { getResourceBalance, grantResource, suggestResourcesForSequence } from "@/lib/currency/worldResourceEngine";
import { WORLD_RESOURCES } from "@/constants/currency/worldResourceTypes";
import type { SubjectMode } from "@/lib/currency/rewardCalculationEngine";

export const Route = createFileRoute("/world-resources")({
  head: () => ({ meta: [{ title: "世界资源 · World Resources" }] }),
  component: WorldResourcesPage,
});

function WorldResourcesPage() {
  const { active } = useFounderState();
  const [mode, setMode] = useState<SubjectMode>("DEMO");
  const [seq, setSeq] = useState("");
  const [tick, setTick] = useState(0);
  useEffect(() => { if (active) setMode("FOUNDER"); }, [active]);

  const balance = getResourceBalance(mode);
  const suggested = seq ? suggestResourcesForSequence(seq) : [];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">世界资源 · World Resources</h1>
        <p className="text-sm text-muted-foreground">仅用于虚拟世界与虚拟生活。不可被解释为现实资产。</p>
      </header>
      <CurrencySafetyNote />

      <div className="border rounded-md p-3 bg-card flex flex-wrap gap-3 items-end text-xs">
        <label className="space-y-1">
          <span className="text-muted-foreground block">主体模式</span>
          <select value={mode} onChange={(e) => setMode(e.target.value as SubjectMode)} className="border rounded px-2 py-1 bg-background">
            <option value="DEMO">DEMO</option>
            <option value="REAL">REAL</option>
            {active && <option value="FOUNDER">FOUNDER</option>}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-muted-foreground block">数列种子（推荐资源）</span>
          <input value={seq} onChange={(e) => setSeq(e.target.value)} placeholder="例如 55555" maxLength={5} className="border rounded px-2 py-1 bg-background" />
        </label>
        {suggested.length > 0 && (
          <button
            onClick={() => { suggested.forEach((id) => grantResource(mode, id, 1)); setTick((t) => t + 1); }}
            className="text-xs px-3 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200"
          >
            +1 推荐资源（{suggested.join(", ")}）
          </button>
        )}
      </div>

      <div key={tick}>
        <WorldResourcePanel balance={balance} />
      </div>

      <div className="border rounded-md p-4 bg-card text-xs space-y-2">
        <h3 className="text-sm font-medium">资源说明</h3>
        <ul className="space-y-1">
          {WORLD_RESOURCES.map((r) => (
            <li key={r.id}><span className="font-medium">{r.name}</span>（数字 {r.relatedDigit}）— {r.description}；获得：{r.earnedBy.join(" / ")}；用于：{r.usedFor.join(" / ")}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
