import { SOCIETY_SAFETY_NOTE, SOCIETY_FORBIDDEN } from "@/constants/sequence-world/society/societySafetyRules";

export function WorldSocietySafetyNote() {
  return (
    <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs leading-relaxed text-amber-100/90">
      <div className="mb-1 font-medium text-amber-200">安全边界 · World Society v0.4</div>
      <p className="text-amber-100/80">{SOCIETY_SAFETY_NOTE}</p>
      <ul className="mt-2 list-disc pl-4 text-amber-100/70">
        {SOCIETY_FORBIDDEN.map(f => <li key={f}>{f}</li>)}
      </ul>
    </div>
  );
}
