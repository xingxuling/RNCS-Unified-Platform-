import { TEXT_SAFETY_FOOTER } from "@/constants/text-dynamic/textSafetyRules";

export function TextSafetyNote() {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-4 text-xs text-muted-foreground leading-relaxed">
      <div className="font-medium text-foreground mb-1">安全边界</div>
      {TEXT_SAFETY_FOOTER}
    </div>
  );
}
