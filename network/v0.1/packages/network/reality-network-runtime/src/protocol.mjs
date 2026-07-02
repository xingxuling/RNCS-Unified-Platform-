import {rootHash, withIntegrity} from '@taowind/rfe-core-sdk';

export const NETWORK_VERSION = '0.1.0-alpha.1';
export const NETWORK_PROTOCOL = 'rncs.network-runtime.v0.1';
export const NETWORK_RUNTIME_ID = 'rncs.network';
export const FORMATS = Object.freeze({
  session: 'network.session.v0.1', input: 'network.input.v0.1', snapshot: 'network.snapshot.v0.1',
  delta: 'network.delta.v0.1', ack: 'network.ack.v0.1', correction: 'network.correction.v0.1',
  receipt: 'network.receipt.v0.1', recovery: 'network.recovery.v0.1', rejection: 'network.input-rejection-receipt.v0.1'
});
export const clone = value => structuredClone(value);
export function clean(value){ if(Array.isArray(value)) return value.map(item=>item===undefined?null:clean(item)); if(value&&typeof value==='object') return Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined).map(([k,v])=>[k,clean(v)])); return value; }
export const hash = value => rootHash(clean(value));
export const seal = (value, field = 'root') => withIntegrity(clean(value), field);

const bodyProjection = body => ({objectId:body.id,position:clone(body.position),rotation:clone(body.rotationDeg),velocity:clone(body.velocity),animationState:body.grounded?'grounded':'airborne',characterState:{grounded:body.grounded,awake:body.awake,enabled:body.enabled}});

export function makeSnapshotPacket(sessionId,snapshot,receiptRoot='0'.repeat(64),reason='tick'){
  const base={format:FORMATS.snapshot,protocol:NETWORK_PROTOCOL,sessionId,reason,tick:snapshot.tick,worldId:snapshot.worldId,objects:snapshot.bodies.map(bodyProjection),worldEvents:clone(snapshot.events),stateRoot:snapshot.stateRoot,previousRoot:snapshot.tick>0?snapshot.previousRoot??'0'.repeat(64):'0'.repeat(64),serverReceiptRoot:receiptRoot,rsrSnapshot:clone(snapshot)};
  return {...base,snapshotRoot:hash(base)};
}
export function makeDeltaPacket(sessionId,previousSnapshot,snapshot,receiptRoot='0'.repeat(64)){
  const previous=new Map((previousSnapshot?.bodies??[]).map(body=>[body.id,body]));
  const objects=snapshot.bodies.filter(body=>{const old=previous.get(body.id);return !old||hash(bodyProjection(old))!==hash(bodyProjection(body));}).map(bodyProjection);
  const base={format:FORMATS.delta,protocol:NETWORK_PROTOCOL,sessionId,tick:snapshot.tick,objects,changedBodies:snapshot.bodies.map(clone),characters:clone(snapshot.characters),joints:clone(snapshot.joints),listeners:clone(snapshot.listeners),contacts:clone(snapshot.contacts),worldEvents:clone(snapshot.events),diagnostics:clone(snapshot.diagnostics),roots:{bodyRoot:snapshot.bodyRoot,contactRoot:snapshot.contactRoot,characterRoot:snapshot.characterRoot,sensoryRoot:snapshot.sensoryRoot,jointRoot:snapshot.jointRoot},stateRoot:snapshot.stateRoot,previousRoot:previousSnapshot?.stateRoot??'0'.repeat(64),serverReceiptRoot:receiptRoot};
  return {...base,deltaRoot:hash(base)};
}
export function makeRfeEvidence(kind,payload){const base={format:'rfe.network-evidence.v0.1',kind,protocol:NETWORK_PROTOCOL,payload:clone(payload)};return {...base,evidenceRoot:hash(base)};}
export function makeCorrectionReceipt({sessionId,playerId,serverTick,beforeRoot,authorityRoot,replayedSequences,afterRoot,reason}){const base={format:FORMATS.correction,protocol:NETWORK_PROTOCOL,sessionId,playerId,serverTick,beforeRoot,authorityRoot,replayedSequences:[...replayedSequences],afterRoot,reason};return {...base,correctionRoot:hash(base)};}
