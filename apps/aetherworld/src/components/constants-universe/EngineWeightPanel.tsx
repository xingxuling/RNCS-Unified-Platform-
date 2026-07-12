import { ENGINE_WEIGHT_CONSTANTS } from "@/constants/constant-universe/engineConstants";

function row(label: string, w: Record<string, number>) {
  const entries = Object.entries(w);
  if (!entries.length) return null;
  return (
    <div className="text-xs">
      <span className="text-muted-foreground">{label}：</span>
      {entries.map(([k, v]) => `${k} ${v}`).join("，")}
    </div>
  );
}

export function EngineWeightPanel() {
  return (
    <div className="space-y-3">
      {ENGINE_WEIGHT_CONSTANTS.map((e) => (
        <div key={e.intent} className="border rounded-md p-3">
          <h4 className="font-semibold text-sm">
            {e.chineseName} <span className="font-mono text-xs text-muted-foreground">{e.intent}</span>
          </h4>
          <div className="mt-1 space-y-0.5">
            {row("主引擎", e.primaryEngineWeights)}
            {row("辅助", e.supportingEngineWeights)}
            {row("验证", e.validationEngineWeights)}
          </div>
        </div>
      ))}
    </div>
  );
}
