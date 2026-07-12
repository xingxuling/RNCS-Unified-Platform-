import { saveFirstUseState } from "./firstUseSetupEngine";

export async function initializeWebLkm(): Promise<"READY" | "ERROR"> {
  try {
    if (typeof window !== "undefined") {
      const idx = localStorage.getItem("aether.weblkm.index");
      if (!idx) localStorage.setItem("aether.weblkm.index", JSON.stringify({ items: [], createdAt: new Date().toISOString() }));
    }
    saveFirstUseState({ webLkmStatus: "READY" });
    return "READY";
  } catch {
    saveFirstUseState({ webLkmStatus: "ERROR" });
    return "ERROR";
  }
}

export async function initializeWebLcm(): Promise<"READY" | "FALLBACK"> {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem("aether.weblcm.rule-engine", JSON.stringify({ ruleOnly: true, createdAt: new Date().toISOString() }));
    }
    saveFirstUseState({ webLcmStatus: "READY" });
    return "READY";
  } catch {
    saveFirstUseState({ webLcmStatus: "FALLBACK" });
    return "FALLBACK";
  }
}

export async function loadWebLlm(modelId?: string): Promise<"READY" | "FALLBACK" | "ERROR"> {
  try {
    const { loadRealWebLlmModel } = await import("@/lib/real-webllm/realWebLlmEngineManager");
    const res = await loadRealWebLlmModel(modelId);
    if (res.ok) {
      saveFirstUseState({ webLlmStatus: "READY" });
      return "READY";
    }
    saveFirstUseState({ webLlmStatus: "FALLBACK" });
    return "FALLBACK";
  } catch {
    saveFirstUseState({ webLlmStatus: "ERROR" });
    return "ERROR";
  }
}

export async function enterRuleMode() {
  saveFirstUseState({
    firstUseCompleted: true,
    coreModelSetupSkipped: true,
    webLlmStatus: "FALLBACK",
    webLcmStatus: "READY",
    webLkmStatus: "READY",
    setupRequired: false,
  });
}

export async function completeFirstUse() {
  saveFirstUseState({ firstUseCompleted: true, setupRequired: false });
}
