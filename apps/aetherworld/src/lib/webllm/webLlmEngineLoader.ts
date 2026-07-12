export interface WebLlmEngineState {
  engineId: string;
  modelId: string;
  status: "NOT_LOADED" | "LOADING" | "READY" | "ERROR" | "UNSUPPORTED";
  loadingProgress: number;
  loadingMessage?: string;
  errorMessage?: string;
  loadedAt?: string;
}

const STATE: { current: WebLlmEngineState } = {
  current: {
    engineId: "aether-webllm",
    modelId: "",
    status: "NOT_LOADED",
    loadingProgress: 0,
  },
};

type Listener = (s: WebLlmEngineState) => void;
const listeners = new Set<Listener>();

export function subscribeEngine(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  for (const l of listeners) l({ ...STATE.current });
}

export function getEngineState(): WebLlmEngineState {
  return { ...STATE.current };
}

/**
 * Mock load: actual WebLLM dynamic import fails when package absent → ERROR.
 * If available, would call CreateMLCEngine. For now we simulate progress so UI works.
 */
export async function loadWebLlmModel(modelId: string, opts?: { signal?: AbortSignal }): Promise<WebLlmEngineState> {
  if (STATE.current.modelId === modelId && STATE.current.status === "READY") return getEngineState();
  STATE.current = { engineId: "aether-webllm", modelId, status: "LOADING", loadingProgress: 0, loadingMessage: "初始化中…" };
  emit();

  // Try real package
  let real = false;
  try {
    const mod = ["@mlc-ai/", "web-llm"].join("");
    // @ts-ignore
    await import(/* @vite-ignore */ mod);
    real = true;
  } catch {
    real = false;
  }

  // @ts-ignore
  const hasGpu = typeof navigator !== "undefined" && !!(navigator as any).gpu;
  if (!hasGpu) {
    STATE.current = { ...STATE.current, status: "UNSUPPORTED", errorMessage: "WebGPU 不可用" };
    emit();
    return getEngineState();
  }
  if (!real) {
    STATE.current = { ...STATE.current, status: "ERROR", errorMessage: "WebLLM package 未安装：@mlc-ai/web-llm" };
    emit();
    return getEngineState();
  }

  // Simulated progressive load (real engine integration TBD)
  for (let i = 1; i <= 10; i++) {
    if (opts?.signal?.aborted) {
      STATE.current = { ...STATE.current, status: "ERROR", errorMessage: "已取消" };
      emit();
      return getEngineState();
    }
    await new Promise((r) => setTimeout(r, 50));
    STATE.current = { ...STATE.current, loadingProgress: i / 10, loadingMessage: `加载中 ${i * 10}%` };
    emit();
  }
  STATE.current = { ...STATE.current, status: "READY", loadingProgress: 1, loadedAt: new Date().toISOString(), loadingMessage: "就绪" };
  emit();
  return getEngineState();
}

export function unloadEngine() {
  STATE.current = { engineId: "aether-webllm", modelId: "", status: "NOT_LOADED", loadingProgress: 0 };
  emit();
}
