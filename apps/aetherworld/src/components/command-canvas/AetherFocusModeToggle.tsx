import { toggleFocusMode } from "@/lib/command-canvas/focusModeEngine";

interface Props { isFocus: boolean; onChange: () => void; }

export function AetherFocusModeToggle({ isFocus, onChange }: Props) {
  return (
    <button
      onClick={() => { toggleFocusMode(); onChange(); }}
      className="rounded-md border border-border/40 bg-card/60 px-2 py-1 text-xs hover:border-primary/40"
    >
      {isFocus ? "退出专注" : "专注模式"}
    </button>
  );
}
