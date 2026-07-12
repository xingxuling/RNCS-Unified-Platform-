import fs from 'node:fs';
import path from 'node:path';
import { clone, id, now, randomCode, randomToken, sha256, RemoteLinkError } from '../shared/canonical.mjs';
import { ensureEd25519KeyPair } from '../shared/crypto.mjs';

const DEFAULT_SCOPES = Object.freeze([
  'dml.read',
  'dml.auth.manage',
  'dml.goal.*',
  'dml.learning.*',
  'dml.skill.*',
  'dml.project.*',
  'dml.result.*',
  'dml.system.*',
  'dml.message.*',
]);

function atomicWrite(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temp, file);
  try { fs.chmodSync(file, 0o600); } catch {}
}

function cleanJwk(value) {
  if (!value || value.kty !== 'EC' || value.crv !== 'P-256' || !value.x || !value.y) {
    throw new RemoteLinkError('DEVICE_KEY_INVALID', 'A P-256 browser public key is required', 400);
  }
  return { kty: 'EC', crv: 'P-256', x: String(value.x), y: String(value.y), ext: true };
}

function pruneLoginCodes(session) {
  const current = Date.now();
  session.login_codes ||= {};
  for (const [hash, record] of Object.entries(session.login_codes)) {
    const expired = Date.parse(record.expires_at || '') <= current;
    const oldUsed = record.used_at && current - Date.parse(record.used_at) > 24 * 60 * 60 * 1000;
    if (expired || oldUsed) delete session.login_codes[hash];
  }
}

function migrateState(state) {
  state.format = 'dml.secure-relay-state.v0.3';
  state.nonces ||= {};
  state.sessions ||= {};
  for (const session of Object.values(state.sessions)) {
    session.login_codes ||= {};
    session.devices ||= {};
    session.revoked_grants ||= {};
    if (session.browser_token_hash && !session.legacy_browser_token_hash) {
      session.legacy_browser_token_hash = session.browser_token_hash;
    }
  }
  return state;
}

export class RelayStore {
  constructor(root = 'state/relay') {
    this.root = path.resolve(root);
    this.file = path.join(this.root, 'relay-state.json');
    this.keys = ensureEd25519KeyPair(path.join(this.root, 'keys'), 'relay');
    fs.mkdirSync(this.root, { recursive: true });
    if (!fs.existsSync(this.file)) {
      atomicWrite(this.file, {
        format: 'dml.secure-relay-state.v0.3',
        created_at: now(),
        sessions: {},
        nonces: {},
      });
    } else {
      const state = migrateState(JSON.parse(fs.readFileSync(this.file, 'utf8')));
      atomicWrite(this.file, state);
    }
  }

  read() {
    return migrateState(JSON.parse(fs.readFileSync(this.file, 'utf8')));
  }

  write(value) {
    atomicWrite(this.file, migrateState(value));
    return value;
  }

  mutate(fn) {
    const state = this.read();
    const result = fn(state);
    this.write(state);
    return result;
  }

  publicKeyPem() {
    return this.keys.publicKeyPem;
  }

  privateKeyPem() {
    return this.keys.privateKeyPem;
  }

  createSession({ name = '数字蓝天机', pairCode = randomCode(12), loginCodeTtlMs = 15 * 60 * 1000 } = {}) {
    const sessionId = id('session', { name, seed: randomToken(32), at: now() });
    const session = {
      session_id: sessionId,
      name,
      created_at: now(),
      pair_code_hash: sha256(pairCode),
      pair_code_used: false,
      host: null,
      action_sequence: 0,
      completed_sequence: 0,
      pending_actions: [],
      completed_actions: {},
      projection: null,
      projection_updated_at: null,
      event_sequence: 0,
      event_log: [],
      login_codes: {},
      devices: {},
      revoked_grants: {},
      legacy_browser_token_hash: null,
    };
    this.mutate((state) => { state.sessions[sessionId] = session; });
    const login = this.createLoginCode(sessionId, { ttlMs: loginCodeTtlMs, label: '首次浏览器配对' });
    return {
      session: this.getSession(sessionId),
      credentials: {
        browser_login_code: login.login_code,
        login_code_expires_at: login.expires_at,
        pair_code: pairCode,
        relay_public_key_pem: this.publicKeyPem(),
      },
    };
  }

