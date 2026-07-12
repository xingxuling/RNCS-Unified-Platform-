import crypto from 'node:crypto';
import { id, now, RemoteLinkError } from './canonical.mjs';

export const GRANT_FORMAT = 'dml.browser-grant.v0.3';

function encode(value) {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

function decode(value) {
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
  } catch {
    throw new RemoteLinkError('GRANT_MALFORMED', 'Browser grant is malformed', 401);
  }
}

export function issueBrowserGrant({
  sessionId,
  device,
  origin,
  privateKeyPem,
  ttlMs = 10 * 60 * 1000,
}) {
  const issuedAt = now();
  const payload = {
    format: GRANT_FORMAT,
    grant_id: id('grant', { sessionId, deviceId: device.device_id, issuedAt }),
    session_id: sessionId,
    device_id: device.device_id,
    origin,
    scopes: [...(device.scopes || [])],
    risk_limit: device.risk_limit || 'medium',
    issued_at: issuedAt,
    expires_at: new Date(Date.now() + ttlMs).toISOString(),
  };
  const encoded = encode(payload);
  const signature = crypto.sign(null, Buffer.from(encoded, 'utf8'), privateKeyPem).toString('base64url');
  return { token: `${encoded}.${signature}`, payload };
}

export function verifyBrowserGrant(token, publicKeyPem, expectedSessionId) {
  const parts = String(token || '').split('.');
  if (parts.length !== 2) throw new RemoteLinkError('GRANT_MALFORMED', 'Browser grant is malformed', 401);
  const [encoded, signature] = parts;
  const verified = crypto.verify(
    null,
    Buffer.from(encoded, 'utf8'),
    publicKeyPem,
    Buffer.from(signature, 'base64url'),
  );
  if (!verified) throw new RemoteLinkError('GRANT_SIGNATURE_INVALID', 'Browser grant signature is invalid', 401);
  const payload = decode(encoded);
  if (payload.format !== GRANT_FORMAT) throw new RemoteLinkError('GRANT_FORMAT_INVALID', 'Browser grant format is invalid', 401);
  if (payload.session_id !== expectedSessionId) throw new RemoteLinkError('GRANT_SESSION_MISMATCH', 'Browser grant belongs to another session', 401);
  if (Date.parse(payload.expires_at || '') <= Date.now()) throw new RemoteLinkError('GRANT_EXPIRED', 'Browser grant has expired', 401);
  return payload;
}

export function scopeAllows(scopes, required) {
  const values = Array.isArray(scopes) ? scopes : [];
  return values.some((scope) => {
    if (scope === '*' || scope === required) return true;
    if (scope.endsWith('*')) return required.startsWith(scope.slice(0, -1));
    return false;
  });
}

const RISK = Object.freeze({ low: 0, medium: 1, high: 2, critical: 3 });

export function riskAllows(limit = 'medium', requested = 'medium') {
  return (RISK[requested] ?? 3) <= (RISK[limit] ?? 1);
}
