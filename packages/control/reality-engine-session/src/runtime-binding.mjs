import { rootHash } from '@taowind/rncs-core-contract';
import { verifyAuthoritativeStateFrame } from '@taowind/reality-simulation-runtime/network-reconciliation';
import { verifyTemporalStatePacket } from '@taowind/visual-state-runtime/temporal-presentation';

export const RNCS_RUNTIME_BINDING_FORMAT = 'rncs.authority-presentation-binding.v0.1';
export const RNCS_RUNTIME_BINDING_VERSION = '0.1.0';

export function createRealityRuntimeBinding({ authorityFrame, temporalPacket } = {}) {
  if (!verifyAuthoritativeStateFrame(authorityFrame)) {
    throw new Error('RNCS_RUNTIME_BINDING_AUTHORITY_FRAME_INVALID');
  }
  if (!verifyTemporalStatePacket(temporalPacket)) {
    throw new Error('RNCS_RUNTIME_BINDING_TEMPORAL_PACKET_INVALID');
  }
  if (temporalPacket.sourceStateRoot !== authorityFrame.sourceStateRoot) {
    throw new Error('RNCS_RUNTIME_BINDING_STATE_ROOT_MISMATCH');
  }
  if (temporalPacket.sourcePacketRoot !== authorityFrame.frameRoot) {
    throw new Error('RNCS_RUNTIME_BINDING_AUTHORITY_ROOT_MISMATCH');
  }
  if (temporalPacket.worldId !== authorityFrame.worldId || temporalPacket.tick !== authorityFrame.tick) {
    throw new Error('RNCS_RUNTIME_BINDING_TIME_DOMAIN_MISMATCH');
  }

  const authorityObjects = [...authorityFrame.objects].sort((left, right) => left.objectId.localeCompare(right.objectId));
  const temporalObjects = [...temporalPacket.objects].sort((left, right) => left.objectId.localeCompare(right.objectId));
  if (authorityObjects.length !== temporalObjects.length) {
    throw new Error('RNCS_RUNTIME_BINDING_OBJECT_COUNT_MISMATCH');
  }
  authorityObjects.forEach((object, index) => {
    const temporalObject = temporalObjects[index];
    if (!temporalObject || temporalObject.objectId !== object.objectId) {
      throw new Error('RNCS_RUNTIME_BINDING_OBJECT_ID_MISMATCH');
    }
    const temporalBodyRoot = temporalObject.authority?.bodyRoot;
    if (temporalBodyRoot !== undefined && temporalBodyRoot !== object.bodyRoot) {
      throw new Error('RNCS_RUNTIME_BINDING_BODY_ROOT_MISMATCH');
    }
  });

  const payload = {
    format: RNCS_RUNTIME_BINDING_FORMAT,
    version: RNCS_RUNTIME_BINDING_VERSION,
    worldId: authorityFrame.worldId,
    tick: authorityFrame.tick,
    stepHz: authorityFrame.stepHz,
    stateRoot: authorityFrame.sourceStateRoot,
    previousStateRoot: authorityFrame.previousStateRoot,
    authorityFrame: {
      format: authorityFrame.format,
      protocol: authorityFrame.protocol,
      frameRoot: authorityFrame.frameRoot,
      sourceStateRoot: authorityFrame.sourceStateRoot,
      previousStateRoot: authorityFrame.previousStateRoot,
      objectIds: authorityObjects.map(object => object.objectId),
      bodyRoots: authorityObjects.map(object => object.bodyRoot),
    },
    temporalPacket: {
      format: temporalPacket.format,
      protocol: temporalPacket.protocol,
      packetRoot: temporalPacket.packetRoot,
      sourceStateRoot: temporalPacket.sourceStateRoot,
      sourcePacketRoot: temporalPacket.sourcePacketRoot,
      objectIds: temporalObjects.map(object => object.objectId),
      authorityBodyRoots: temporalObjects.map(object => object.authority?.bodyRoot ?? null),
    },
  };
  return { ...payload, bindingRoot: rootHash(payload) };
}

