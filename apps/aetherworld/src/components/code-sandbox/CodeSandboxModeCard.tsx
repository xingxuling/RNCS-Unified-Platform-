import { CODE_SANDBOX_MODES, type CodeSandboxMode } from "@/constants/code-sandbox/codeSandboxModes";

interface Props {
  selected: CodeSandboxMode;
  onChange: (m: CodeSandboxMode) => void;
}

export function CodeSandboxModeCard({ selected, onChange }: Props) {
  return (
    <div className="border border-border/40 rounded p-3 space-y-2">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Runner Mode · 沙箱模式</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {CODE_SANDBOX_MODES.map((m) => {
          const active = selected === m.mode;
          return (
            <button
              key={m.mode}
              type="button"
              disabled={!m.enabled}
              onClick={() => m.enabled && onChange(m.mode)}
              className={`text-left p-2 rounded border text-[12px] transition-colors ${
                active ? "border-primary bg-primary/10" : "border-border/40 hover:bg-muted/30"
              } ${!m.enabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="font-medium text-sm">{m.title}</div>
              <div className="text-[10px] uppercase text-muted-foreground">{m.titleEn}{!m.enabled ? " · disabled" : ""}</div>
              <div className="text-[11px] text-muted-foreground mt-1">{m.description}</div>
              <ul className="text-[10px] text-muted-foreground mt-1 space-y-0.5">
                {m.notes.map((n, i) => <li key={i}>· {n}</li>)}
              </ul>
            </button>
          );
        })}
      </div>
    </div>
  );
}
