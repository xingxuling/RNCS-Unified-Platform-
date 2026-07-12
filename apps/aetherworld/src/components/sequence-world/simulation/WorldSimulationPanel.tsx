import { useState } from "react";
import { startSimulation, buildDemoInput, type WorldSimulationResult, type WorldSimulationInput } from "@/lib/sequence-world/simulation/worldSimulationCore";
import { rollbackToSnapshot } from "@/lib/sequence-world/simulation/worldRollbackEngine";
import { runWorldSimSafetyCheck } from "@/lib/sequence-world/simulation/worldSimulationSafetyGuard";
import { WORLD_SIMULATION_MODES, MAX_TICKS_PER_RUN, type WorldSimulationModeId } from "@/constants/sequence-world/simulation/worldSimulationModes";
import { WorldSimulationSafetyNote } from "./WorldSimulationSafetyNote";
import { WorldStateMachineCard } from "./WorldStateMachineCard";
import { WorldTimePanel } from "./WorldTimePanel";
import { WorldTickConsole } from "./WorldTickConsole";
import { EventQueuePanel } from "./EventQueuePanel";
import { NpcMemoryPanel } from "./NpcMemoryPanel";
import { CausalChainGraph } from "./CausalChainGraph";
import { ZoneEcologyMap } from "./ZoneEcologyMap";
import { WorldResourceFlowPanel } from "./WorldResourceFlowPanel";
import { WorldSnapshotPanel } from "./WorldSnapshotPanel";
import { WorldRuntimeExportPanel } from "./WorldRuntimeExportPanel";
import { MultiSubjectSimulatorPanel } from "./MultiSubjectSimulatorPanel";

const PRESETS = [
  { id: "p1", label: "用 55555 推进世界一次",  digits: "55555", mode: "DEMO" as WorldSimulationModeId, ticks: 1 },
  { id: "p2", label: "运行 BLOCK 49..60 再创世链", digits: "11111,22222,33333,55555,66666", mode: "CREATOR_WORLD" as WorldSimulationModeId, ticks: 12 },
  { id: "p3", label: "生成一个 NPC 记忆变化", digits: "22222", mode: "PERSONAL_WORLD" as WorldSimulationModeId, ticks: 3 },
  { id: "p4", label: "生成一个世界因果链", digits: "55555,66666,99999", mode: "CREATOR_WORLD" as WorldSimulationModeId, ticks: 5 },
  { id: "p5", label: "创建世界快照", digits: "12345", mode: "DEMO" as WorldSimulationModeId, ticks: 2 },
  { id: "p6", label: "从快照回滚 (生成后到「世界快照」点击)", digits: "11111", mode: "DEMO" as WorldSimulationModeId, ticks: 2 },
  { id: "p7", label: "导出 Godot Runtime JSON", digits: "44444,55555", mode: "GAME_WORLD" as WorldSimulationModeId, ticks: 4 },
  { id: "p8", label: "把世界模拟结果转成剧情大纲", digits: "33333,55555,66666", mode: "CREATOR_WORLD" as WorldSimulationModeId, ticks: 4 },
];

