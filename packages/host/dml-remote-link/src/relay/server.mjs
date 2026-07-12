import http from 'node:http';
import { URL } from 'node:url';
import { makeQueuedAction, verifyExecutionReceipt } from '../shared/protocol.mjs';
import { now, RemoteLinkError, sleep } from '../shared/canonical.mjs';
import { verifyBrowserRequest, verifyRequest } from '../shared/crypto.mjs';
import { issueBrowserGrant, riskAllows, scopeAllows, verifyBrowserGrant } from '../shared/grant.mjs';
import { RelayStore } from './store.mjs';

const MAX_BODY_BYTES = 1024 * 1024;
const REQUEST_CLOCK_SKEW_MS = 5 * 60 * 1000;

function json(response, status, value, headers = {}) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...headers,
  });
  response.end(`${JSON.stringify(value)}\n`);
}

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new RemoteLinkError('BODY_TOO_LARGE', 'Request body exceeds 1 MiB', 413);
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function bearer(request) {
  const value = String(request.headers.authorization || '');
  const match = /^Bearer\s+(.+)$/i.exec(value);
  return match?.[1] || '';
}

function getSessionPath(pathname) {
  const match = /^\/v1\/sessions\/([^/]+)(\/.*)?$/.exec(pathname);
  if (!match) return null;
  return { sessionId: decodeURIComponent(match[1]), tail: match[2] || '/' };
}

function allowedOrigin(origin, allowlist) {
  if (!origin) return true;
  return allowlist.has('*') || allowlist.has(origin);
}

function corsHeaders(origin, allowlist) {
  if (!origin || !allowedOrigin(origin, allowlist)) return {};
  return {
    'access-control-allow-origin': allowlist.has('*') ? '*' : origin,
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': [
      'Authorization',
      'Content-Type',
      'X-DML-Host-ID',
      'X-DML-Timestamp',
      'X-DML-Nonce',
      'X-DML-Signature',
      'X-DML-Device-ID',
      'X-DML-Device-Signature',
    ].join(','),
    'access-control-max-age': '600',
    vary: 'Origin',
  };
}

class MemoryRateLimiter {
  constructor({ windowMs = 60_000, browserLimit = 180, hostLimit = 600, authLimit = 30 } = {}) {
    this.windowMs = windowMs;
    this.browserLimit = browserLimit;
    this.hostLimit = hostLimit;
    this.authLimit = authLimit;
    this.entries = new Map();
  }

  check(key, kind) {
    const nowMs = Date.now();
    const item = this.entries.get(key);
    const limit = kind === 'host' ? this.hostLimit : kind === 'auth' ? this.authLimit : this.browserLimit;
    if (!item || nowMs - item.startedAt >= this.windowMs) {
      this.entries.set(key, { startedAt: nowMs, count: 1 });
      return;
    }
    item.count += 1;
    if (item.count > limit) throw new RemoteLinkError('RATE_LIMITED', 'Too many requests', 429);
  }
}

