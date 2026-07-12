import { AETHER_UI_MODES, type AetherUiModeId } from "@/constants/command-canvas/aetherUiModes";

interface Props { value: AetherUiModeId; onChange: (m: AetherUiModeId) => void; }

export function AetherModeSwitcher({ value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as AetherUiModeId)}
      className="rounded-md border border-border/40 bg-card/60 px-2 py-1 text-xs"
    >
      {AETHER_UI_MODES.map((m) => (
        <option key={m.id} value={m.id}>{m.label}</option>
      ))}
    </select>
  );
}
