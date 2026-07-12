// src/components/SeedControlCenter.tsx
// The Seed · 宇宙控制中心 - 主应用组件

import React, { useMemo, useState, useEffect, useRef } from "react";
import { UniverseForgeEditor } from "./UniverseForgeEditor";
import { createWorldFromPreset, UniversePreset } from "../seed-runtime/universeForge";
import { SEEDRuntime, WorldState } from "../seed-runtime/seedRuntime";

import { Globe, Play, Pause, RefreshCcw, Activity, Gamepad2, Terminal } from "lucide-react";
import { FateGameLoop } from "../game/FateGameLoop";
import { AGIShellCore } from "../agi-shell/agiShellCore";
import { AGIShellConsole } from "./AGIShellConsole";

const defaultPreset: UniversePreset = {
  id: "aetherion-core",
  name: "Aetherion · Core Lineage",
  aetherDensity: 0.7,
  structuralPressure: 0.45,
  entropyLevel: 0.25,
  mainEntityName: "杜浩麟 · 蓝天机",
  description: "主线起源宇宙。",
};

export const SeedControlCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"forge" | "runtime" | "demo" | "game" | "agi">("game");

  // 用一个独立的 worldState / runtime 来做演示
  const [worldState, setWorldState] = useState<WorldState>(() =>
    createWorldFromPreset(defaultPreset)
  );
  const [runtime] = useState<SEEDRuntime>(
    () =>
      new SEEDRuntime(createWorldFromPreset(defaultPreset), {
        mainlineOriginName: "杜浩麟",
      })
  );
  const [agiShell] = useState<AGIShellCore>(
    () => new AGIShellCore(runtime, defaultPreset)
  );
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [cycleLog, setCycleLog] = useState<
    { tick: number; timeIndex: number; convergence: number }[]
  >([]);
  const autoRunRef = useRef<NodeJS.Timeout | null>(null);

  // 计算一个大致的 globalConvergence 显示
  const globalConvergence = useMemo(() => {
    const tls = worldState.activeTimelines;
    if (!tls.length) return 0;
    const active = tls.filter(t => t.status === "ACTIVE");
    if (!active.length) return 0;
    const sum = active.reduce((acc, t) => acc + t.convergenceScore, 0);
    return sum / active.length;
  }, [worldState.activeTimelines]);

  const doOneStep = () => {
    const result = runtime.executeCycle();
    setWorldState(result.worldState);
    setCycleLog((prev) => [
      ...prev,
      {
        tick: prev.length,
        timeIndex: result.worldState.timeIndex,
        convergence:
          result.worldState.activeTimelines.length > 0
            ? result.worldState.activeTimelines
                .filter(t => t.status === "ACTIVE")
                .reduce((acc, t) => acc + t.convergenceScore, 0) /
              result.worldState.activeTimelines.filter(t => t.status === "ACTIVE").length
            : 0,
      },
    ]);
  };

  const handleReset = () => {
    const ws = createWorldFromPreset(defaultPreset);
    runtime.loadWorldState(ws);
    setWorldState(ws);
    setCycleLog([]);
    setIsAutoRunning(false);
    if (autoRunRef.current) {
      clearInterval(autoRunRef.current);
      autoRunRef.current = null;
    }
  };

  const handleAutoRun = async () => {
    if (isAutoRunning) {
      setIsAutoRunning(false);
      if (autoRunRef.current) {
        clearInterval(autoRunRef.current);
        autoRunRef.current = null;
      }
      return;
    }

    setIsAutoRunning(true);
    let count = 0;
    const maxCycles = 20;

    autoRunRef.current = setInterval(() => {
      if (count >= maxCycles) {
        setIsAutoRunning(false);
        if (autoRunRef.current) {
          clearInterval(autoRunRef.current);
          autoRunRef.current = null;
        }
        return;
      }
      doOneStep();
      count++;
    }, 120);
  };

  useEffect(() => {
    return () => {
      if (autoRunRef.current) {
        clearInterval(autoRunRef.current);
      }
    };
  }, []);

  // 界面布局
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="border-b border-slate-800/80 px-6 py-3 flex items-center justify-between bg-slate-950/80 backdrop-blur">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-cyan-400" />
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
              THE SEED · AETHERION
            </div>
            <div className="text-sm font-semibold text-slate-100">
              Civilization Engine · Control Center
            </div>
          </div>
        </div>
        <div className="flex gap-2 text-[11px]">
          <span className="px-2 py-1 rounded-full bg-slate-900/80 border border-slate-700">
            Time Index:{" "}
            <span className="font-mono">{worldState.timeIndex}</span>
          </span>
          <span className="px-2 py-1 rounded-full bg-slate-900/80 border border-slate-700">
            Global Convergence:{" "}
            <span className="font-mono">
              {globalConvergence.toFixed(3)}
            </span>
          </span>
        </div>
      </header>

      <main className="px-6 py-4">
        {/* Tabs */}
        <div className="flex gap-2 mb-4 text-xs">
          <TabButton
            active={activeTab === "game"}
            onClick={() => setActiveTab("game")}
          >
            <Gamepad2 className="w-3 h-3 mr-1" />
            Fate Simulator
          </TabButton>
          <TabButton
            active={activeTab === "forge"}
            onClick={() => setActiveTab("forge")}
          >
            Universe Forge
          </TabButton>
          <TabButton
            active={activeTab === "runtime"}
            onClick={() => setActiveTab("runtime")}
          >
            Runtime Control
          </TabButton>
          <TabButton
            active={activeTab === "demo"}
            onClick={() => setActiveTab("demo")}
          >
            World Simulation Demo
          </TabButton>
          <TabButton
            active={activeTab === "agi"}
            onClick={() => setActiveTab("agi")}
          >
            <Terminal className="w-3 h-3 mr-1" />
            AGI Shell
          </TabButton>
        </div>

        {/* 内容区域 */}
        <div className="border border-slate-800/80 rounded-2xl p-4 bg-slate-950/70 min-h-[480px]">
          {activeTab === "game" && (
            <FateGameLoop />
          )}

          {activeTab === "forge" && (
            <UniverseForgeEditor />
          )}

          {activeTab === "runtime" && (
            <div className="grid grid-cols-12 gap-4 h-full">
              {/* 左：控制面板 */}
              <div className="col-span-4 flex flex-col gap-3">
                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/90 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-xs uppercase tracking-wide text-slate-400">
                        Runtime Control
                      </div>
                      <div className="text-[11px] text-slate-300">
                        控制 SEED-RT 循环运行
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={doOneStep}
                      className="flex-1 flex items-center justify-center gap-1 text-xs py-2 rounded-xl bg-emerald-500/90 hover:bg-emerald-400 text-slate-950"
                    >
                      <Play className="w-3 h-3" />
                      Step ×1
                    </button>
                    <button
                      onClick={handleAutoRun}
                      className="flex-1 flex items-center justify-center gap-1 text-xs py-2 rounded-xl bg-cyan-500/90 hover:bg-cyan-400 text-slate-950"
                    >
                      {isAutoRunning ? (
                        <>
                          <Pause className="w-3 h-3" />
                          Stop Auto
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3" />
                          Auto ×20
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleReset}
                      className="flex-0 flex items-center justify-center gap-1 text-xs px-2 rounded-xl bg-slate-800 hover:bg-slate-700"
                    >
                      <RefreshCcw className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Time Index</span>
                      <span className="font-mono">{worldState.timeIndex}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Timelines</span>
                      <span className="font-mono">
                        {worldState.activeTimelines.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Global Convergence</span>
                      <span className="font-mono">
                        {globalConvergence.toFixed(3)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 简单的收束度日志 */}
                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/90 p-3 flex-1">
                  <div className="text-[10px] text-slate-400 mb-2">
                    Convergence Log
                  </div>
                  <div className="space-y-1 max-h-[260px] overflow-y-auto text-[10px] font-mono">
                    {cycleLog.length === 0 && (
                      <div className="text-slate-600">
                        No cycles yet. Click "Step ×1".
                      </div>
                    )}
                    {cycleLog.map((c) => (
                      <div
                        key={c.tick}
                        className="flex justify-between gap-2 text-slate-300"
                      >
                        <span>#{c.tick}</span>
                        <span>t={c.timeIndex}</span>
                        <span>cv={c.convergence.toFixed(3)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 右：当前 WorldState 重要状态 */}
              <div className="col-span-8 flex flex-col gap-3">
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <InfoCard
                    title="Global Parameters"
                    items={[
                      [
                        "Aether Density",
                        worldState.globalParameters.aetherDensity.toFixed(3),
                      ],
                      [
                        "Structural Pressure",
                        worldState.globalParameters.structuralPressure.toFixed(3),
                      ],
                      [
                        "Entropy Level",
                        worldState.globalParameters.entropyLevel.toFixed(3),
                      ],
                    ]}
                  />
                  <InfoCard
                    title="Main Entity"
                    items={[
                      [
                        "Name",
                        worldState.entities[0]?.identityProfile?.name ?? "N/A",
                      ],
                      [
                        "Conv.",
                        (worldState.entities[0]?.fateVector?.convergenceScore ?? 0).toFixed(3),
                      ],
                      [
                        "Struct. Stable",
                        (worldState.entities[0]?.state?.structuralStability ?? 0).toFixed(3),
                      ],
                    ]}
                  />
                  <InfoCard
                    title="Timelines"
                    items={[
                      [
                        "Active",
                        String(
                          worldState.activeTimelines.filter((t) => t.status === "ACTIVE")
                            .length
                        ),
                      ],
                      [
                        "Collapsed",
                        String(
                          worldState.activeTimelines.filter(
                            (t) => t.status === "COLLAPSED"
                          ).length
                        ),
                      ],
                      ["Total", String(worldState.activeTimelines.length)],
                    ]}
                  />
                </div>

                <div className="flex-1 rounded-2xl border border-slate-800/80 bg-slate-950/90 p-3 text-[11px] overflow-y-auto">
                  <div className="text-slate-400 mb-1">
                    Active Timelines & FateNodes
                  </div>
                  <pre className="whitespace-pre-wrap text-[10px] text-slate-300/90">
                    {JSON.stringify(
                      {
                        activeTimelines: worldState.activeTimelines,
                        fateNodes: worldState.fateGraph.nodes,
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === "demo" && (
            <WorldSimulationDemo
              worldState={worldState}
              onRunDemo={() => {
                // Demo: 一键跑 20 次循环，更新 worldState
                for (let i = 0; i < 20; i++) {
                  const result = runtime.executeCycle();
                  setWorldState(result.worldState);
                }
              }}
            />
          )}

          {activeTab === "agi" && (
            <AGIShellConsole
              shell={agiShell}
              onWorldStateUpdate={setWorldState}
            />
          )}
        </div>
      </main>
    </div>
  );
};

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-xl text-xs border ${
      active
        ? "border-cyan-400/80 bg-cyan-500/10 text-cyan-100"
        : "border-slate-800 hover:border-slate-600 hover:bg-slate-900 text-slate-300"
    }`}
  >
    {children}
  </button>
);

// 共用 InfoCard
const InfoCard: React.FC<{ title: string; items: [string, string][] }> = ({
  title,
  items,
}) => (
  <div className="rounded-xl border border-slate-800/80 bg-slate-950/90 p-2">
    <div className="text-[10px] text-slate-400 mb-1">{title}</div>
    <div className="space-y-1">
      {items.map(([k, v]) => (
        <div
          key={k}
          className="flex justify-between gap-2 text-[10px] text-slate-300"
        >
          <span className="text-slate-500">{k}</span>
          <span className="font-mono">{v}</span>
        </div>
      ))}
    </div>
  </div>
);

// =============== World Simulation Demo（5️⃣：给教授看的） ===============

interface DemoProps {
  worldState: WorldState;
  onRunDemo: () => void;
}

const WorldSimulationDemo: React.FC<DemoProps> = ({ worldState, onRunDemo }) => {
  const tl = worldState.activeTimelines[0];

  const convergence =
    worldState.activeTimelines.length > 0
      ? worldState.activeTimelines
          .filter(t => t.status === "ACTIVE")
          .reduce((acc, t) => acc + t.convergenceScore, 0) /
        worldState.activeTimelines.filter(t => t.status === "ACTIVE").length
      : 0;

  return (
    <div className="grid grid-cols-12 gap-4 h-full">
      {/* 左：说明 + 按钮（专门给老师讲解用） */}
      <div className="col-span-4 rounded-2xl border border-slate-800/80 bg-slate-950/90 p-4 text-[11px]">
        <div className="text-xs font-semibold text-slate-100 mb-1">
          World Simulation Demo
        </div>
        <div className="text-slate-400 mb-3">
          这一页是专门给教授 / 评审看的：展示「文明引擎」如何用
          <span className="text-cyan-300"> 结构化方式 </span>
          模拟时间线与命运收束。
        </div>
        <ol className="list-decimal list-inside space-y-1 text-slate-300 mb-3">
          <li>点击 "Run Demo ×20"</li>
          <li>右边会显示时间线推进、命运节点变化</li>
          <li>下方展示收束度如何变化</li>
        </ol>

        <button
          onClick={onRunDemo}
          className="mt-1 w-full text-xs py-2 rounded-xl bg-cyan-500/90 hover:bg-cyan-400 text-slate-950 font-semibold flex items-center justify-center gap-1"
        >
          <Play className="w-3 h-3" />
          Run Demo ×20
        </button>

        <div className="mt-4 space-y-1">
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-500">Time Index</span>
            <span className="font-mono">{worldState.timeIndex}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-500">Global Convergence</span>
            <span className="font-mono">{convergence.toFixed(3)}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-500">Timelines</span>
            <span className="font-mono">
              {worldState.activeTimelines.length}
            </span>
          </div>
        </div>

        <div className="mt-4 text-[10px] text-slate-500 border-t border-slate-800/80 pt-2">
          你可以直接跟老师说：这一套是我自研的「文明运行时
          Runtime + 宇宙生成引擎」，不是普通前端项目。
        </div>
      </div>

      {/* 右：数据可视化 / 结构展示 */}
      <div className="col-span-8 flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-3 text-xs">
          <InfoCard
            title="Mainline Timeline"
            items={[
              ["Timeline ID", tl?.id ?? "N/A"],
              ["Current Node", tl?.currentNodeId ?? "N/A"],
              ["Path Length", String(tl?.pathHistory.length ?? 0)],
            ]}
          />
          <InfoCard
            title="Main Entity"
            items={[
              [
                "Name",
                worldState.entities[0]?.identityProfile?.name ?? "N/A",
              ],
              [
                "Conv.",
                (worldState.entities[0]?.fateVector?.convergenceScore ?? 0).toFixed(
                  3
                ),
              ],
              [
                "Struct. Stable",
                (worldState.entities[0]?.state?.structuralStability ?? 0).toFixed(
                  3
                ),
              ],
            ]}
          />
          <InfoCard
            title="Fate Graph Overview"
            items={[
              ["Nodes", String(worldState.fateGraph.nodes.length)],
              ["Arcs", String(worldState.fateGraph.arcs.length)],
              [
                "First Node",
                worldState.fateGraph.nodes[0]?.description ?? "N/A",
              ],
            ]}
          />
        </div>

        <div className="flex-1 rounded-2xl border border-slate-800/80 bg-slate-950/90 p-3 text-[11px] overflow-y-auto">
          <div className="text-slate-400 mb-1">
            Timeline Path History (Mainline)
          </div>
          <pre className="whitespace-pre-wrap text-[10px] text-slate-300/90 mb-3">
            {JSON.stringify(tl?.pathHistory ?? [], null, 2)}
          </pre>

          <div className="text-slate-400 mb-1">Fate Nodes</div>
          <pre className="whitespace-pre-wrap text-[10px] text-slate-300/90">
            {JSON.stringify(worldState.fateGraph.nodes, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

