import { randomToken, RemoteLinkError } from '../shared/canonical.mjs';
import { signRequest } from '../shared/crypto.mjs';

function joinUrl(base, path) {
  return new URL(path, base.endsWith('/') ? base : `${base}/`);
}

export async function pairHost({ relayUrl, sessionId, pairCode, hostId, publicKeyPem, metadata = {} }) {
  const url = joinUrl(relayUrl, `v1/sessions/${encodeURIComponent(sessionId)}/host/pair`);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      pair_code: pairCode,
      host_id: hostId,
      host_public_key_pem: publicKeyPem,
      metadata,
    }),
  });
  const result = await response.json();
  if (!response.ok) throw new RemoteLinkError(result.error?.code || 'PAIR_FAILED', result.error?.message || `Pair failed: ${response.status}`, response.status);
  return result;
}

export async function signedHostRequest({ relayUrl, sessionId, hostId, privateKeyPem, method = 'GET', tail, body = null }) {
  const url = joinUrl(relayUrl, `v1/sessions/${encodeURIComponent(sessionId)}${tail}`);
  const rawBody = body === null ? '' : JSON.stringify(body);
  const timestamp = String(Date.now());
  const nonce = randomToken(24);
  const pathWithQuery = `${url.pathname}${url.search}`;
  const signature = signRequest(privateKeyPem, { method, pathWithQuery, timestamp, nonce, body: rawBody });
  const response = await fetch(url, {
    method,
    headers: {
      accept: 'application/json',
      ...(rawBody ? { 'content-type': 'application/json' } : {}),
      'x-dml-host-id': hostId,
      'x-dml-timestamp': timestamp,
      'x-dml-nonce': nonce,
      'x-dml-signature': signature,
    },
    body: rawBody || undefined,
  });
  const result = await response.json();
  if (!response.ok) throw new RemoteLinkError(result.error?.code || 'HOST_REQUEST_FAILED', result.error?.message || `Host request failed: ${response.status}`, response.status);
  return result;
}