  createLoginCode(sessionId, {
    ttlMs = 10 * 60 * 1000,
    scopes = [...DEFAULT_SCOPES],
    riskLimit = 'high',
    label = '浏览器设备',
  } = {}) {
    const code = randomCode(12);
    const createdAt = now();
    const expiresAt = new Date(Date.now() + Math.max(60_000, Number(ttlMs || 0))).toISOString();
    const codeHash = sha256(code);
    this.mutate((state) => {
      const session = state.sessions[sessionId];
      if (!session) throw new RemoteLinkError('SESSION_NOT_FOUND', 'Session not found', 404);
      pruneLoginCodes(session);
      session.login_codes[codeHash] = {
        code_hash: codeHash,
        created_at: createdAt,
        expires_at: expiresAt,
        used_at: null,
        label,
        scopes: [...new Set(scopes.map(String))],
        risk_limit: riskLimit,
      };
      this._appendEvent(session, 'browser.login_code_created', { expires_at: expiresAt, label });
    });
    return { login_code: code, expires_at: expiresAt, scopes, risk_limit: riskLimit, label };
  }

  exchangeLoginCode(sessionId, { loginCode, deviceId, publicKeyJwk, origin, label = '浏览器设备' }) {
    return this.mutate((state) => {
      const session = state.sessions[sessionId];
      if (!session) throw new RemoteLinkError('SESSION_NOT_FOUND', 'Session not found', 404);
      if (!origin) throw new RemoteLinkError('DEVICE_ORIGIN_REQUIRED', 'Browser origin is required', 400);
      if (!deviceId || String(deviceId).length < 8) throw new RemoteLinkError('DEVICE_ID_INVALID', 'Browser device ID is invalid', 400);
      pruneLoginCodes(session);
      const record = session.login_codes[sha256(loginCode || '')];
      if (!record) throw new RemoteLinkError('LOGIN_CODE_INVALID', 'Login code is invalid or expired', 401);
      if (record.used_at) throw new RemoteLinkError('LOGIN_CODE_USED', 'Login code has already been used', 409);
      if (Date.parse(record.expires_at) <= Date.now()) throw new RemoteLinkError('LOGIN_CODE_EXPIRED', 'Login code has expired', 401);
      const cleanKey = cleanJwk(publicKeyJwk);
      const existing = session.devices[deviceId];
      if (existing && JSON.stringify(existing.public_key_jwk) !== JSON.stringify(cleanKey)) {
        throw new RemoteLinkError('DEVICE_KEY_CONFLICT', 'Device ID is already bound to another key', 409);
      }
      const device = {
        device_id: String(deviceId),
        label: String(label || record.label || '浏览器设备').slice(0, 120),
        public_key_jwk: cleanKey,
        origin,
        scopes: clone(record.scopes || DEFAULT_SCOPES),
        risk_limit: record.risk_limit || 'high',
        registered_at: existing?.registered_at || now(),
        last_seen_at: now(),
        revoked_at: null,
      };
      session.devices[device.device_id] = device;
      record.used_at = now();
      record.device_id = device.device_id;
      this._appendEvent(session, 'browser.device_registered', {
        device_id: device.device_id,
        label: device.label,
        origin,
      });
      return clone(device);
    });
  }

  getSession(sessionId) {
    const session = this.read().sessions[sessionId];
    if (!session) throw new RemoteLinkError('SESSION_NOT_FOUND', 'Session not found', 404);
    return clone(session);
  }

  verifyLegacyBrowserToken(sessionId, token) {
    const session = this.getSession(sessionId);
    if (!session.legacy_browser_token_hash || !token || sha256(token) !== session.legacy_browser_token_hash) return null;
    return {
      format: 'dml.browser-grant.legacy',
      grant_id: 'legacy',
      session_id: sessionId,
      device_id: 'legacy-browser-token',
      origin: '*',
      scopes: ['*'],
      risk_limit: 'high',
      issued_at: session.created_at,
      expires_at: '2999-01-01T00:00:00.000Z',
    };
  }

