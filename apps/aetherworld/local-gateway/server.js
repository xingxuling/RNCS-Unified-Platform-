// Aether Local Gateway - 最小可运行版本（v0.1）
// 仅做：Ollama 自动发现、状态检测、模型列表、聊天请求转发。
// 不执行 Shell；不读写全盘文件；不上传用户数据。
import express from "express";
import cors from "cors";

const PORT = parseInt(process.env.PORT || "18777", 10);
const ALLOWED = (process.env.ALLOWED_ORIGINS ||
  "https://aetherforecast.com,https://www.aetherforecast.com,http://localhost:*,http://127.0.0.1:*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const OLLAMA_CANDIDATES = [
  process.env.OLLAMA_BASE_URL,
  "http://localhost:11434",
  "http://localhost:11435",
  "http://127.0.0.1:11434",
  "http://127.0.0.1:11435",
].filter(Boolean);

let activeOllamaBaseUrl = "";
let lastModels = [];

function originAllowed(origin) {
  if (!origin) return true;
  return ALLOWED.some((pat) => {
    if (pat === "*") return true;
    if (pat.endsWith("*")) return origin.startsWith(pat.slice(0, -1));
    return origin === pat;
  });
}

async function probe(baseUrl) {
  const url = baseUrl.replace(/\/$/, "") + "/api/tags";
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return { ok: false };
    const data = await res.json();
    if (!Array.isArray(data?.models)) return { ok: false };
    return { ok: true, models: data.models.map((m) => m.name) };
  } catch {
    return { ok: false };
  }
}

async function discoverOllama() {
  for (const url of OLLAMA_CANDIDATES) {
    const r = await probe(url);
    if (r.ok) {
      activeOllamaBaseUrl = url;
      lastModels = r.models;
      return { ok: true, baseUrl: url, models: r.models };
    }
  }
  activeOllamaBaseUrl = "";
  lastModels = [];
  return { ok: false, models: [] };
}

// 极简 secret 模式：避免把明显的密钥转发给模型
const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9]{16,}/g,
  /ghp_[A-Za-z0-9]{20,}/g,
  /Bearer\s+[A-Za-z0-9._-]{16,}/gi,
  /xox[baprs]-[A-Za-z0-9-]{8,}/g,
];
function redact(text) {
  let out = text || "";
  for (const re of SECRET_PATTERNS) out = out.replace(re, "[REDACTED]");
  return out;
}

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(
  cors({
    origin: (origin, cb) => cb(null, originAllowed(origin)),
    credentials: false,
  }),
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", version: "0.1", gatewayName: "Aether Local Gateway" });
});

app.get("/api/local/status", async (_req, res) => {
  if (!activeOllamaBaseUrl) await discoverOllama();
  if (!activeOllamaBaseUrl) {
    return res.json({
      gateway: "GATEWAY_READY",
      ollama: "OLLAMA_NOT_FOUND",
      activeProvider: "none",
      activeBaseUrl: "",
      models: [],
      version: "0.1",
    });
  }
  return res.json({
    gateway: "GATEWAY_READY",
    ollama: "OLLAMA_READY",
    activeProvider: "ollama",
    activeBaseUrl: activeOllamaBaseUrl,
    models: lastModels,
    version: "0.1",
  });
});

app.get("/api/local/models", async (_req, res) => {
  if (!activeOllamaBaseUrl) await discoverOllama();
  res.json({
    provider: activeOllamaBaseUrl ? "ollama" : "none",
    baseUrl: activeOllamaBaseUrl,
    models: lastModels,
  });
});

app.post("/api/local/ollama/discover", async (_req, res) => {
  const r = await discoverOllama();
  const message = r.ok
    ? `已发现 Ollama：${r.baseUrl}`
    : "未在常见端口发现 Ollama（11434 / 11435）。请确认 ollama serve 是否已启动。";
  res.json({ ok: r.ok, baseUrl: r.baseUrl, models: r.models, message });
});

app.post("/api/local/chat", async (req, res) => {
  try {
    const { model, messages, temperature, maxTokens } = req.body || {};
    if (!model || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "缺少 model 或 messages。" });
    }
    if (!activeOllamaBaseUrl) await discoverOllama();
    if (!activeOllamaBaseUrl) {
      return res.status(503).json({ error: "未发现可用的本地 Ollama 服务。" });
    }
    const safeMessages = messages.map((m) => ({
      role: m.role,
      content: redact(typeof m.content === "string" ? m.content : ""),
    }));
    const body = {
      model,
      messages: safeMessages,
      stream: false,
      options: {
        ...(typeof temperature === "number" ? { temperature } : {}),
        ...(typeof maxTokens === "number" ? { num_predict: maxTokens } : {}),
      },
    };
    const r = await fetch(activeOllamaBaseUrl.replace(/\/$/, "") + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const text = await r.text();
      return res.status(502).json({ error: `Ollama HTTP ${r.status}`, detail: text.slice(0, 500) });
    }
    const data = await r.json();
    res.json({
      model,
      content: data?.message?.content || "",
      usage: data?.eval_count ? { evalCount: data.eval_count } : undefined,
      safetyNotes: ["来源：本地网关 / Ollama"],
      source: `ollama@${activeOllamaBaseUrl}`,
    });
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`[aether-local-gateway] 正在监听 http://localhost:${PORT}`);
  discoverOllama().then((r) => {
    if (r.ok) console.log(`[aether-local-gateway] 已发现 Ollama：${r.baseUrl}（${r.models.length} 个模型）`);
    else console.log("[aether-local-gateway] 未发现 Ollama，可稍后点击「自动发现 Ollama」或执行 `ollama serve`。");
  });
});
