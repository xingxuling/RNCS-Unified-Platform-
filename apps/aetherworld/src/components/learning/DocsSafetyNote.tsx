import { DOCS_SAFETY_FOOTER } from "@/constants/learning/docsSafetyRules";
import { ShieldAlert } from "lucide-react";

export function DocsSafetyNote() {
  return (
    <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground flex gap-3">
      <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
      <p className="leading-relaxed">{DOCS_SAFETY_FOOTER}</p>
    </div>
  );
}
