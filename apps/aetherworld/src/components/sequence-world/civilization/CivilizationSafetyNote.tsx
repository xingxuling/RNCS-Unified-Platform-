import { CIVILIZATION_SAFETY_NOTE } from "@/lib/sequence-world/civilization/civilizationSafetyGuard";

export function CivilizationSafetyNote({ extra }: { extra?: string[] }) {
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300">
      <div className="font-medium mb-1">安全说明</div>
      <div>{CIVILIZATION_SAFETY_NOTE}</div>
      {extra && extra.length > 0 && (
        <ul className="mt-2 list-disc pl-4 space-y-0.5">
          {extra.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      )}
    </div>
  );
}
