import { EXPLAINABILITY_MODES, type ExplainabilityModeId } from "@/constants/compression/explainabilityModes";

export function ExplainabilityToggle({
  value, onChange,
}: { value: ExplainabilityModeId; onChange: (v: ExplainabilityModeId) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {EXPLAINABILITY_MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          className={`text-[11px] px-2.5 py-1 rounded border ${
            value === m.id ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:bg-muted"
          }`}
          title={m.description}
        >
          {m.label}<span className="ml-1 opacity-50">{m.en}</span>
        </button>
      ))}
    </div>
  );
}
