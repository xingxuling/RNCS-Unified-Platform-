import { id, now, sha256, RemoteLinkError } from './canonical.mjs';
import { sealObject, verifySealedObject } from './crypto.mjs';

export const PROTOCOL = Object.freeze({
  relay: 'dml.secure-relay.v0.3',
  action: 'dml.remote-action.v0.3',
  result: 'dml.remote-result.v0.3',
  heartbeat: 'dml.remote-heartbeat.v0.3',
});

export function makeQueuedAction({ sessionId, sequence, action, options = {}, privateKeyPem, ttlMs = 300_000 }) {
  const queuedAt = now();
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  const actionId = String(action?.action_id || id('action', { sessionId, sequence, action, queuedAt }));
  const envelope = {
    format: PROTOCOL.action,
    session_id: sessionId,
    sequence,
    action_id: actionId,
    idempotency_key: actionId,
    action: { ...action, action_id: actionId },
    options,
    queued_at: queuedAt,
    expires_at: expiresAt,
  };
  return sealObject(envelope, privateKeyPem, 'relay_root', 'relay_signature_b64');
}

export function verifyQueuedAction(envelope, relayPublicKeyPem, expectedSessionId) {
  if (!envelope || envelope.format !== PROTOCOL.action) throw new RemoteLinkError('ACTION_FORMAT_INVALID');
  if (envelope.session_id !== expectedSessionId) throw new RemoteLinkError('ACTION_SESSION_MISMATCH');
  if (!verifySealedObject(envelope, relayPublicKeyPem, 'relay_root', 'relay_signature_b64')) {
    throw new RemoteLinkError('ACTION_SIGNATURE_INVALID');
  }
  if (Date.parse(envelope.expires_at) < Date.now()) throw new RemoteLinkError('ACTION_EXPIRED');
  return envelope;
}

export function makeExecutionReceipt({ sessionId, hostId, queuedAction, execution, projection, startedAt, completedAt, privateKeyPem }) {
  const receipt = {
    format: PROTOCOL.result,
    session_id: sessionId,
    host_id: hostId,
    sequence: queuedAction.sequence,
    action_id: queuedAction.action_id,
    idempotency_key: queuedAction.idempotency_key,
    status: execution?.status || 'error',
    execution,
    projection,
    started_at: startedAt,
    completed_at: completedAt,
    duration_ms: Math.max(0, Date.parse(completedAt) - Date.parse(startedAt)),
    evidence: {
      action_root: queuedAction.relay_root,
      projection_root: projection?.projection_root || sha256(projection || null),
    },
  };
  return sealObject(receipt, privateKeyPem, 'result_root', 'host_signature_b64');
}

export function verifyExecutionReceipt(receipt, hostPublicKeyPem, expectedSessionId) {
  if (!receipt || receipt.format !== PROTOCOL.result) throw new RemoteLinkError('RESULT_FORMAT_INVALID');
  if (receipt.session_id !== expectedSessionId) throw new RemoteLinkError('RESULT_SESSION_MISMATCH');
  if (!verifySealedObject(receipt, hostPublicKeyPem, 'result_root', 'host_signature_b64')) {
    throw new RemoteLinkError('RESULT_SIGNATURE_INVALID');
  }
  return receipt;
}
