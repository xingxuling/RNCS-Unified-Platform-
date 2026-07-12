import { WEB_LLM_SAFETY_FOOTER } from "@/constants/webllm/webLlmSafetyRules";

export function WebLlmSafetyNote() {
  return (
    <div className="border border-amber-700/40 bg-amber-900/10 rounded p-3 text-[11px] text-amber-200/80 leading-relaxed">
      {WEB_LLM_SAFETY_FOOTER}
    </div>
  );
}
