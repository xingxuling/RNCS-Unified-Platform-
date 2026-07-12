export const WEB_CAPABILITY_RECALC_TARGETS = [
  "Recalculate Web Capability Registry",
  "Recalculate Web Capability Routes",
  "Recalculate Web Capability Runs",
  "Recalculate Web Capability Outputs",
  "Recalculate Web Capability QA",
  "Recalculate Capability Workspace Records",
] as const;

export const WEB_CAPABILITY_RECALC_TRIGGERS = [
  "WEBLKM_UPDATED", "WEBCM_UPDATED", "WEBCOM_UPDATED", "WEBLCM_UPDATED",
  "WEBLLM_UPDATED", "WEBLWM_UPDATED", "APP_RUNTIME_UPDATED",
  "CODE_SANDBOX_UPDATED", "VOCAL_ENGINE_UPDATED", "NARRATIVE_ENGINE_UPDATED",
  "WORKSPACE_UPDATED", "SYSTEM_CONSTITUTION_UPDATED",
] as const;

export function listWebCapabilityRecalcTargets() {
  return [...WEB_CAPABILITY_RECALC_TARGETS];
}
