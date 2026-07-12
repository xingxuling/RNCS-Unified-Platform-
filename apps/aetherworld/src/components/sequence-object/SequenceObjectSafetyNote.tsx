import { SEQUENCE_OBJECT_SAFETY_NOTE } from "@/constants/sequence-object/sequenceObjectSafetyRules";

export function SequenceObjectSafetyNote() {
  return (
    <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-relaxed text-amber-300/90">
      <div className="mb-1 font-medium text-amber-200">安全边界 · Safety Boundary</div>
      {SEQUENCE_OBJECT_SAFETY_NOTE}
    </div>
  );
}
