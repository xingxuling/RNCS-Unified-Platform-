import { useEffect, useRef, useState } from "react";
import type { AutocompleteSuggestion } from "@/lib/terminal/terminalAutocomplete";
import { autocomplete } from "@/lib/terminal/terminalAutocomplete";

interface Props {
  onSubmit: (cmd: string) => void;
  disabled?: boolean;
  prompt?: string;
}

export function TerminalInputLine({ onSubmit, disabled, prompt = ">" }: Props) {
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number | null>(null);
  const [localHistory, setLocalHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSuggestions(autocomplete(value));
  }, [value]);

  function handleSubmit() {
    const v = value.trim();
    if (!v) return;
    onSubmit(v);
    setLocalHistory((h) => [...h, v].slice(-50));
    setValue("");
    setHistoryIdx(null);
  }

  function applySuggestion(s: AutocompleteSuggestion) {
    const tokens = value.split(/\s+/);
    tokens[tokens.length - 1] = s.value;
    const next = tokens.join(" ") + " ";
    setValue(next);
    inputRef.current?.focus();
  }

  return (
    <div className="border border-amber-500/30 bg-black/60 rounded-md px-3 py-2 font-mono text-sm">
      <div className="flex items-center gap-2">
        <span className="text-amber-400">{prompt}</span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            } else if (e.key === "Tab" && suggestions.length > 0) {
              e.preventDefault();
              applySuggestion(suggestions[0]);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              if (localHistory.length === 0) return;
              const next = historyIdx === null ? localHistory.length - 1 : Math.max(0, historyIdx - 1);
              setHistoryIdx(next);
              setValue(localHistory[next] ?? "");
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              if (historyIdx === null) return;
              const next = historyIdx + 1;
              if (next >= localHistory.length) { setHistoryIdx(null); setValue(""); }
              else { setHistoryIdx(next); setValue(localHistory[next] ?? ""); }
            }
          }}
          disabled={disabled}
          placeholder="输入命令，例如：help / 55555 / compile 55555 --to godot"
          className="flex-1 bg-transparent outline-none text-amber-100 placeholder:text-amber-100/30 disabled:opacity-50"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      {suggestions.length > 0 && (
        <div className="mt-2 border-t border-amber-500/20 pt-2 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s.value + s.source}
              onClick={() => applySuggestion(s)}
              className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 transition"
              title={s.hint}
            >
              {s.value}
            </button>
          ))}
          <span className="text-[10px] text-muted-foreground self-center">Tab 补全 · ↑↓ 历史 · Enter 执行</span>
        </div>
      )}
    </div>
  );
}
