// src/game/components/PlayerStats.tsx
import React from "react";
import { WorldState } from "../../seed-runtime/seedRuntime";

interface PlayerStatsProps {
  worldState: WorldState;
}

export const PlayerStats: React.FC<PlayerStatsProps> = ({ worldState }) => {
  const mainEntity = worldState.entities[0];
  const convergence = mainEntity?.fateVector?.convergenceScore ?? 0;
  const stability = mainEntity?.state?.structuralStability ?? 0;
  const health = mainEntity?.state?.health ?? 0;
  const energy = mainEntity?.state?.energy ?? 0;

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-950/90 p-4 space-y-3">
      <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
        角色状态
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">收敛度</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600 transition-all"
                style={{ width: `${convergence * 100}%` }}
              />
            </div>
            <span className="font-mono text-cyan-300 w-12 text-right">
              {(convergence * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400">结构稳定性</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all"
                style={{ width: `${stability * 100}%` }}
              />
            </div>
            <span className="font-mono text-purple-300 w-12 text-right">
              {(stability * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400">生命值</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
                style={{ width: `${health * 100}%` }}
              />
            </div>
            <span className="font-mono text-emerald-300 w-12 text-right">
              {(health * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400">能量</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all"
                style={{ width: `${energy * 100}%` }}
              />
            </div>
            <span className="font-mono text-yellow-300 w-12 text-right">
              {(energy * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {mainEntity?.identityProfile && (
        <div className="pt-2 border-t border-slate-800/50">
          <div className="text-xs text-slate-500">角色</div>
          <div className="text-sm text-slate-200 font-semibold">
            {mainEntity.identityProfile.name}
          </div>
        </div>
      )}
    </div>
  );
};