export function verifyRealityRuntimeBinding(binding) {
  const errors = [];
  const check = (condition, code) => {
    if (!condition) errors.push(code);
  };
  if (!binding || typeof binding !== 'object' || Array.isArray(binding)) {
    return { valid: false, errors: ['RNCS_RUNTIME_BINDING_NOT_OBJECT'] };
  }
  const { bindingRoot, ...payload } = binding;
  check(payload.format === RNCS_RUNTIME_BINDING_FORMAT, 'RNCS_RUNTIME_BINDING_FORMAT_INVALID');
  check(payload.version === RNCS_RUNTIME_BINDING_VERSION, 'RNCS_RUNTIME_BINDING_VERSION_INVALID');
  check(typeof payload.worldId === 'string' && payload.worldId.length > 0, 'RNCS_RUNTIME_BINDING_WORLD_INVALID');
  check(Number.isSafeInteger(payload.tick) && payload.tick >= 0, 'RNCS_RUNTIME_BINDING_TICK_INVALID');
  check(Number.isFinite(payload.stepHz) && payload.stepHz > 0, 'RNCS_RUNTIME_BINDING_STEP_HZ_INVALID');
  check(typeof payload.stateRoot === 'string' && payload.stateRoot.length > 0, 'RNCS_RUNTIME_BINDING_STATE_ROOT_INVALID');
  check(typeof payload.previousStateRoot === 'string' && payload.previousStateRoot.length > 0, 'RNCS_RUNTIME_BINDING_PREVIOUS_ROOT_INVALID');
  const authority = payload.authorityFrame;
  const temporal = payload.temporalPacket;
  check(authority && typeof authority === 'object', 'RNCS_RUNTIME_BINDING_AUTHORITY_SECTION_INVALID');
  check(temporal && typeof temporal === 'object', 'RNCS_RUNTIME_BINDING_TEMPORAL_SECTION_INVALID');
  if (authority && temporal) {
    check(authority.sourceStateRoot === payload.stateRoot, 'RNCS_RUNTIME_BINDING_AUTHORITY_STATE_ROOT_INVALID');
    check(authority.previousStateRoot === payload.previousStateRoot, 'RNCS_RUNTIME_BINDING_AUTHORITY_PREVIOUS_ROOT_INVALID');
    check(temporal.sourceStateRoot === payload.stateRoot, 'RNCS_RUNTIME_BINDING_TEMPORAL_STATE_ROOT_INVALID');
    check(temporal.sourcePacketRoot === authority.frameRoot, 'RNCS_RUNTIME_BINDING_TEMPORAL_AUTHORITY_ROOT_INVALID');
    check(Array.isArray(authority.objectIds) && Array.isArray(authority.bodyRoots), 'RNCS_RUNTIME_BINDING_AUTHORITY_OBJECTS_INVALID');
    check(Array.isArray(temporal.objectIds) && Array.isArray(temporal.authorityBodyRoots), 'RNCS_RUNTIME_BINDING_TEMPORAL_OBJECTS_INVALID');
    if (Array.isArray(authority.objectIds) && Array.isArray(temporal.objectIds)) {
      check(JSON.stringify(authority.objectIds) === JSON.stringify(temporal.objectIds), 'RNCS_RUNTIME_BINDING_OBJECT_IDS_INVALID');
    }
    if (Array.isArray(authority.bodyRoots) && Array.isArray(temporal.authorityBodyRoots)) {
      temporal.authorityBodyRoots.forEach((bodyRoot, index) => {
        if (bodyRoot !== null) check(bodyRoot === authority.bodyRoots[index], 'RNCS_RUNTIME_BINDING_BODY_ROOT_INVALID');
      });
    }
  }
  check(typeof bindingRoot === 'string' && rootHash(payload) === bindingRoot, 'RNCS_RUNTIME_BINDING_ROOT_MISMATCH');
  return { valid: errors.length === 0, errors, binding_root: bindingRoot ?? null };
}
