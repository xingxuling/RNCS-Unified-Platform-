import { EXAMPLE_SAFETY_NOTE } from "@/constants/exampleSafetyRules";

export function ExampleSafetyNote({ compact = false, note }: { compact?: boolean; note?: string }) {
  return (
    <div className={`rounded border border-amber-400/30 bg-amber-400/5 text-amber-200/90 ${compact ? "px-3 py-1.5 text-[10px]" : "p-3 text-xs"}`}>
      {note ?? EXAMPLE_SAFETY_NOTE}
    </div>
  );
}
