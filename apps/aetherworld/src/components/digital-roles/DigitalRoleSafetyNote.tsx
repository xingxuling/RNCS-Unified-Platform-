import { DIGITAL_ROLE_SAFETY_DISCLAIMER } from "@/constants/digital-roles/digitalRoleSafetyRules";

export function DigitalRoleSafetyNote() {
  return (
    <div className="aether-card p-3 text-[11px] text-muted-foreground leading-relaxed border-l-2 border-amber-500/40">
      {DIGITAL_ROLE_SAFETY_DISCLAIMER}
    </div>
  );
}
