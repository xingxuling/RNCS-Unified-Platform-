// src/game/FateGameLoop.tsx
import React, { useState, useEffect } from "react";
import { FateGameEngine } from "./FateGameEngine";
import { FateNodeCard } from "./components/FateNodeCard";
import { PlayerStats } from "./components/PlayerStats";
import { UniverseHUD } from "./components/UniverseHUD";
import { RefreshCcw } from "lucide-react";
import { WorldState } from "../seed-runtime/seedRuntime";
import { SEEDRuntime } from "../seed-runtime/seedRuntime";
import { createWorldFromPreset, UniversePreset } from "../seed-runtime/universeForge";

const defaultPreset: UniversePreset = {
  id: "fate-game",
  name: "Fate Simulator",
  aetherDensity: 0.6,
  structuralPressure: 0.4,
  entropyLevel: 0.3,
  mainEntityName: "杜浩麟 · 蓝天机",
  description: "命运模拟游戏",
};

interface FateGameLoopProps {
  initialWorld?: WorldState;
  initialRuntime?: SEEDRuntime;
}

export const FateGameLoop: React.FC<FateGameLoopProps> = ({
  initialWorld,
  initialRuntime,
}) => {
  const [worldState] = useState<WorldState>(
    initialWorld ?? createWorldFromPreset(defaultPreset)
  );
  const [runtime] = useState<SEEDRuntime>(
    initialRuntime ??
      new SEEDRuntime(createWorldFromPreset(defaultPreset), {
        mainlineOriginName: "杜浩麟",
      })
  );
  const [engine] = useState<FateGameEngine>(
    () => new FateGameEngine(worldState, runtime)
  );
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // 监听引擎更新事件
  useEffect(() => {
    const handleUpdate = () => {
      setUpdateTrigger((prev) => prev + 1);
    };
    window.addEventListener("engine-update", handleUpdate);
    return () => {
      window.removeEventListener("engine-update", handleUpdate);
    };
  }, []);

  const handleChoice = (index: number) => {
    engine.choose(index);
    setUpdateTrigger((prev) => prev + 1);
  };

  const handleReset = () => {
    const newWorld = createWorldFromPreset(defaultPreset);
    engine.reset(newWorld);
    setUpdateTrigger((prev) => prev + 1);
  };

  const currentEvent = engine.getCurrentEvent();
  const currentWorld = engine.getWorldState();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-cyan-300 mb-1">
              Fate Simulator
            </h1>
            <p className="text-sm text-slate-400">
              命运模拟器 · 文明引擎 · 可玩版本
            </p>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm text-slate-200"
          >
            <RefreshCcw className="w-4 h-4" />
            重置游戏
          </button>
        </div>

        {/* Main Game Area */}
        <div className="grid grid-cols-12 gap-4">
          {/* Left: Player Stats & Universe HUD */}
          <div className="col-span-3 space-y-4">
            <PlayerStats worldState={currentWorld} />
            <UniverseHUD worldState={currentWorld} />
          </div>

          {/* Center: Main Game Event */}
          <div className="col-span-6">
            <FateNodeCard
              event={currentEvent}
              onChoice={handleChoice}
            />
          </div>

          {/* Right: Event History */}
          <div className="col-span-3">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/90 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400 mb-3">
                事件历史
              </div>
              <div className="space-y-1 max-h-[500px] overflow-y-auto text-xs">
                {engine.getEventHistory().map((eventId, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg ${
                      idx === engine.getEventHistory().length - 1
                        ? "bg-cyan-500/20 border border-cyan-400/50"
                        : "bg-slate-800/50"
                    }`}
                  >
                    <div className="text-slate-300 font-mono text-[10px]">
                      #{idx + 1}
                    </div>
                    <div className="text-slate-400 text-[10px] truncate">
                      {eventId}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