export function createRelayServer({
  stateDir = 'state/relay',
  allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'],
  host = '127.0.0.1',
  port = 17901,
  actionTtlMs = 300_000,
  accessGrantTtlMs = 10 * 60 * 1000,
  allowLegacyBrowserTokens = false,
} = {}) {
  const store = new RelayStore(stateDir);
  const allowlist = new Set(allowedOrigins);
  const sseClients = new Map();
  const limiter = new MemoryRateLimiter();

  function broadcast(sessionId, event, data, eventId = null) {
    const clients = sseClients.get(sessionId);
    if (!clients?.size) return;
    const frame = `${eventId ? `id: ${eventId}\n` : ''}event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const response of clients) response.write(frame);
  }

  function issueGrant(sessionId, device, origin) {
    return issueBrowserGrant({
      sessionId,
      device,
      origin,
      privateKeyPem: store.privateKeyPem(),
      ttlMs: accessGrantTtlMs,
    });
  }

  function authenticateBrowser(request, sessionId, origin, requiredScope = 'dml.read', requestedRisk = 'low') {
    limiter.check(`browser:${sessionId}:${request.socket.remoteAddress || 'unknown'}`, 'browser');
    const token = bearer(request);
    let grant;
    try {
      grant = verifyBrowserGrant(token, store.publicKeyPem(), sessionId);
    } catch (error) {
      if (!allowLegacyBrowserTokens) throw error;
      grant = store.verifyLegacyBrowserToken(sessionId, token);
      if (!grant) throw error;
    }
    if (store.isGrantRevoked(sessionId, grant.grant_id)) {
      throw new RemoteLinkError('GRANT_REVOKED', 'Browser grant has been revoked', 401);
    }
    if (grant.device_id !== 'legacy-browser-token') {
      const device = store.device(sessionId, grant.device_id);
      if (origin && grant.origin !== origin) throw new RemoteLinkError('GRANT_ORIGIN_MISMATCH', 'Browser grant cannot be used from this origin', 403);
      if (origin && device.origin !== origin) throw new RemoteLinkError('DEVICE_ORIGIN_MISMATCH', 'Browser device is bound to another origin', 403);
      store.touchDevice(sessionId, grant.device_id);
    }
    if (!scopeAllows(grant.scopes, requiredScope)) {
      throw new RemoteLinkError('GRANT_SCOPE_DENIED', `Browser grant does not allow ${requiredScope}`, 403);
    }
    if (!riskAllows(grant.risk_limit, requestedRisk)) {
      throw new RemoteLinkError('GRANT_RISK_EXCEEDED', `Browser grant risk limit is ${grant.risk_limit}`, 403);
    }
    return grant;
  }

  async function authenticateSignedDevice(request, sessionId, origin, url, body = '') {
    limiter.check(`device:${sessionId}:${request.socket.remoteAddress || 'unknown'}`, 'auth');
    const deviceId = String(request.headers['x-dml-device-id'] || '');
    const timestamp = String(request.headers['x-dml-timestamp'] || '');
    const nonce = String(request.headers['x-dml-nonce'] || '');
    const signature = String(request.headers['x-dml-device-signature'] || '');
    const device = store.device(sessionId, deviceId);
    if (origin && device.origin !== origin) throw new RemoteLinkError('DEVICE_ORIGIN_MISMATCH', 'Browser device is bound to another origin', 403);
    const timeMs = Number(timestamp);
    if (!Number.isFinite(timeMs) || Math.abs(Date.now() - timeMs) > REQUEST_CLOCK_SKEW_MS) {
      throw new RemoteLinkError('DEVICE_TIMESTAMP_INVALID', 'Browser clock is outside accepted range', 401);
    }
    if (!nonce || nonce.length < 16) throw new RemoteLinkError('DEVICE_NONCE_INVALID', 'Invalid browser nonce', 401);
    const verified = verifyBrowserRequest(device.public_key_jwk, {
      method: request.method,
      pathWithQuery: `${url.pathname}${url.search}`,
      timestamp,
      nonce,
      body,
    }, signature);
    if (!verified) throw new RemoteLinkError('DEVICE_SIGNATURE_INVALID', 'Invalid browser device signature', 401);
    store.rememberNonce(sessionId, nonce, timestamp, 600_000, `device:${deviceId}`);
    return store.touchDevice(sessionId, deviceId);
  }

  async function authenticateHost(request, sessionId, url, body = '') {
    limiter.check(`host:${sessionId}:${request.socket.remoteAddress || 'unknown'}`, 'host');
    const hostInfo = store.host(sessionId);
    const hostId = String(request.headers['x-dml-host-id'] || '');
    const timestamp = String(request.headers['x-dml-timestamp'] || '');
    const nonce = String(request.headers['x-dml-nonce'] || '');
    const signature = String(request.headers['x-dml-signature'] || '');
    if (!hostId || hostId !== hostInfo.host_id) throw new RemoteLinkError('HOST_ID_INVALID', 'Invalid host ID', 401);
    const timeMs = Number(timestamp);
    if (!Number.isFinite(timeMs) || Math.abs(Date.now() - timeMs) > REQUEST_CLOCK_SKEW_MS) {
      throw new RemoteLinkError('HOST_TIMESTAMP_INVALID', 'Host clock is outside accepted range', 401);
    }
    if (!nonce || nonce.length < 16) throw new RemoteLinkError('HOST_NONCE_INVALID', 'Invalid nonce', 401);
    const verified = verifyRequest(hostInfo.public_key_pem, {
      method: request.method,
      pathWithQuery: `${url.pathname}${url.search}`,
      timestamp,
      nonce,
      body,
    }, signature);
    if (!verified) throw new RemoteLinkError('HOST_SIGNATURE_INVALID', 'Invalid host signature', 401);
    store.rememberNonce(sessionId, nonce, timestamp, 600_000, `host:${hostId}`);
    return hostInfo;
  }

  const server = http.createServer(async (request, response) => {
    const origin = String(request.headers.origin || '');
    const cors = corsHeaders(origin, allowlist);
    try {
      if (origin && !allowedOrigin(origin, allowlist)) throw new RemoteLinkError('ORIGIN_DENIED', 'Origin is not allowed', 403);
      if (request.method === 'OPTIONS') {
        response.writeHead(204, cors);
        response.end();
        return;
      }

      const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
      if (request.method === 'GET' && url.pathname === '/health') {
        return json(response, 200, {
          status: 'ok',
          protocol: 'dml.secure-relay.v0.3',
          time: now(),
          relay_public_key_pem: store.publicKeyPem(),
          browser_auth: 'one-time-code+device-bound-short-grant',
        }, cors);
      }

      const parsedPath = getSessionPath(url.pathname);
      if (!parsedPath) throw new RemoteLinkError('NOT_FOUND', 'Route not found', 404);
      const { sessionId, tail } = parsedPath;

      if (request.method === 'POST' && tail === '/host/pair') {
        const raw = await readBody(request);
        const body = JSON.parse(raw || '{}');
        const hostInfo = store.pairHost(sessionId, {
          pairCode: body.pair_code,
          hostId: body.host_id,
          publicKeyPem: body.host_public_key_pem,
          metadata: body.metadata || {},
        });
        store.appendNotice(sessionId, 'host.paired', { host_id: hostInfo.host_id });
        return json(response, 200, {
          status: 'paired',
          session_id: sessionId,
          relay_public_key_pem: store.publicKeyPem(),
          protocol: 'dml.secure-relay.v0.3',
        }, cors);
      }

      if (tail.startsWith('/host/')) {
        const raw = request.method === 'POST' ? await readBody(request) : '';
        await authenticateHost(request, sessionId, url, raw);

        if (request.method === 'GET' && tail === '/host/actions') {
          const after = Number(url.searchParams.get('after') || 0);
          const waitSeconds = Math.min(25, Math.max(0, Number(url.searchParams.get('wait') || 0)));
          const deadline = Date.now() + waitSeconds * 1000;
          let actions = store.nextActions(sessionId, after);
          while (!actions.length && Date.now() < deadline) {
            await sleep(250);
            actions = store.nextActions(sessionId, after);
          }
          return json(response, 200, {
            format: 'dml.remote-action-batch.v0.3',
            session_id: sessionId,
            relay_public_key_pem: store.publicKeyPem(),
            actions,
            server_time: Date.now(),
          }, cors);
        }

        if (request.method === 'POST' && tail === '/host/result') {
          const receipt = JSON.parse(raw || '{}');
          const hostInfo = store.host(sessionId);
          verifyExecutionReceipt(receipt, hostInfo.public_key_pem, sessionId);
          const committed = store.commitResult(sessionId, receipt);
          if (!committed.duplicate && receipt.projection) {
            broadcast(sessionId, 'projection', receipt.projection, String(receipt.sequence));
          }
          broadcast(sessionId, 'receipt', {
            action_id: receipt.action_id,
            status: receipt.status,
            result_root: receipt.result_root,
          }, String(receipt.sequence));
          return json(response, 200, { status: committed.duplicate ? 'duplicate' : 'committed' }, cors);
        }

        if (request.method === 'POST' && tail === '/host/heartbeat') {
          const heartbeat = JSON.parse(raw || '{}');
          const hostInfo = store.updateHeartbeat(sessionId, heartbeat);
          if (heartbeat.projection) broadcast(sessionId, 'projection', heartbeat.projection);
          return json(response, 200, { status: 'ok', host: { ...hostInfo, public_key_pem: undefined } }, cors);
        }

        throw new RemoteLinkError('NOT_FOUND', 'Host route not found', 404);
      }

      if (request.method === 'POST' && tail === '/auth/exchange') {
        limiter.check(`auth-exchange:${sessionId}:${request.socket.remoteAddress || 'unknown'}`, 'auth');
        if (!origin) throw new RemoteLinkError('ORIGIN_REQUIRED', 'Browser origin is required', 400);
        const raw = await readBody(request);
        const body = JSON.parse(raw || '{}');
        const device = store.exchangeLoginCode(sessionId, {
          loginCode: body.login_code,
          deviceId: body.device_id,
          publicKeyJwk: body.public_key_jwk,
          origin,
          label: body.label,
        });
        const grant = issueGrant(sessionId, device, origin);
        return json(response, 200, {
          status: 'connected',
          session_id: sessionId,
          device_id: device.device_id,
          access_token: grant.token,
          grant: grant.payload,
          relay_public_key_pem: store.publicKeyPem(),
        }, cors);
      }

      if (request.method === 'POST' && tail === '/auth/refresh') {
        const raw = await readBody(request);
        const device = await authenticateSignedDevice(request, sessionId, origin, url, raw);
        const grant = issueGrant(sessionId, device, origin || device.origin);
        return json(response, 200, {
          status: 'refreshed',
          session_id: sessionId,
          device_id: device.device_id,
          access_token: grant.token,
          grant: grant.payload,
        }, cors);
      }

      if (request.method === 'GET' && tail === '/auth/devices') {
        authenticateBrowser(request, sessionId, origin, 'dml.auth.manage', 'low');
        return json(response, 200, { devices: store.listDevices(sessionId) }, cors);
      }

      if (request.method === 'POST' && tail === '/auth/revoke') {
        const grant = authenticateBrowser(request, sessionId, origin, 'dml.auth.manage', 'medium');
        const raw = await readBody(request);
        const body = JSON.parse(raw || '{}');
        const target = String(body.device_id || grant.device_id);
        store.revokeDevice(sessionId, target);
        store.revokeGrant(sessionId, grant.grant_id);
        return json(response, 200, { status: 'revoked', device_id: target }, cors);
      }

      if (request.method === 'GET' && tail === '/projection') {
        authenticateBrowser(request, sessionId, origin, 'dml.read', 'low');
        const session = store.getSession(sessionId);
        if (!session.projection) {
          return json(response, 200, {
            format: 'dml.workbench-projection.v0.1',
            projection_id: `projection:${sessionId}:waiting`,
            subject_id: 'subject:dml:blue-tianji-001',
            source_event_sequence: 0,
            generated_at: now(),
            state: {
              system: { paused: false, devices_online: session.host ? 1 : 0, risk_events: 0 },
              projects: {}, goals: {}, messages: [], files: [], artifacts: [], approvals: [], skills: [], learning: [], notices: [
                { type: 'relay.waiting', message: session.host ? '本机运行时正在同步' : '等待本机 DML Host 连接' },
              ],
            },
          }, cors);
        }
        return json(response, 200, session.projection, cors);
      }

      if (request.method === 'GET' && tail === '/status') {
        authenticateBrowser(request, sessionId, origin, 'dml.read', 'low');
        return json(response, 200, store.sessionStatus(sessionId), cors);
      }

      if (request.method === 'GET' && tail === '/events') {
        const grant = authenticateBrowser(request, sessionId, origin, 'dml.read', 'low');
        response.writeHead(200, {
          'content-type': 'text/event-stream; charset=utf-8',
          'cache-control': 'no-cache, no-store',
          connection: 'keep-alive',
          'x-accel-buffering': 'no',
          ...cors,
        });
        response.write(`event: ready\ndata: ${JSON.stringify({ session_id: sessionId, time: now(), grant_expires_at: grant.expires_at })}\n\n`);
        const session = store.getSession(sessionId);
        if (session.projection) response.write(`event: projection\ndata: ${JSON.stringify(session.projection)}\n\n`);
        if (!sseClients.has(sessionId)) sseClients.set(sessionId, new Set());
        sseClients.get(sessionId).add(response);
        const keepAlive = setInterval(() => response.write(`: keep-alive ${Date.now()}\n\n`), 15_000);
        const expiryDelay = Math.max(1_000, Date.parse(grant.expires_at) - Date.now());
        const expiry = setTimeout(() => response.end(), expiryDelay);
        request.on('close', () => {
          clearInterval(keepAlive);
          clearTimeout(expiry);
          sseClients.get(sessionId)?.delete(response);
        });
        return;
      }

      if (request.method === 'POST' && tail === '/intent') {
        const raw = await readBody(request);
        const body = JSON.parse(raw || '{}');
        const action = body.action || body;
        if (!action?.type) throw new RemoteLinkError('ACTION_REQUIRED', 'Semantic action is required');
        const requestedRisk = String(action.authority?.max_risk || 'medium');
        authenticateBrowser(request, sessionId, origin, String(action.type), requestedRisk);
        const session = store.getSession(sessionId);
        const sequence = Number(session.action_sequence || 0) + 1;
        const envelope = makeQueuedAction({
          sessionId,
          sequence,
          action,
          options: body.options || {},
          privateKeyPem: store.privateKeyPem(),
          ttlMs: actionTtlMs,
        });
        const queued = store.queueAction(sessionId, envelope);
        broadcast(sessionId, 'queue', {
          action_id: envelope.action_id,
          sequence: envelope.sequence,
          duplicate: queued.duplicate,
        }, String(envelope.sequence));
        return json(response, 202, {
          status: queued.duplicate ? 'duplicate' : 'accepted',
          queue: {
            action_id: envelope.action_id,
            sequence: envelope.sequence,
            queued_at: envelope.queued_at,
          },
          projection: session.projection,
        }, cors);
      }

      throw new RemoteLinkError('NOT_FOUND', 'Route not found', 404);
    } catch (error) {
      const normalized = error instanceof RemoteLinkError
        ? error
        : new RemoteLinkError(error.code || 'RELAY_ERROR', error.message || String(error), 500);
      json(response, normalized.status || 500, {
        error: { code: normalized.code, message: normalized.message },
      }, cors);
    }
  });

  return {
    server,
    store,
    listen() {
      return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, host, () => {
          server.off('error', reject);
          const address = server.address();
          resolve({
            host,
            port: typeof address === 'object' && address ? address.port : port,
            url: `http://${host}:${typeof address === 'object' && address ? address.port : port}`,
          });
        });
      });
    },
    close() {
      for (const clients of sseClients.values()) for (const client of clients) client.end();
      return new Promise((resolve) => server.close(resolve));
    },
  };
}
