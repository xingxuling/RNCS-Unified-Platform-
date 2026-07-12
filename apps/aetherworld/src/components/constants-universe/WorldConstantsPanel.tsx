import { WORLD_SIMULATION_CONSTANTS } from "@/constants/constant-universe/worldSimulationConstants";
import { WORLD_GROWTH_CONSTANTS } from "@/constants/constant-universe/worldGrowthConstants";
import { WORLD_SOCIETY_CONSTANTS } from "@/constants/constant-universe/worldSocietyConstants";
import { CIVILIZATION_CONSTANTS } from "@/constants/constant-universe/civilizationConstants";
import { PRESENTATION_CONSTANTS } from "@/constants/constant-universe/presentationConstants";

function Group({ title, data }: { title: string; data: Record<string, unknown> }) {
  return (
    <div className="border rounded-md p-3">
      <h4 className="font-semibold text-sm mb-2">{title}</h4>
      <div className="grid gap-1 text-xs">
        {Object.entries(data).map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2">
            <span className="font-mono text-muted-foreground">{k}</span>
            <span className="font-mono">{String(v)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WorldConstantsPanel() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Group title="世界模拟 v0.2" data={WORLD_SIMULATION_CONSTANTS} />
      <Group title="世界生长 v0.3" data={WORLD_GROWTH_CONSTANTS} />
      <Group title="世界社会 v0.4" data={WORLD_SOCIETY_CONSTANTS} />
      <Group title="文明演化 v0.5" data={CIVILIZATION_CONSTANTS} />
      <Group title="表现层 v0.6" data={PRESENTATION_CONSTANTS} />
    </div>
  );
}
