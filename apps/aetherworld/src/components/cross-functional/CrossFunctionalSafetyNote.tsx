import { CROSS_FUNCTIONAL_SAFETY_NOTE_TEXT } from "@/lib/cross-functional/crossFunctionalSafetyGuard";

export function CrossFunctionalSafetyNote() {
  return (
    <div className="aether-card p-3 text-[11px] text-muted-foreground leading-relaxed">
      <span className="text-foreground">安全边界 · </span>
      {CROSS_FUNCTIONAL_SAFETY_NOTE_TEXT}
    </div>
  );
}