export function WorldSimulationPanel({ founder, full60 }: { founder?: boolean; full60?: boolean }) {
  const [sim, setSim] = useState<WorldSimulationResult | null>(null);
  const [digits, setDigits] = useState("55555");
  const [mode, setMode] = useState<WorldSimulationModeId>("DEMO");
  const [ticks, setTicks] = useState(3);
  const [worldName, setWorldName] = useState("我的模拟世界");

  const start = () => {
    const base = buildDemoInput();
    const rows = digits.split(/[,\s]+/).filter(Boolean);
    const freq: Record<string, number> = {};
    rows.forEach(r => r.split("").forEach(d => { freq[d] = (freq[d] ?? 0) + 1; }));
    const dom = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
    const input: WorldSimulationInput = {
      ...base,
      worldId: `world-${Date.now().toString(36)}`,
      worldName,
      sourceSequenceMode: full60 ? "FULL_60" : "DEMO",
      simulationMode: mode,
      tickCount: ticks,
      sequenceCoreProfile: {
        ...base.sequenceCoreProfile,
        digitFrequency: freq,
        dominantDigits: dom.length ? dom : ["5"],
      },
    };
    setSim(startSimulation(input));
  };

  const applyPreset = (p: typeof PRESETS[number]) => {
    setDigits(p.digits); setMode(p.mode); setTicks(p.ticks);
  };

  const handleRollback = (id: string) => {
    const r = rollbackToSnapshot(id, { isFull60: full60, isFounder: founder });
    if (!r.ok) { alert(r.warnings.join("\n")); return; }
    if (!sim || !r.snapshot) return;
    // 简化：把当前 sim 的 worldState.summary 与 tick 改回到快照
    setSim({
      ...sim,
      currentTick: r.snapshot.tick,
      worldState: { ...sim.worldState, tick: r.snapshot.tick, phase: r.snapshot.phase as any, summary: `已回滚至 ${r.snapshot.worldStateSummary}` },
      warnings: r.warnings,
    });
  };

  const safety = sim ? runWorldSimSafetyCheck({
    text: sim.worldState.summary, isFull60: full60,
    hasPrivacyNote: full60, tickCount: sim.worldState.tick,
    tickCap: MAX_TICKS_PER_RUN[sim.simulationMode], hasMetadata: true,
  }) : null;

  return (
    <div className="space-y-4">
      <header className="aether-card p-4">
        <h1 className="font-display text-2xl gold-text">数列驱动世界模拟内核</h1>
        <p className="text-xs text-muted-foreground">Aether Sequence World Engine v0.2 · Sequence → World Simulation</p>
      </header>

      <WorldSimulationSafetyNote isFull60={full60} />

      <div className="aether-card p-4 space-y-3">
        <h2 className="font-display gold-text">输入</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <label className="space-y-1"><span className="text-muted-foreground">世界名称</span>
            <input value={worldName} onChange={e => setWorldName(e.target.value)} className="w-full bg-background border border-border rounded px-2 py-1" />
          </label>
          <label className="space-y-1"><span className="text-muted-foreground">数列（多行用逗号或空格分隔）</span>
            <input value={digits} onChange={e => setDigits(e.target.value)} className="w-full bg-background border border-border rounded px-2 py-1 font-mono" />
          </label>
          <label className="space-y-1"><span className="text-muted-foreground">模拟模式</span>
            <select value={mode} onChange={e => setMode(e.target.value as WorldSimulationModeId)} className="w-full bg-background border border-border rounded px-2 py-1">
              {WORLD_SIMULATION_MODES.map(m => <option key={m.id} value={m.id}>{m.label}（上限 {MAX_TICKS_PER_RUN[m.id]} tick）</option>)}
            </select>
          </label>
          <label className="space-y-1"><span className="text-muted-foreground">tick 数量（≤ {MAX_TICKS_PER_RUN[mode]}）</span>
            <input type="number" min={0} max={MAX_TICKS_PER_RUN[mode]} value={ticks} onChange={e => setTicks(Number(e.target.value))} className="w-full bg-background border border-border rounded px-2 py-1" />
          </label>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={start} className="px-3 py-1 text-xs rounded bg-primary text-primary-foreground">开始模拟</button>
        </div>
        <div className="pt-2 border-t border-border/40 space-y-1">
          <div className="text-xs text-muted-foreground">预置示例：</div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <button key={p.id} onClick={() => applyPreset(p)} className="text-xs px-2 py-1 rounded border border-border hover:bg-muted/30">{p.label}</button>
            ))}
          </div>
        </div>
      </div>

      {sim && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <WorldStateMachineCard state={sim.worldState} />
            <WorldTimePanel time={sim.time} />
          </div>
          <WorldTickConsole sim={sim} onUpdate={setSim} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EventQueuePanel events={sim.activeEvents} />
            <CausalChainGraph chain={sim.causalChain} />
            <ZoneEcologyMap zones={sim.activeZones} />
            <NpcMemoryPanel npcs={sim.activeNpcs} memory={sim.npcMemory} />
            <WorldResourceFlowPanel flow={sim.resourceFlow} />
            <MultiSubjectSimulatorPanel dominantDigits={sim.worldState.activeDigits} />
          </div>
          <WorldSnapshotPanel snapshots={sim.snapshots} onRollback={handleRollback} />
          <WorldRuntimeExportPanel sim={sim} isFull60={full60} />

          {founder && (
            <details className="aether-card p-4">
              <summary className="cursor-pointer text-xs text-muted-foreground">Founder Trace（完整 JSON）</summary>
              <pre className="text-xs mt-2 max-h-96 overflow-auto">{JSON.stringify(sim, null, 2)}</pre>
            </details>
          )}

          {safety && safety.violations.length > 0 && (
            <div className="aether-card border-amber-500/40 p-3 text-xs text-amber-200 space-y-1">
              <div className="font-medium text-amber-300">安全检查</div>
              {safety.violations.map((v, i) => <p key={i}>· [{v.severity}] {v.message}</p>)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
