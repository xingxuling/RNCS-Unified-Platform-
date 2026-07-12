// Ollama 连接诊断：中文化、结构化、分级状态
import type { LlmProviderConfig } from "./llmProviderTypes";

export type OllamaDiagnosticLevel = "PASS" | "WARN" | "FAIL" | "INFO";

/** 细化的诊断状态 */
export type OllamaDiagnosticStatus =
  | "READY" // 端口可达，是 Ollama，默认模型可用
  | "NO_MODELS" // 是 Ollama，但未下载任何模型
  | "MODEL_NOT_FOUND" // 是 Ollama，有模型但默认模型缺失
  | "NON_OLLAMA_RESPONSE" // 端口可达，但响应不是 Ollama API
  | "TERMINAL_OK_BROWSER_BLOCKED" // 终端可访问，但浏览器被拒（疑似 OLLAMA_ORIGINS 未放行）
  | "CORS_ORIGIN_BLOCKED" // 浏览器跨域 Origin 被拒（保留别名）
  | "CORS_BLOCKED" // 旧别名（向后兼容）
  | "UNREACHABLE_PORT" // 端口不可达 / 服务未启动
  | "UNKNOWN_ERROR";

export interface OllamaDiagnosticItem {
  id: string;
  label: string;
  level: OllamaDiagnosticLevel;
  detail?: string;
}

export interface OllamaDiagnosticCommand {
  label: string;
  command: string;
  /** 适用平台标签，仅用于展示 */
  platform?: "Windows PowerShell" | "macOS / Linux" | "通用";
}

export interface OllamaDiagnosticReport {
  ok: boolean;
  status: OllamaDiagnosticStatus;
  statusTitle: string;
  statusDescription: string;
  baseUrl: string;
  reachable: boolean;
  isOllama: boolean;
  modelCount: number;
  hasDefaultModel: boolean;
  rawErrorMessage?: string;
  rawResponsePreview?: string;
  items: OllamaDiagnosticItem[];
  suggestions: string[];
  commands: OllamaDiagnosticCommand[];
  /** 当前页面 Origin（用于生成 OLLAMA_ORIGINS 建议） */
  currentOrigin?: string;
}

const DEFAULT_BASE = "http://localhost:11434";

function looksLikeCors(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("load failed") ||
    msg.includes("cors")
  );
}

/** 通过 no-cors 探测端口是否在监听（CORS 失败时辅助判断） */
async function probePortAlive(baseUrl: string): Promise<boolean> {
  try {
    await fetch(`${baseUrl}/api/tags`, { method: "GET", mode: "no-cors" });
    // no-cors 拿到 opaque 响应也算端口可达
    return true;
  } catch {
    return false;
  }
}

function getCurrentOrigin(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return window.location.origin;
}

/** 生成 OLLAMA_ORIGINS 值：包含当前站点 + 常用本地地址 */
function buildOllamaOriginsValue(currentOrigin?: string): string {
  const origins = new Set<string>();
  if (currentOrigin) origins.add(currentOrigin);
  origins.add("http://localhost:*");
  origins.add("http://127.0.0.1:*");
  return Array.from(origins).join(",");
}

/** 从 baseUrl 中解析 host:port，给 OLLAMA_HOST 使用 */
function extractHostPort(baseUrl: string): string {
  try {
    const u = new URL(baseUrl);
    return `${u.hostname}:${u.port || "11434"}`;
  } catch {
    return "localhost:11434";
  }
}

