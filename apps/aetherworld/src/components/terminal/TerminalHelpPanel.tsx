import { TERMINAL_EXAMPLE_COMMANDS } from "@/constants/terminal/terminalExampleCommands";

interface Props {
  onPick: (command: string) => void;
  founder?: boolean;
}

export function TerminalHelpPanel({ onPick, founder }: Props) {
  const groups = Array.from(new Set(TERMINAL_EXAMPLE_COMMANDS.map((e) => e.group)));
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-xs font-medium text-amber-300">示例命令</h3>
        <p className="text-[10px] text-muted-foreground">点击即可填入输入框并执行。</p>
      </div>
      {groups.map((g) => {
        const items = TERMINAL_EXAMPLE_COMMANDS.filter((e) => e.group === g);
        if (g === "Founder" && !founder) return null;
        return (
          <div key={g}>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{g}</div>
            <ul className="space-y-0.5 mt-0.5">
              {items.map((e) => (
                <li key={e.command}>
                  <button
                    onClick={() => onPick(e.command)}
                    className="text-left text-[11px] font-mono text-amber-100/90 hover:text-amber-200"
                    title={e.description}
                  >
                    {e.command}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      {!founder && (
        <p className="text-[10px] text-muted-foreground">Founder 命令需在创始人模式下查看。</p>
      )}
    </div>
  );
}