  device(sessionId, deviceId) {
    const device = this.getSession(sessionId).devices?.[deviceId];
    if (!device || device.revoked_at) throw new RemoteLinkError('DEVICE_UNAUTHORIZED', 'Browser device is not registered or has been revoked', 401);
    return clone(device);
  }

  touchDevice(sessionId, deviceId) {
    return this.mutate((state) => {
      const device = state.sessions[sessionId]?.devices?.[deviceId];
      if (!device || device.revoked_at) throw new RemoteLinkError('DEVICE_UNAUTHORIZED', 'Browser device is not registered or has been revoked', 401);
      device.last_seen_at = now();
      return clone(device);
    });
  }

  listDevices(sessionId) {
    const session = this.getSession(sessionId);
    return Object.values(session.devices || {}).map((device) => ({
      device_id: device.device_id,
      label: device.label,
      origin: device.origin,
      scopes: device.scopes,
      risk_limit: device.risk_limit,
      registered_at: device.registered_at,
      last_seen_at: device.last_seen_at,
      revoked_at: device.revoked_at,
    }));
  }

  revokeDevice(sessionId, deviceId) {
    return this.mutate((state) => {
      const session = state.sessions[sessionId];
      if (!session) throw new RemoteLinkError('SESSION_NOT_FOUND', 'Session not found', 404);
      const device = session.devices?.[deviceId];
      if (!device) throw new RemoteLinkError('DEVICE_NOT_FOUND', 'Browser device not found', 404);
      device.revoked_at = device.revoked_at || now();
      this._appendEvent(session, 'browser.device_revoked', { device_id: deviceId });
      return clone(device);
    });
  }

  revokeGrant(sessionId, grantId) {
    return this.mutate((state) => {
      const session = state.sessions[sessionId];
      if (!session) throw new RemoteLinkError('SESSION_NOT_FOUND', 'Session not found', 404);
      session.revoked_grants ||= {};
      session.revoked_grants[grantId] = now();
      return true;
    });
  }

  isGrantRevoked(sessionId, grantId) {
    return Boolean(this.getSession(sessionId).revoked_grants?.[grantId]);
  }

  pairHost(sessionId, { pairCode, hostId, publicKeyPem, metadata = {} }) {
    return this.mutate((state) => {
      const session = state.sessions[sessionId];
      if (!session) throw new RemoteLinkError('SESSION_NOT_FOUND', 'Session not found', 404);
      if (session.pair_code_used) throw new RemoteLinkError('PAIR_CODE_USED', 'Pair code already used', 409);
      if (sha256(pairCode || '') !== session.pair_code_hash) throw new RemoteLinkError('PAIR_CODE_INVALID', 'Invalid pair code', 401);
      if (!hostId || !publicKeyPem) throw new RemoteLinkError('PAIR_INPUT_INVALID', 'hostId and publicKeyPem are required');
      session.pair_code_used = true;
      session.host = {
        host_id: String(hostId),
        public_key_pem: String(publicKeyPem),
        metadata: clone(metadata),
        paired_at: now(),
        last_seen_at: now(),
        online: true,
      };
      return clone(session.host);
    });
  }

  host(sessionId) {
    const session = this.getSession(sessionId);
    if (!session.host) throw new RemoteLinkError('HOST_NOT_PAIRED', 'Host not paired', 409);
    return session.host;
  }

  rememberNonce(sessionId, nonce, timestamp, ttlMs = 600_000, namespace = 'request') {
    return this.mutate((state) => {
      const nowMs = Date.now();
      state.nonces ||= {};
      for (const [key, value] of Object.entries(state.nonces)) {
        if (Number(value.expires_at || 0) < nowMs) delete state.nonces[key];
      }
      const key = `${namespace}:${sessionId}:${nonce}`;
      if (state.nonces[key]) throw new RemoteLinkError('REQUEST_REPLAYED', 'Nonce has already been used', 409);
      state.nonces[key] = { timestamp, expires_at: nowMs + ttlMs };
      return true;
    });
  }

