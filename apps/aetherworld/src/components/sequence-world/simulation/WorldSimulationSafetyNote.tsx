import { WORLD_SIM_DISCLAIMERS } from "@/constants/sequence-world/simulation/worldSimulationSafetyRules";

export function WorldSimulationSafetyNote({ isFull60 }: { isFull60?: boolean }) {
  return (
    <div className="aether-card border-amber-500/40 p-3 text-xs text-amber-200 space-y-1">
      <div className="font-medium text-amber-300">安全边界 · World Simulation</div>
      {WORLD_SIM_DISCLAIMERS.map((d, i) => <p key={i}>· {d}</p>)}
      {isFull60 && <p className="text-amber-400">· Full60 世界：导出前请二次确认隐私。</p>}
    </div>
  );
}
