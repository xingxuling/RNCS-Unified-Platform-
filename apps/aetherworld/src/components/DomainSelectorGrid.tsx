// 领域选择网格 · Domain Selector Grid
import { PROMPT_DOMAINS } from "@/constants/promptDomains";

interface Props {
  value: string;
  onChange: (id: string) => void;
  label?: string;
}

export function DomainSelectorGrid({ value, onChange, label }: Props) {
  return (
    <div>
      {label && (
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">{label}</div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-72 overflow-auto pr-1">
        {PROMPT_DOMAINS.map((d) => {
          const active = d.id === value;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => onChange(d.id)}
              className={`text-left aether-card p-2 rounded-md border transition ${
                active
                  ? "border-primary/70 bg-primary/10"
                  : "border-border/40 hover:border-border"
              }`}
            >
              <div className="text-sm leading-tight">{d.name}</div>
              <div className="text-[10px] text-muted-foreground tracking-wider">{d.en}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
