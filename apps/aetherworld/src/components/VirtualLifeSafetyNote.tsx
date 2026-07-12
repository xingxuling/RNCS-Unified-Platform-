import { VIRTUAL_LIFE_SAFETY_NOTE } from "@/constants/virtualLifeSafetyRules";

export function VirtualLifeSafetyNote({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`rounded border border-amber-400/30 bg-amber-400/5 text-amber-200/90 ${compact ? "px-3 py-1.5 text-[10px]" : "p-3 text-xs"}`}>
      {VIRTUAL_LIFE_SAFETY_NOTE}
    </div>
  );
}
