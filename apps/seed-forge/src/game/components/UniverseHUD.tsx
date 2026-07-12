// src/game/components/UniverseHUD.tsx
import React from "react";
import { WorldState } from "../../seed-runtime/seedRuntime";

interface UniverseHUDProps {
  worldState: WorldState;
}

export const UniverseHUD: React.FC<UniverseHUDProps> = ({ worldState }) => {
  const { aetherDensity, structuralPressure, entropyLevel } = worldState.globalParameters;
  const activeTimelines = worldState.activeTimelines.filter(t => t.status === "ACTIVE").length;
  const totalTimelines = worldState.activeTimelines.length;

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-950/90 p-4 space-y-3">
      <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
        宇宙状态
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">以太密度</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
                style={{ width: `${aetherDensity * 100}%` }}
              />
            </div>
            <span className="font-mono text-blue-300 w-12 text-right">
              {(aetherDensity * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400">结构压力</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all"
                style={{ width: `${structuralPressure * 100}%` }}
              />
            </div>
            <span className="font-mono text-orange-300 w-12 text-right">
              {(structuralPressure * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400">熵水平</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-400 to-red-600 transition-all"
                style={{ width: `${entropyLevel * 100}%` }}
              />
            </div>
            <span className="font-mono text-red-300 w-12 text-right">
              {(entropyLevel * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800/50 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">时间索引</span>
          <span className="font-mono text-slate-300">{worldState.timeIndex}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">活跃时间线</span>
          <span className="font-mono text-slate-300">
            {activeTimelines} / {totalTimelines}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">命运节点</span>
          <span className="font-mono text-slate-300">
            {worldState.fateGraph.nodes.length}
          </span>
        </div>
      </div>
    </div>
  );
};

