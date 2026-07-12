import { UI_SAFETY_FOOTER } from "@/constants/ui-update/uiSafetyRules";
export function UISafetyNote() {
  return (
    <div className="border-t pt-3 mt-4 text-[11px] leading-relaxed text-muted-foreground">
      {UI_SAFETY_FOOTER}
    </div>
  );
}
