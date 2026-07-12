import { CODE_SANDBOX_SAFETY_FOOTER } from "@/constants/code-sandbox/codeSandboxSafetyRules";

export function CodeSandboxSafetyNote() {
  return (
    <div className="border border-amber-700/40 bg-amber-900/10 rounded p-3 text-[11px] text-amber-200/80 leading-relaxed">
      {CODE_SANDBOX_SAFETY_FOOTER}
    </div>
  );
}
