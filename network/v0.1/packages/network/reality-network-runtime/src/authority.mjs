import {sealDelegation, verifyDelegation, hash as aafHash, matchPattern} from '@taowind/agent-authority-fabric';

export function issuePlayerDelegation({sessionId, subjectId, playerId, characterId, actions = ['move','jump','impulse'], issuedAt = '2020-01-01T00:00:00.000Z', expiresAt = '2099-12-31T23:59:59.999Z'}) {
  return sealDelegation({
    delegation_id: `delegation:${sessionId}:${playerId}`,
    issuer_id: `server:${sessionId}`,
    delegate_id: subjectId,
    scopes: actions.map(action => `network.input.${action}`),
    capability_patterns: actions.map(action => `network:${sessionId}:${playerId}:${characterId}:${action}`),
    constraints: {session_id: sessionId, player_id: playerId, character_id: characterId, risk_at_most: 'medium'},
    not_before: issuedAt, expires_at: expiresAt, max_depth: 0
  });
}

export function verifyPlayerInputAuthority({delegation, authorizationRoot, session, input, now = new Date().toISOString()}) {
  if (!delegation || !verifyDelegation(delegation)) return {ok:false, code:'AUTHORIZATION_INVALID'};
  if (delegation.delegation_root !== authorizationRoot || aafHash(Object.fromEntries(Object.entries(delegation).filter(([key]) => key !== 'delegation_root'))) !== authorizationRoot) return {ok:false, code:'AUTHORIZATION_ROOT_MISMATCH'};
  if (session.status !== 'open') return {ok:false, code:'SESSION_NOT_OPEN'};
  if (delegation.delegate_id !== input.subjectId) return {ok:false, code:'SUBJECT_FORGED'};
  if (delegation.constraints?.session_id !== input.sessionId || input.sessionId !== session.sessionId) return {ok:false, code:'SESSION_SCOPE_MISMATCH'};
  if (delegation.constraints?.player_id !== input.playerId) return {ok:false, code:'PLAYER_SCOPE_MISMATCH'};
  const player = session.players.get(input.playerId);
  if (!player || player.subjectId !== input.subjectId) return {ok:false, code:'PLAYER_SUBJECT_MISMATCH'};
  if (delegation.constraints?.character_id !== player.characterId) return {ok:false, code:'CHARACTER_CONTROL_DENIED'};
  const nowMs = Date.parse(now);
  if (!Number.isFinite(nowMs) || nowMs < Date.parse(delegation.not_before) || nowMs > Date.parse(delegation.expires_at)) return {ok:false, code:'AUTHORIZATION_EXPIRED'};
  const action = input.command?.type;
  if (!['move','jump','impulse'].includes(action)) return {ok:false, code:'ACTION_NOT_ALLOWED'};
  const scope = `network.input.${action}`;
  if (!delegation.scopes.some(pattern => matchPattern(pattern, scope))) return {ok:false, code:'ACTION_SCOPE_DENIED'};
  const capability = `network:${session.sessionId}:${input.playerId}:${player.characterId}:${action}`;
  if (!delegation.capability_patterns.some(pattern => matchPattern(pattern, capability))) return {ok:false, code:'CAPABILITY_DENIED'};
  if ((input.command.risk ?? 'low') === 'critical') return {ok:false, code:'RISK_TOO_HIGH'};
  return {ok:true, player};
}
