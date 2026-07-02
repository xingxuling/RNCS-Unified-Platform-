import {rootHash, withIntegrity} from '@taowind/rfe-core-sdk';
import {
  createAuthoritativeStateDelta,
  createAuthoritativeStateFrame,
  verifyAuthoritativeStateDelta,
  verifyAuthoritativeStateFrame,
} from '@taowind/reality-simulation-runtime/network-reconciliation';

export const NETWORK_VERSION = '0.2.0-alpha.1';
export const NETWORK_PROTOCOL = 'rncs.network-runtime.v0.2';
export const NETWORK_RUNTIME_ID = 'rncs.network';
export const FORMATS = Object.freeze({
  session: 'network.session.v0.2', input: 'network.input.v0.2', snapshot: 'network.snapshot.v0.2',
  delta: 'network.delta.v0.2', ack: 'network.ack.v0.2', correction: 'network.correction.v0.2',
  receipt: 'network.receipt.v0.2', recovery: 'network.recovery.v0.2', rejection: 'network.input-rejection-receipt.v0.2'
});
export const clone = value => structuredClone(value);
export function clean(value){ if(Array.isArray(value)) return value.map(item=>item===undefined?null:clean(item)); if(value&&typeof value==='object') return Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined).map(([k,v])=>[k,clean(v)])); return value; }
export const hash = value => rootHash(clean(value));
export const seal = (value, field = 'root') => withIntegrity(clean(value), field);

const frameObjectProjection = object => ({
  objectId: object.objectId,
  position: clone(object.position),
  rotation: clone(object.rotationDeg),
  velocity: clone(object.velocity),
  angularVelocityDeg: clone(object.angularVelocityDeg),
  animationState: object.grounded ? 'grounded' : 'airborne',
  characterState: {grounded: object.grounded, awake: object.awake, enabled: object.enabled},
  authorityBodyRoot: object.bodyRoot
});

export function makeSnapshotPacket(sessionId, snapshot, receiptRoot = '0'.repeat(64), reason = 'tick', previousStateRoot = '0'.repeat(64)) {
  const rsrFrame = createAuthoritativeStateFrame(snapshot, {previousStateRoot, reason});
  if (!verifyAuthoritativeStateFrame(rsrFrame)) throw new Error('RSR_AUTHORITY_FRAME_INVALID');
  const base = {
    format: FORMATS.snapshot, protocol: NETWORK_PROTOCOL, sessionId, reason,
    tick: snapshot.tick, worldId: snapshot.worldId, stepHz: snapshot.stepHz,
    objects: rsrFrame.objects.map(frameObjectProjection),
    worldEvents: clone(snapshot.events), stateRoot: snapshot.stateRoot,
    previousRoot: previousStateRoot,
    serverReceiptRoot: receiptRoot,
    rsrAuthorityProtocol: rsrFrame.protocol,
    rsrFrame,
    rsrSnapshot: clone(snapshot)
  };
  return {...base, snapshotRoot: hash(base)};
}

export function makeDeltaPacket(sessionId, previousSnapshot, snapshot, receiptRoot = '0'.repeat(64)) {
  if (!previousSnapshot) {
    const full = makeSnapshotPacket(sessionId, snapshot, receiptRoot, 'delta-full-fallback');
    const base = {
      format: FORMATS.delta, protocol: NETWORK_PROTOCOL, sessionId, tick: snapshot.tick, worldId: snapshot.worldId, stepHz: snapshot.stepHz,
      fullSnapshot: true, objects: clone(full.objects), changedBodies: clone(snapshot.bodies), removedBodyIds: [],
      characters: clone(snapshot.characters), joints: clone(snapshot.joints), listeners: clone(snapshot.listeners), contacts: clone(snapshot.contacts),
      worldEvents: clone(snapshot.events), diagnostics: clone(snapshot.diagnostics),
      roots: {bodyRoot:snapshot.bodyRoot,contactRoot:snapshot.contactRoot,characterRoot:snapshot.characterRoot,sensoryRoot:snapshot.sensoryRoot,jointRoot:snapshot.jointRoot},
      stateRoot: snapshot.stateRoot, previousRoot: '0'.repeat(64), serverReceiptRoot: receiptRoot,
      rsrAuthorityProtocol: full.rsrFrame.protocol, rsrFrame: clone(full.rsrFrame), rsrSnapshot: clone(snapshot)
    };
    return {...base, deltaRoot: hash(base)};
  }
  const rsrDelta = createAuthoritativeStateDelta(previousSnapshot, snapshot);
  if (!verifyAuthoritativeStateDelta(rsrDelta)) throw new Error('RSR_AUTHORITY_DELTA_INVALID');
  const changedIds = new Set(rsrDelta.changedBodies.map(body => body.id));
  const objects = createAuthoritativeStateFrame(snapshot, {previousStateRoot: previousSnapshot.stateRoot, reason:'delta'}).objects
    .filter(object => changedIds.has(object.objectId)).map(frameObjectProjection);
  const base = {
    format: FORMATS.delta, protocol: NETWORK_PROTOCOL, sessionId, tick: snapshot.tick, worldId: snapshot.worldId, stepHz: snapshot.stepHz,
    fullSnapshot: false, objects, changedBodies: clone(rsrDelta.changedBodies), removedBodyIds: clone(rsrDelta.removedBodyIds),
    characters: clone(rsrDelta.characters), joints: clone(rsrDelta.joints), listeners: clone(rsrDelta.listeners), contacts: clone(rsrDelta.contacts),
    worldEvents: clone(rsrDelta.events), diagnostics: clone(rsrDelta.diagnostics), roots: clone(rsrDelta.roots),
    stateRoot: snapshot.stateRoot, previousRoot: previousSnapshot.stateRoot, serverReceiptRoot: receiptRoot,
    rsrAuthorityProtocol: rsrDelta.protocol, rsrDelta
  };
  return {...base, deltaRoot: hash(base)};
}

export function makeRfeEvidence(kind, payload) {
  const base = {format: 'rfe.network-evidence.v0.2', kind, protocol: NETWORK_PROTOCOL, payload: clone(payload)};
  return {...base, evidenceRoot: hash(base)};
}

export function makeCorrectionReceipt({sessionId, playerId, serverTick, beforeRoot, authorityRoot, replayedSequences, afterRoot, reason}) {
  const base = {format: FORMATS.correction, protocol: NETWORK_PROTOCOL, sessionId, playerId, serverTick, beforeRoot, authorityRoot, replayedSequences: [...replayedSequences], afterRoot, reason};
  return {...base, correctionRoot: hash(base)};
}
