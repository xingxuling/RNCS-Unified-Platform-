import { ONTOLOGY_SAFETY_NOTE } from "@/lib/objectOntologySafetyGuard";

export function ObjectOntologySafetyNote() {
  return (
    <div className="aether-card p-3 text-[11px] leading-relaxed text-muted-foreground whitespace-pre-line">
      <span className="text-foreground/85">安全边界 · </span>{ONTOLOGY_SAFETY_NOTE}
    </div>
  );
}
