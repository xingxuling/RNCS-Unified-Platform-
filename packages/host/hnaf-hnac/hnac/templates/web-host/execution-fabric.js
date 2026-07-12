const enc = new TextEncoder();
const clone = (v) => structuredClone(v);
const sortObject = (value) => Array.isArray(value)
  ? value.map(sortObject)
  : (value && typeof value === 'object'
      ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortObject(value[key])]))
      : value);
const canonicalText = (value) => JSON.stringify(sortObject(value));
const hex = (buffer) => [...new Uint8Array(buffer)].map((v) => v.toString(16).padStart(2, '0')).join('');
const hash = async (value) => hex(await crypto.subtle.digest('SHA-256', enc.encode(canonicalText(value))));
const fromB64 = (text) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
const safeJson = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return {text}; }
};

export async function verifyProviderRegistry(providerDoc, requireSigned = true) {
  const providers = Array.isArray(providerDoc) ? providerDoc : providerDoc?.providers;
  if (!Array.isArray(providers)) throw new Error('Provider registry must contain providers[]');
  const verified = [];
  const unsigned = [];
  for (const provider of providers) {
    for (const capability of provider.capabilities ?? []) {
      const supply = capability.supply_chain;
      if (!supply) {
        unsigned.push(`${provider.provider_id}/${capability.capability_id}`);
        continue;
      }
      if (supply.algorithm !== 'ed25519') throw new Error(`Unsupported Provider signature: ${supply.algorithm}`);
      const raw = clone(capability); delete raw.supply_chain;
      const signedRoot = await hash(raw);
      if (signedRoot !== supply.signed_root) throw new Error(`Provider descriptor root mismatch: ${capability.capability_id}`);
      let key;
      try {
        key = await crypto.subtle.importKey('raw', fromB64(supply.public_key_b64), {name:'Ed25519'}, false, ['verify']);
      } catch (error) {
        throw new Error(`Browser cannot verify Ed25519 Provider signatures: ${error.message}`);
      }
      const ok = await crypto.subtle.verify({name:'Ed25519'}, key, fromB64(supply.signature_b64), enc.encode(signedRoot));
      if (!ok) throw new Error(`Provider signature rejected: ${capability.capability_id}`);
      verified.push(`${provider.provider_id}/${capability.capability_id}`);
    }
  }
  if (requireSigned && unsigned.length) throw new Error(`Unsigned Providers rejected: ${unsigned.join(', ')}`);
  return {verified, unsigned, verification_root: await hash({verified:[...verified].sort(), unsigned:[...unsigned].sort()})};
}

