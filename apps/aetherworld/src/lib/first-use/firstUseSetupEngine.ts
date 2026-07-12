export type WebLlmStatus = "NOT_INSTALLED" | "NOT_LOADED" | "READY" | "FALLBACK" | "ERROR";
export type WebLcmStatus = "NOT_INITIALIZED" | "READY" | "FALLBACK" | "ERROR";
export type WebLkmStatus = "NOT_INITIALIZED" | "READY" | "FALLBACK" | "ERROR";
export type DeviceCapability = "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";

export interface FirstUseCoreModelState {
  firstUseCompleted: boolean;
  coreModelSetupSkipped: boolean;
  doNotRemind: boolean;
  webLlmStatus: WebLlmStatus;
  webLcmStatus: WebLcmStatus;
  webLkmStatus: WebLkmStatus;
  webGpuSupported: boolean;
  deviceCapability: DeviceCapability;
  setupRequired: boolean;
  updatedAt: string;
}

const KEY = "aether.first-use.core-model";

export function loadFirstUseState(): FirstUseCoreModelState {
  try {
    if (typeof window === "undefined") throw new Error("ssr");
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaultState(), ...JSON.parse(raw) };
  } catch {}
  return defaultState();
}

export function saveFirstUseState(patch: Partial<FirstUseCoreModelState>) {
  if (typeof window === "undefined") return;
  const next = { ...loadFirstUseState(), ...patch, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  return next;
}

function defaultState(): FirstUseCoreModelState {
  return {
    firstUseCompleted: false,
    coreModelSetupSkipped: false,
    doNotRemind: false,
    webLlmStatus: "NOT_INSTALLED",
    webLcmStatus: "NOT_INITIALIZED",
    webLkmStatus: "NOT_INITIALIZED",
    webGpuSupported: false,
    deviceCapability: "UNKNOWN",
    setupRequired: true,
    updatedAt: new Date().toISOString(),
  };
}

export function isFullMode(s: FirstUseCoreModelState) {
  return s.webLlmStatus === "READY" && s.webLcmStatus === "READY" && s.webLkmStatus === "READY";
}

export function currentMode(s: FirstUseCoreModelState): "完整模式" | "规则模式" | "降级模式" {
  if (isFullMode(s)) return "完整模式";
  if (s.coreModelSetupSkipped || s.webLlmStatus === "FALLBACK") return "规则模式";
  return "降级模式";
}
