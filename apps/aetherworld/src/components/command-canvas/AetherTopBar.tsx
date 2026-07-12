import { AetherModeSwitcher } from "./AetherModeSwitcher";
import { AetherFocusModeToggle } from "./AetherFocusModeToggle";
import { AetherObjectBreadcrumb } from "./AetherObjectBreadcrumb";
import type { AetherUiModeId } from "@/constants/command-canvas/aetherUiModes";

interface Props {
  uiMode: AetherUiModeId;
  setUiMode: (m: AetherUiModeId) => void;
  onOpenPalette: () => void;
  onOpenLegacy: () => void;
  objectTitle?: string;
  objectType?: string;
  runStatus?: string;
}

const STATUS_DOT = ({ label, color }: { label: string; color: string }) => (
  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
    <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
    {label}
  </span>
);

export function AetherTopBar({ uiMode, setUiMode, onOpenPalette, onOpenLegacy, objectTitle, objectType, runStatus }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 bg-background/80 px-4 py-2 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Aetherworld</div>
        <AetherObjectBreadcrumb objectTitle={objectTitle} objectType={objectType} runStatus={runStatus} />
      </div>
      <div className="flex items-center gap-2">
        <STATUS_DOT label="WebLLM" color="bg-emerald-400" />
        <STATUS_DOT label="WebLCM" color="bg-emerald-400" />
        <STATUS_DOT label="WebLKM" color="bg-emerald-400" />
        <STATUS_DOT label="QA" color="bg-emerald-400" />
        <AetherModeSwitcher value={uiMode} onChange={setUiMode} />
        <AetherFocusModeToggle isFocus={uiMode === "FOCUS_MODE"} onChange={() => setUiMode("COMMAND_MODE")} />
        <button onClick={onOpenLegacy} className="rounded-md border border-border/40 bg-card/60 px-2 py-1 text-xs hover:border-primary/40">
          Legacy
        </button>
        <button onClick={onOpenPalette} className="rounded-md border border-border/40 bg-card/60 px-2 py-1 text-xs hover:border-primary/40">
          ⌘K · Palette
        </button>
      </div>
    </div>
  );
}