function timeoutSignal(timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('Provider timed out')), timeoutMs);
  return {signal: controller.signal, stop: () => clearTimeout(timer)};
}
function allowedHost(url, policy) {
  const host = new URL(url, location.href).hostname;
  const allowed = policy?.sandbox?.allowed_network_hosts ?? [];
  if (!allowed.includes(host)) throw new Error(`Network host denied by sandbox: ${host}`);
}
function executeBuiltin(step, manifest, payload) {
  const handler = step.transport?.handler;
  if (handler === 'fail') throw new Error('Provider declared deterministic failure');
  if (handler === 'echo') return {echo: clone(payload)};
  if (handler === 'capsule.inspect') return {app:manifest.app, format_version:manifest.format_version, capability_binding:manifest.capability_binding};
  if (handler === 'state.increment') {
    const key = String(payload.key ?? 'counter');
    const amount = Number(payload.amount ?? 1);
    const storageKey = `hnaf:v0.8:${manifest.app.id}:${key}`;
    const before = Number(localStorage.getItem(storageKey) ?? 0);
    const after = before + amount;
    localStorage.setItem(storageKey, String(after));
    return {key, before, after, amount};
  }
  throw new Error(`Browser host does not implement builtin handler: ${handler}`);
}
async function executeHttp(step, payload, context, policy) {
  const url = String(step.transport?.url ?? '');
  allowedHost(url, policy);
  const guard = timeoutSignal(Number(policy.timeout_ms ?? 5000));
  try {
    const response = await fetch(url, {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({payload, context}), signal:guard.signal});
    const result = await safeJson(response);
    if (!response.ok) throw new Error(`HTTP Provider ${response.status}: ${JSON.stringify(result)}`);
    return result;
  } finally { guard.stop(); }
}
async function executeWebSocket(step, payload, context, policy) {
  const url = String(step.transport?.url ?? '');
  allowedHost(url, policy);
  const timeoutMs = Number(policy.timeout_ms ?? 5000);
  return await new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    const timer = setTimeout(() => { socket.close(); reject(new Error('WebSocket Provider timed out')); }, timeoutMs);
    socket.onopen = () => socket.send(JSON.stringify({payload, context}));
    socket.onmessage = (event) => { clearTimeout(timer); socket.close(); try { resolve(JSON.parse(event.data)); } catch { resolve({text:String(event.data)}); } };
    socket.onerror = () => { clearTimeout(timer); reject(new Error('WebSocket Provider failed')); };
  });
}
async function executeGateway(step, payload, context, policy, gatewayUrl) {
  const endpoint = String(step.transport?.endpoint ?? gatewayUrl ?? '');
  if (!endpoint) throw new Error('Gateway Provider is missing endpoint');
  allowedHost(endpoint, policy);
  const root = endpoint.replace(/\/$/, '');
  const url = root.endsWith('/api') ? `${root}/invoke` : `${root}/api/invoke`;
  const guard = timeoutSignal(Number(policy.timeout_ms ?? 5000));
  try {
    const response = await fetch(url, {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({runtime_id:step.transport.runtime_id, action:step.transport.action, payload}), signal:guard.signal});
    const result = await safeJson(response);
    if (!response.ok || result?.error) throw new Error(`Gateway Provider failed: ${result?.error?.message ?? response.status}`);
    return result;
  } finally { guard.stop(); }
}
async function executeStep(step, manifest, payload, context, policy, gatewayUrl) {
  const kind = String(step.transport?.kind ?? '');
  const allowed = policy.allowed_transports ?? [];
  if (!allowed.includes(kind)) throw new Error(`Transport denied by execution policy: ${kind}`);
  if (kind === 'hnaf-builtin' || kind === 'local') return executeBuiltin(step, manifest, payload);
  if (kind === 'http') return executeHttp(step, payload, context, policy);
  if (kind === 'websocket') return executeWebSocket(step, payload, context, policy);
  if (kind === 'reality-one-gateway') return executeGateway(step, payload, context, policy, gatewayUrl);
  if (kind === 'stdio' || kind === 'local-process') throw new Error(`${kind} is unavailable inside a browser sandbox; use Desktop/Pocket native host`);
  throw new Error(`Unsupported Provider transport: ${kind}`);
}

export async function executeBrowserProviderChain({steps, manifest, payload, policy, idempotencyKey, gatewayUrl, emit = () => {}}) {
  const ledgerKey = `hnaf:v0.8:idempotency:${manifest.app.id}:${idempotencyKey}`;
  const cached = localStorage.getItem(ledgerKey);
  if (cached) return {...JSON.parse(cached), status:'idempotent-replay', idempotent_replay:true};
  const attempts = [];
  const retries = Math.max(0, Number(policy.max_retries ?? 0));
  const context = {idempotency_key:idempotencyKey, app_id:manifest.app.id, host:'browser', issued_at:new Date().toISOString()};
  for (const step of steps) {
    for (let retry = 0; retry <= retries; retry += 1) {
      const started = performance.now();
      try {
        emit({phase:'provider.execute', provider_id:step.provider_id, transport:step.transport?.kind, retry});
        const result = await executeStep(step, manifest, payload, context, policy, gatewayUrl);
        attempts.push({provider_id:step.provider_id, capability_id:step.capability_id, transport:clone(step.transport), retry_index:retry, status:'succeeded', duration_ms:Math.round(performance.now()-started), result_root:await hash(result)});
        const out = {status:'executed', selected:step, result, attempts, idempotency_key:idempotencyKey, idempotent_replay:false};
        localStorage.setItem(ledgerKey, JSON.stringify(out));
        return out;
      } catch (error) {
        attempts.push({provider_id:step.provider_id, capability_id:step.capability_id, transport:clone(step.transport), retry_index:retry, status:'failed', duration_ms:Math.round(performance.now()-started), error:{type:error.name ?? 'Error', message:error.message}});
      }
    }
  }
  return {status:'failed', selected:null, result:null, attempts, idempotency_key:idempotencyKey, idempotent_replay:false};
}
