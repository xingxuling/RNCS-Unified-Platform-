import { useEffect, useState } from "react";
import { clearTerminalHistory, getTerminalHistory, type TerminalHistoryEntry } from "@/lib/terminal/terminalHistory";

interface Props {
  refreshKey?: number;
  onPick?: (command: string) => void;
}

export function TerminalCommandHistory({ refreshKey, onPick }: Props) {
  const [items, setItems] = useState<TerminalHistoryEntry[]>([]);

  useEffect(() => {
    setItems(getTerminalHistory().slice(-30).reverse());
  }, [refreshKey]);

  if (items.length === 0) {
    return <div className="text-xs text-muted-foreground">暂无历史命令。</div>;
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-amber-300">最近命令</h3>
        <button
          className="text-[10px] text-muted-foreground hover:text-red-300"
          onClick={() => { clearTerminalHistory(); setItems([]); }}
        >
          清空
        </button>
      </div>
      <ul className="space-y-1 max-h-72 overflow-y-auto pr-1">
        {items.map((e) => (
          <li key={e.id}>
            <button
              onClick={() => onPick?.(e.command)}
              className="w-full text-left text-[11px] font-mono text-amber-100/90 hover:text-amber-200 truncate"
              title={`${e.command} · ${e.outputSummary}`}
            >
              {e.command}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
