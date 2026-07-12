import type { AutocompleteSuggestion } from "@/lib/terminal/terminalAutocomplete";

interface Props {
  suggestions: AutocompleteSuggestion[];
  onPick: (value: string) => void;
}

export function TerminalAutocompletePanel({ suggestions, onPick }: Props) {
  if (suggestions.length === 0) return null;
  return (
    <div className="space-y-1">
      <h3 className="text-xs font-medium text-amber-300">自动补全</h3>
      <ul className="space-y-0.5">
        {suggestions.map((s) => (
          <li key={s.value}>
            <button
              onClick={() => onPick(s.value)}
              className="w-full text-left text-[11px] font-mono text-amber-100/90 hover:text-amber-200"
              title={s.hint}
            >
              {s.value}{s.hint ? <span className="text-muted-foreground"> — {s.hint}</span> : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