function buildCommands(
  baseUrl: string,
  defaultModel: string,
  currentOrigin?: string,
): OllamaDiagnosticCommand[] {
  const originsValue = buildOllamaOriginsValue(currentOrigin);
  const hostPort = extractHostPort(baseUrl);
  return [
    // —— Windows PowerShell 优先 ——
    {
      label: "测试接口（终端，PowerShell）",
      command: `curl.exe ${baseUrl}/api/tags`,
      platform: "Windows PowerShell",
    },
    {
      label: "永久设置 OLLAMA_HOST（用户级，PowerShell）",
      command: `[Environment]::SetEnvironmentVariable("OLLAMA_HOST", "${hostPort}", "User")`,
      platform: "Windows PowerShell",
    },
    {
      label: "永久设置 OLLAMA_ORIGINS 允许本站访问（用户级，PowerShell）",
      command: `[Environment]::SetEnvironmentVariable("OLLAMA_ORIGINS", "${originsValue}", "User")`,
      platform: "Windows PowerShell",
    },
    {
      label: "当前会话临时允许跨域并启动（PowerShell）",
      command: `$env:OLLAMA_ORIGINS="${originsValue}"\nollama serve`,
      platform: "Windows PowerShell",
    },
    // —— macOS / Linux ——
    {
      label: "测试接口（macOS / Linux）",
      command: `curl ${baseUrl}/api/tags`,
      platform: "macOS / Linux",
    },
    {
      label: "启动 Ollama 并允许跨域（macOS / Linux）",
      command: `OLLAMA_ORIGINS="${originsValue}" ollama serve`,
      platform: "macOS / Linux",
    },
    // —— 通用 ——
    { label: "查看已下载模型", command: "ollama list", platform: "通用" },
    {
      label: "下载默认模型",
      command: `ollama pull ${defaultModel}`,
      platform: "通用",
    },
  ];
}

const STATUS_META: Record<OllamaDiagnosticStatus, { title: string; description: string }> = {
  READY: {
    title: "Ollama 已连接",
    description: "端口可达，接口响应正常，默认模型可用。",
  },
  NO_MODELS: {
    title: "Ollama 已启动，但未安装任何模型",
    description: "请先在终端下载一个模型，例如 ollama pull qwen2.5:8b。",
  },
  MODEL_NOT_FOUND: {
    title: "默认模型尚未安装",
    description: "Ollama 已可访问，但配置的默认模型不在已下载列表中。",
  },
  NON_OLLAMA_RESPONSE: {
    title: "该端口有服务响应，但不是 Ollama API",
    description:
      "该端口返回了非 Ollama 的内容（可能是 HTML、代理页或其他本地服务）。请确认 Base URL 是否应为 http://localhost:11434，不要把其他本地服务端口填入 Ollama Provider。",
  },
  TERMINAL_OK_BROWSER_BLOCKED: {
    title: "Ollama 已运行，但浏览器访问被限制",
    description:
      "终端可访问该端口（说明 Ollama 服务正常），但浏览器 fetch 被拒，疑似 OLLAMA_ORIGINS / CORS 未放行当前站点。请按 Windows PowerShell 命令永久设置 OLLAMA_ORIGINS，然后重启 Ollama。",
  },
  CORS_ORIGIN_BLOCKED: {
    title: "浏览器跨域 Origin 被拒",
    description:
      "Ollama 拒绝了当前站点的跨域请求。请将本站 Origin 加入 OLLAMA_ORIGINS，并重启 Ollama 让设置生效。",
  },
  CORS_BLOCKED: {
    title: "浏览器跨域被拒",
    description:
      "端口可达，但浏览器未被 Ollama 允许访问。请设置 OLLAMA_ORIGINS 包含当前站点 Origin，然后重启 ollama serve。",
  },
  UNREACHABLE_PORT: {
    title: "Ollama 服务未启动或端口不可访问",
    description:
      "无法连接到该端口。请确认 Ollama 是否已运行（执行 ollama serve），并使用 curl.exe 测试接口连通性。",
  },
  UNKNOWN_ERROR: {
    title: "无法连接本机 Ollama",
    description: "诊断过程中出现未知错误，请查看技术详情。",
  },
};

