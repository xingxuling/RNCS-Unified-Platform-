import { loadFirstUseState, saveFirstUseState, type FirstUseCoreModelState } from "./firstUseSetupEngine";

export async function detectCoreModelStatus(): Promise<FirstUseCoreModelState> {
  const state = loadFirstUseState();
  let webGpuSupported = false;
  let deviceCapability: FirstUseCoreModelState["deviceCapability"] = "UNKNOWN";
  try {
    if (typeof navigator !== "undefined" && (navigator as any).gpu) {
      const adapter = await (navigator as any).gpu.requestAdapter?.();
      webGpuSupported = !!adapter;
      const mem = (navigator as any).deviceMemory as number | undefined;
      if (mem && mem >= 8) deviceCapability = "HIGH";
      else if (mem && mem >= 4) deviceCapability = "MEDIUM";
      else if (mem) deviceCapability = "LOW";
    }
  } catch {}
  const setupRequired =
    !state.firstUseCompleted ||
    state.webLlmStatus === "NOT_INSTALLED" ||
    state.webLlmStatus === "NOT_LOADED" ||
    state.webLcmStatus === "NOT_INITIALIZED" ||
    state.webLkmStatus === "NOT_INITIALIZED";
  return saveFirstUseState({ webGpuSupported, deviceCapability, setupRequired }) as FirstUseCoreModelState;
}

export function shouldShowFirstUseGuide(): boolean {
  const s = loadFirstUseState();
  if (s.doNotRemind) return false;
  if (s.firstUseCompleted && !s.setupRequired) return false;
  return true;
}