  queueAction(sessionId, envelope) {
    return this.mutate((state) => {
      const session = state.sessions[sessionId];
      if (!session) throw new RemoteLinkError('SESSION_NOT_FOUND', 'Session not found', 404);
      const prior = session.pending_actions.find((item) => item.action_id === envelope.action_id)
        || session.completed_actions[envelope.action_id];
      if (prior) return { duplicate: true, item: clone(prior) };
      session.action_sequence = envelope.sequence;
      session.pending_actions.push(envelope);
      this._appendEvent(session, 'action.queued', { action_id: envelope.action_id, sequence: envelope.sequence });
      return { duplicate: false, item: clone(envelope) };
    });
  }

  nextActions(sessionId, after = 0, limit = 10) {
    const session = this.getSession(sessionId);
    return session.pending_actions
      .filter((item) => item.sequence > Number(after || 0))
      .sort((a, b) => a.sequence - b.sequence)
      .slice(0, limit);
  }

  commitResult(sessionId, receipt) {
    return this.mutate((state) => {
      const session = state.sessions[sessionId];
      if (!session) throw new RemoteLinkError('SESSION_NOT_FOUND', 'Session not found', 404);
      const action = session.pending_actions.find((item) => item.action_id === receipt.action_id);
      if (!action && session.completed_actions[receipt.action_id]) return { duplicate: true, session: clone(session) };
      if (!action) throw new RemoteLinkError('ACTION_NOT_PENDING', 'Action is not pending', 409);
      session.pending_actions = session.pending_actions.filter((item) => item.action_id !== receipt.action_id);
      session.completed_actions[receipt.action_id] = receipt;
      session.completed_sequence = Math.max(session.completed_sequence || 0, Number(receipt.sequence || 0));
      if (receipt.projection) {
        session.projection = receipt.projection;
        session.projection_updated_at = now();
      }
      if (session.host) {
        session.host.last_seen_at = now();
        session.host.online = true;
      }
      this._appendEvent(session, 'action.completed', {
        action_id: receipt.action_id,
        sequence: receipt.sequence,
        status: receipt.status,
        projection: receipt.projection || null,
      });
      return { duplicate: false, session: clone(session) };
    });
  }

  updateHeartbeat(sessionId, heartbeat) {
    return this.mutate((state) => {
      const session = state.sessions[sessionId];
      if (!session?.host) throw new RemoteLinkError('HOST_NOT_PAIRED', 'Host not paired', 409);
      session.host.last_seen_at = now();
      session.host.online = true;
      session.host.health = clone(heartbeat.health || {});
      if (heartbeat.projection) {
        session.projection = clone(heartbeat.projection);
        session.projection_updated_at = now();
        this._appendEvent(session, 'projection.updated', { projection: heartbeat.projection });
      }
      return clone(session.host);
    });
  }

  appendNotice(sessionId, type, data = {}) {
    return this.mutate((state) => {
      const session = state.sessions[sessionId];
      if (!session) throw new RemoteLinkError('SESSION_NOT_FOUND', 'Session not found', 404);
      return this._appendEvent(session, type, data);
    });
  }

  _appendEvent(session, type, data) {
    session.event_sequence = Number(session.event_sequence || 0) + 1;
    const event = { sequence: session.event_sequence, type, data: clone(data), created_at: now() };
    session.event_log.push(event);
    if (session.event_log.length > 500) session.event_log.splice(0, session.event_log.length - 500);
    return clone(event);
  }

  eventsAfter(sessionId, sequence = 0) {
    const session = this.getSession(sessionId);
    return session.event_log.filter((event) => event.sequence > Number(sequence || 0));
  }

  sessionStatus(sessionId) {
    const session = this.getSession(sessionId);
    const lastSeen = Date.parse(session.host?.last_seen_at || '') || 0;
    const online = Boolean(session.host) && Date.now() - lastSeen < 60_000;
    return {
      session_id: session.session_id,
      name: session.name,
      host: session.host ? { ...session.host, public_key_pem: undefined, online } : null,
      browser_devices: this.listDevices(sessionId).length,
      active_browser_devices: this.listDevices(sessionId).filter((device) => !device.revoked_at).length,
      pending_actions: session.pending_actions.length,
      completed_actions: Object.keys(session.completed_actions).length,
      projection_updated_at: session.projection_updated_at,
      protocol: 'dml.secure-relay.v0.3',
    };
  }
}