export async function diagnoseOllama(cfg: LlmProviderConfig): Promise<OllamaDiagnosticReport> {
  const baseUrl = (cfg.baseUrl || DEFAULT_BASE).replace(/\/$/, "");
  const defaultModel = cfg.defaultModel || "qwen2.5:8b";
  const currentOrigin = getCurrentOrigin();

  const items: OllamaDiagnosticItem[] = [];
  const suggestions: string[] = [];

  // 1. Base URL
  if (!cfg.baseUrl) {
    items.push({ id: "base-url", label: "Base URL 未填写，使用默认地址", level: "WARN", detail: DEFAULT_BASE });
  } else {
    items.push({ id: "base-url", label: "Base URL 已配置", level: "PASS", detail: baseUrl });
  }

  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)(:|\/|$)/.test(baseUrl);
  items.push({
    id: "is-local",
    label: isLocal ? "本机地址" : "非本机地址（需自行确认可达性与 CORS）",
    level: isLocal ? "PASS" : "INFO",
  });

  if (currentOrigin) {
    items.push({
      id: "page-origin",
      label: "当前页面 Origin",
      level: "INFO",
      detail: currentOrigin + (currentOrigin.startsWith("https://") && isLocal ? "（HTTPS 页面访问本地 HTTP，需 OLLAMA_ORIGINS 显式放行）" : ""),
    });
  }

  // 2. 请求 /api/tags
  let reachable = false;
  let isOllama = false;
  let modelCount = 0;
  let hasDefaultModel = false;
  let modelNames: string[] = [];
  let rawErrorMessage: string | undefined;
  let rawResponsePreview: string | undefined;
  let status: OllamaDiagnosticStatus = "UNKNOWN_ERROR";

  try {
    const res = await fetch(`${baseUrl}/api/tags`, { method: "GET" });
    reachable = true;

    const ctype = res.headers.get("content-type") || "";
    const bodyText = await res.text();
    rawResponsePreview = bodyText.slice(0, 240);

    if (!res.ok) {
      rawErrorMessage = `HTTP ${res.status} ${res.statusText}`;
      if (res.status === 403) {
        status = "CORS_ORIGIN_BLOCKED";
        items.push({
          id: "tags",
          label: "/api/tags 返回 403：Ollama 拒绝了当前 Origin",
          level: "FAIL",
          detail: currentOrigin,
        });
      } else if (!ctype.includes("json")) {
        status = "NON_OLLAMA_RESPONSE";
        items.push({
          id: "tags",
          label: `端口有响应但 /api/tags 返回 HTTP ${res.status}（非 JSON）`,
          level: "FAIL",
          detail: ctype || undefined,
        });
      } else {
        status = "UNREACHABLE_PORT";
        items.push({ id: "tags", label: `/api/tags 返回 HTTP ${res.status}`, level: "FAIL" });
      }
    } else {
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(bodyText);
      } catch {
        parsed = null;
      }
      const looksOllama =
        !!parsed &&
        typeof parsed === "object" &&
        "models" in (parsed as Record<string, unknown>) &&
        Array.isArray((parsed as { models?: unknown }).models);

      if (!looksOllama) {
        isOllama = false;
        status = "NON_OLLAMA_RESPONSE";
        items.push({
          id: "tags",
          label: "端口可达，但响应不是 Ollama API",
          level: "FAIL",
          detail: ctype ? `Content-Type: ${ctype}` : "未返回 JSON 或缺少 models 字段",
        });
        suggestions.push(
          "请确认 Base URL 是否应为 http://localhost:11434；不要把其他本地服务端口填入 Ollama Provider。",
        );
      } else {
        isOllama = true;
        items.push({ id: "tags", label: "接口 /api/tags 可访问（Ollama API）", level: "PASS" });
        const data = parsed as { models: Array<{ name: string }> };
        modelNames = data.models.map((m) => m.name);
        modelCount = modelNames.length;
      }
    }
  } catch (e) {
    rawErrorMessage = e instanceof Error ? e.message : String(e);
    const suspectCors = looksLikeCors(e);

    if (suspectCors) {
      // 区分：端口活着但被 CORS 拒，还是端口根本不通
      const alive = await probePortAlive(baseUrl);
      if (alive) {
        status = "TERMINAL_OK_BROWSER_BLOCKED";
        items.push({
          id: "tags",
          label: "终端可访问，但浏览器不可访问，疑似 OLLAMA_ORIGINS / CORS 限制",
          level: "FAIL",
          detail: rawErrorMessage,
        });
        if (currentOrigin) {
          items.push({
            id: "origin-hint",
            label: "需要在 OLLAMA_ORIGINS 中加入当前站点",
            level: "WARN",
            detail: currentOrigin,
          });
        }
      } else {
        status = "UNREACHABLE_PORT";
        items.push({
          id: "tags",
          label: "无法访问 /api/tags（端口不可达或服务未启动）",
          level: "FAIL",
          detail: rawErrorMessage,
        });
      }
    } else {
      status = "UNKNOWN_ERROR";
      items.push({
        id: "tags",
        label: "无法访问 /api/tags",
        level: "FAIL",
        detail: rawErrorMessage,
      });
    }
  }

  // 3. 模型层判断（仅当确实是 Ollama 时）
  if (isOllama) {
    if (modelCount === 0) {
      status = "NO_MODELS";
      items.push({ id: "models", label: "Ollama 已启动，但未发现已下载模型", level: "WARN" });
      suggestions.push(`下载推荐模型：ollama pull ${defaultModel}`);
    } else {
      items.push({
        id: "models",
        label: `已发现 ${modelCount} 个模型`,
        level: "PASS",
        detail: modelNames.slice(0, 5).join("、") + (modelNames.length > 5 ? " …" : ""),
      });

      hasDefaultModel = modelNames.some(
        (n) => n === defaultModel || n.startsWith(defaultModel.split(":")[0] + ":"),
      );
      items.push({
        id: "default-model",
        label: hasDefaultModel ? `默认模型「${defaultModel}」可用` : `默认模型「${defaultModel}」未下载`,
        level: hasDefaultModel ? "PASS" : "WARN",
      });

      if (hasDefaultModel) {
        status = "READY";
      } else {
        status = "MODEL_NOT_FOUND";
        suggestions.push(`下载默认模型：ollama pull ${defaultModel}`);
      }
    }
  }

  // 4. 各状态对应的建议（Windows PowerShell 优先）
  const originsValue = buildOllamaOriginsValue(currentOrigin);
  const hostPort = extractHostPort(baseUrl);
  switch (status) {
    case "UNREACHABLE_PORT":
      suggestions.unshift("在 PowerShell 中执行：ollama serve");
      suggestions.push(`Windows PowerShell 测试：curl.exe ${baseUrl}/api/tags`);
      suggestions.push("请勿使用 PowerShell 内置 curl（它是 Invoke-WebRequest 别名，可能误把响应当 HTML 解析）。");
      break;
    case "NON_OLLAMA_RESPONSE":
      suggestions.unshift("将 Base URL 改回 http://localhost:11434，或确认该端口运行的就是 Ollama。");
      break;
    case "TERMINAL_OK_BROWSER_BLOCKED":
    case "CORS_ORIGIN_BLOCKED":
      suggestions.unshift(
        `Windows PowerShell（永久）：[Environment]::SetEnvironmentVariable("OLLAMA_ORIGINS", "${originsValue}", "User")`,
      );
      suggestions.push(
        `Windows PowerShell（同时锁定监听地址）：[Environment]::SetEnvironmentVariable("OLLAMA_HOST", "${hostPort}", "User")`,
      );
      suggestions.push("设置后请重启 Ollama（关闭 ollama serve 进程并重新启动）。");
      suggestions.push(`macOS / Linux：OLLAMA_ORIGINS="${originsValue}" ollama serve`);
      break;
    case "NO_MODELS":
      suggestions.unshift(`执行 ollama pull ${defaultModel} 下载一个模型`);
      break;
    case "MODEL_NOT_FOUND":
      break;
    case "READY":
      break;
    default:
      suggestions.push("查看下方「技术详情」中的原始错误信息。");
  }

  // 5. 降级提示
  if (status !== "READY") {
    items.push({
      id: "fallback",
      label: "Aetherworld 已自动保持 WebLLM / 规则模式可用，对话不会因此中断",
      level: "INFO",
    });
  }

  const meta = STATUS_META[status];

  return {
    ok: status === "READY",
    status,
    statusTitle: meta.title,
    statusDescription: meta.description,
    baseUrl,
    reachable,
    isOllama,
    modelCount,
    hasDefaultModel,
    rawErrorMessage,
    rawResponsePreview,
    items,
    suggestions,
    commands: buildCommands(baseUrl, defaultModel, currentOrigin),
    currentOrigin,
  };
}
