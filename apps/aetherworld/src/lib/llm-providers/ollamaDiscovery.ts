// Ollama 端口自动发现：依次探测常见端点，返回第一个 READY 的地址与模型列表
const CANDIDATES = [
  "http://localhost:11434",
  "http://localhost:11435",
  "http://127.0.0.1:11434",
  "http://127.0.0.1:11435",
];

export interface OllamaProbeResult {
  baseUrl: string;
  ok: boolean;
  models: string[];
  error?: string;
}

export interface OllamaDiscoveryResult {
  found: boolean;
  baseUrl?: string;
  models: string[];
  probes: OllamaProbeResult[];
  switchedFromDefault: boolean;
  message: string;
}

export async function probeOllamaBaseUrl(baseUrl: string): Promise<OllamaProbeResult> {
  const url = baseUrl.replace(/\/$/, "") + "/api/tags";
  try {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) return { baseUrl, ok: false, models: [], error: `HTTP ${res.status}` };
    const ctype = res.headers.get("content-type") || "";
    const text = await res.text();
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { baseUrl, ok: false, models: [], error: `非 JSON 响应（${ctype || "unknown"}）` };
    }
    const models = (parsed as { models?: Array<{ name: string }> })?.models;
    if (!Array.isArray(models)) {
      return { baseUrl, ok: false, models: [], error: "响应缺少 models 字段，非 Ollama API" };
    }
    return { baseUrl, ok: true, models: models.map((m) => m.name) };
  } catch (e) {
    return { baseUrl, ok: false, models: [], error: e instanceof Error ? e.message : String(e) };
  }
}

export async function discoverOllama(currentBaseUrl?: string): Promise<OllamaDiscoveryResult> {
  // 把用户当前 Base URL 放在第一位，避免漏掉自定义端口
  const ordered = [
    ...(currentBaseUrl ? [currentBaseUrl.replace(/\/$/, "")] : []),
    ...CANDIDATES,
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  const probes: OllamaProbeResult[] = [];
  for (const url of ordered) {
    const r = await probeOllamaBaseUrl(url);
    probes.push(r);
    if (r.ok) {
      const defaultUrl = "http://localhost:11434";
      const switched = r.baseUrl.replace(/\/$/, "") !== defaultUrl;
      const port = (() => {
        try {
          return new URL(r.baseUrl).port || "11434";
        } catch {
          return "";
        }
      })();
      const message = switched
        ? `检测到 Ollama 正在 ${port} 端口运行，已自动切换。`
        : "检测到 Ollama 正在默认端口运行。";
      return {
        found: true,
        baseUrl: r.baseUrl,
        models: r.models,
        probes,
        switchedFromDefault: switched,
        message,
      };
    }
  }
  return {
    found: false,
    models: [],
    probes,
    switchedFromDefault: false,
    message: "未在常见端口发现 Ollama（11434 / 11435 等），请确认 ollama serve 是否已启动。",
  };
}
