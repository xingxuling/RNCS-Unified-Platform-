import fs from 'node:fs';
import path from 'node:path';
import { DMLError, hash } from './canonical.mjs';

function ensureDir(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
}

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

function writeJson(file, value) {
  ensureDir(file);
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temp, file);
}

function trimSlash(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function maskSecret(value) {
  const text = String(value || '');
  if (!text) return '';
  if (text.length <= 8) return '••••••••';
  return `${text.slice(0, 3)}••••${text.slice(-3)}`;
}

function extractJson(text) {
  const raw = String(text || '').trim();
  try { return JSON.parse(raw); } catch {}
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    try { return JSON.parse(fenced[1].trim()); } catch {}
  }
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try { return JSON.parse(raw.slice(start, end + 1)); } catch {}
  }
  throw new DMLError('COGNITIVE_JSON_INVALID', raw.slice(0, 600));
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 30_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') throw new DMLError('COGNITIVE_PROVIDER_TIMEOUT', `${timeoutMs}ms`);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export class CognitiveProvider {
  constructor({ stateDir, complete = null } = {}) {
    this.stateDir = path.resolve(stateDir || 'state');
    this.configFile = path.join(this.stateDir, 'cognitive', 'provider.json');
    this.injectedComplete = complete;
    this.lastDiscovery = null;
    this.config = {
      provider: 'auto',
      base_url: '',
      model: '',
      api_key: '',
      temperature: 0.2,
      max_tokens: 2048,
      timeout_ms: 120_000,
      ...readJson(this.configFile, {}),
    };
  }

  publicConfig() {
    return {
      provider: this.config.provider || 'auto',
      base_url: this.config.base_url || '',
      model: this.config.model || '',
      api_key_set: Boolean(this.config.api_key || process.env.DML_OPENAI_API_KEY),
      api_key_masked: maskSecret(this.config.api_key || process.env.DML_OPENAI_API_KEY),
      temperature: Number(this.config.temperature ?? 0.2),
      max_tokens: Number(this.config.max_tokens ?? 2048),
      timeout_ms: Number(this.config.timeout_ms ?? 120_000),
      last_discovery: this.lastDiscovery,
    };
  }

  saveConfig(input = {}) {
    const provider = String(input.provider || this.config.provider || 'auto');
    if (!['auto', 'ollama', 'openai-compatible', 'none'].includes(provider)) {
      throw new DMLError('COGNITIVE_PROVIDER_UNSUPPORTED', provider);
    }
    this.config = {
      ...this.config,
      provider,
      base_url: input.base_url !== undefined ? trimSlash(input.base_url) : this.config.base_url,
      model: input.model !== undefined ? String(input.model || '').trim() : this.config.model,
      api_key: input.api_key === '__KEEP__' || input.api_key === undefined ? this.config.api_key : String(input.api_key || ''),
      temperature: input.temperature !== undefined ? Number(input.temperature) : this.config.temperature,
      max_tokens: input.max_tokens !== undefined ? Number(input.max_tokens) : this.config.max_tokens,
      timeout_ms: input.timeout_ms !== undefined ? Number(input.timeout_ms) : this.config.timeout_ms,
      updated_at: new Date().toISOString(),
    };
    writeJson(this.configFile, this.config);
    return this.publicConfig();
  }

  async discoverOllama() {
    const baseUrl = trimSlash(this.config.provider === 'ollama' && this.config.base_url
      ? this.config.base_url
      : process.env.DML_OLLAMA_URL || 'http://127.0.0.1:11434');
    try {
      const response = await fetchWithTimeout(`${baseUrl}/api/tags`, {}, 2500);
      if (!response.ok) return null;
      const body = await response.json();
      const models = Array.isArray(body.models) ? body.models.map((item) => item.name || item.model).filter(Boolean) : [];
      if (!models.length) return null;
      const requested = this.config.model || process.env.DML_OLLAMA_MODEL || '';
      const model = requested && models.includes(requested) ? requested : requested || models[0];
      return { kind: 'ollama', base_url: baseUrl, model, models };
    } catch {
      return null;
    }
  }

  openAIConfig() {
    const baseUrl = trimSlash(this.config.base_url || process.env.DML_OPENAI_BASE_URL || '');
    const apiKey = String(this.config.api_key || process.env.DML_OPENAI_API_KEY || '');
    const model = String(this.config.model || process.env.DML_OPENAI_MODEL || '');
    if (!baseUrl || !apiKey || !model) return null;
    return { kind: 'openai-compatible', base_url: baseUrl, api_key: apiKey, model };
  }

  async discover() {
    if (this.injectedComplete) {
      this.lastDiscovery = { available: true, kind: 'injected', model: 'test-provider', checked_at: new Date().toISOString() };
      return this.lastDiscovery;
    }
    const requested = this.config.provider || 'auto';
    if (requested === 'none') {
      this.lastDiscovery = { available: false, kind: 'none', reason: '模型 Provider 已关闭', checked_at: new Date().toISOString() };
      return this.lastDiscovery;
    }
    if (requested === 'ollama' || requested === 'auto') {
      const ollama = await this.discoverOllama();
      if (ollama) {
        this.lastDiscovery = { available: true, ...ollama, checked_at: new Date().toISOString() };
        return this.lastDiscovery;
      }
      if (requested === 'ollama') {
        this.lastDiscovery = { available: false, kind: 'ollama', reason: '未发现正在运行且包含模型的 Ollama', checked_at: new Date().toISOString() };
        return this.lastDiscovery;
      }
    }
    const openai = this.openAIConfig();
    if (openai) {
      this.lastDiscovery = { available: true, kind: openai.kind, base_url: openai.base_url, model: openai.model, checked_at: new Date().toISOString() };
      return this.lastDiscovery;
    }
    this.lastDiscovery = {
      available: false,
      kind: requested,
      reason: '未配置可用的 Ollama 或 OpenAI 兼容模型',
      checked_at: new Date().toISOString(),
    };
    return this.lastDiscovery;
  }

  async complete(messages, { json = false, temperature = null, max_tokens = null } = {}) {
    if (this.injectedComplete) return this.injectedComplete(messages, { json, temperature, max_tokens });
    const discovered = await this.discover();
    if (!discovered.available) throw new DMLError('COGNITIVE_PROVIDER_REQUIRED', discovered.reason || '模型 Provider 不可用');
    if (discovered.kind === 'ollama') {
      const response = await fetchWithTimeout(`${discovered.base_url}/api/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: discovered.model,
          messages,
          stream: false,
          ...(json ? { format: 'json' } : {}),
          options: {
            temperature: Number(temperature ?? this.config.temperature ?? 0.2),
            num_ctx: Number(process.env.DML_COGNITIVE_CONTEXT || 32768),
          },
        }),
      }, Number(this.config.timeout_ms || 120_000));
      if (!response.ok) throw new DMLError('COGNITIVE_OLLAMA_FAILED', `${response.status} ${await response.text()}`);
      const body = await response.json();
      const content = body.message?.content || body.response || '';
      return {
        content,
        json: json ? extractJson(content) : null,
        provider: 'ollama',
        model: discovered.model,
        receipt_root: hash({ provider: 'ollama', model: discovered.model, content, at: new Date().toISOString() }),
      };
    }
    const config = this.openAIConfig();
    if (!config) throw new DMLError('COGNITIVE_PROVIDER_REQUIRED', 'OpenAI 兼容 Provider 配置不完整');
    const body = {
      model: config.model,
      messages,
      temperature: Number(temperature ?? this.config.temperature ?? 0.2),
      max_tokens: Number(max_tokens ?? this.config.max_tokens ?? 2048),
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    };
    let response = await fetchWithTimeout(`${config.base_url}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${config.api_key}` },
      body: JSON.stringify(body),
    }, Number(this.config.timeout_ms || 120_000));
    if (!response.ok && json && [400, 422].includes(response.status)) {
      delete body.response_format;
      response = await fetchWithTimeout(`${config.base_url}/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${config.api_key}` },
        body: JSON.stringify(body),
      }, Number(this.config.timeout_ms || 120_000));
    }
    if (!response.ok) throw new DMLError('COGNITIVE_OPENAI_FAILED', `${response.status} ${await response.text()}`);
    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content || '';
    return {
      content,
      json: json ? extractJson(content) : null,
      provider: 'openai-compatible',
      model: config.model,
      receipt_root: hash({ provider: 'openai-compatible', model: config.model, content, at: new Date().toISOString() }),
    };
  }

  async test() {
    const discovery = await this.discover();
    if (!discovery.available) return { ok: false, ...discovery };
    const reply = await this.complete([
      { role: 'system', content: '只回复“连接成功”。' },
      { role: 'user', content: '测试连接' },
    ]);
    return {
      ok: true,
      provider: reply.provider,
      model: reply.model,
      reply: reply.content.slice(0, 200),
      receipt_root: reply.receipt_root,
    };
  }
}
