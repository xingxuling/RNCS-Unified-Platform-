// 真实 WebLLM Engine 管理器：加载、进度、切换、释放、错误捕获
import { defaultModelId } from "./realWebLlmModelRegistry";

export type EngineStatus =
  | "NOT_READY"
  | "LOADING"
  | "READY"
  | "GENERATING"
  | "ERROR"
  | "UNSUPPORTED"
  | "FALLBACK";

export interface RealWebLlmRuntimeState {
  webGpuSupported: boolean;
  webLlmPackageAvailable: boolean;
  selectedModelId?: string;
  engineStatus: EngineStatus;
  loadingProgress: number;
  loadingMessage?: string;
  currentRunId?: string;
  lastError?: string;
  fallbackReason?: string;
  updatedAt: string;
}

type Listener = () => void;

const state: RealWebLlmRuntimeState = {
  webGpuSupported: false,
  webLlmPackageAvailable: false,
  selectedModelId: undefined,
  engineStatus: "NOT_READY",
  loadingProgress: 0,
  loadingMessage: undefined,
  updatedAt: new Date().toISOString(),
};

let engine: any = null;
let loadingModelId: string | null = null;
const listeners = new Set<Listener>();

function emit() {
  state.updatedAt = new Date().toISOString();
  listeners.forEach((l) => l());
}

export function subscribeRuntime(cb: Listener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getRuntimeState(): RealWebLlmRuntimeState {
  return state;
}

export function setRuntimePartial(patch: Partial<RealWebLlmRuntimeState>) {
  Object.assign(state, patch);
  emit();
}

export function getEngine(): any {
  return engine;
}

export async function loadRealWebLlmModel(modelId?: string): Promise<{ ok: boolean; error?: string }> {
  const id = modelId ?? state.selectedModelId ?? defaultModelId();
  if (loadingModelId === id && state.engineStatus === "LOADING") {
    return { ok: false, error: "模型正在加载中。" };
  }
  loadingModelId = id;
  setRuntimePartial({
    selectedModelId: id,
    engineStatus: "LOADING",
    loadingProgress: 0,
    loadingMessage: "准备加载模型……",
    lastError: undefined,
  });
  try {
    const webllm = await import("@mlc-ai/web-llm");
    const create = (webllm as any).CreateMLCEngine ?? (webllm as any).CreateWebWorkerMLCEngine;
    if (typeof create !== "function") {
      throw new Error("@mlc-ai/web-llm 未导出 CreateMLCEngine。");
    }
    engine = await create(id, {
      initProgressCallback: (report: any) => {
        const progress = typeof report?.progress === "number" ? report.progress : 0;
        setRuntimePartial({
          loadingProgress: Math.min(1, Math.max(0, progress)),
          loadingMessage: report?.text ?? "加载中……",
        });
      },
    });
    setRuntimePartial({
      engineStatus: "READY",
      loadingProgress: 1,
      loadingMessage: "模型已就绪。",
    });
    loadingModelId = null;
    return { ok: true };
  } catch (e: any) {
    loadingModelId = null;
    engine = null;
    const msg = e?.message ?? String(e);
    setRuntimePartial({
      engineStatus: "ERROR",
      lastError: msg,
      loadingMessage: undefined,
    });
    return { ok: false, error: msg };
  }
}

export async function resetEngine() {
  try {
    if (engine && typeof engine.unload === "function") {
      await engine.unload();
    }
  } catch {
    // ignore
  }
  engine = null;
  setRuntimePartial({
    engineStatus: "NOT_READY",
    loadingProgress: 0,
    loadingMessage: undefined,
    currentRunId: undefined,
  });
}

export function markGenerating(runId: string) {
  setRuntimePartial({ engineStatus: "GENERATING", currentRunId: runId });
}

export function markReady() {
  setRuntimePartial({ engineStatus: "READY", currentRunId: undefined });
}

export function markError(msg: string) {
  setRuntimePartial({ engineStatus: "ERROR", lastError: msg, currentRunId: undefined });
}
