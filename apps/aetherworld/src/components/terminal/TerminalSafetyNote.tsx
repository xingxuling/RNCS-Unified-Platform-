import { TERMINAL_SAFETY_FOOTER } from "@/constants/terminal/terminalSafetyRules";

export function TerminalSafetyNote() {
  return (
    <div className="border-t border-amber-500/20 pt-3 text-[11px] leading-relaxed text-muted-foreground">
      {TERMINAL_SAFETY_FOOTER}
    </div>
  );
}
