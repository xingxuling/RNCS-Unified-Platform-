import {
  RealityKernelError,
  assertNonEmptyString,
  clone,
  rootHash,
  withIntegrity
} from './canonical.mjs';

const OBJECT_FORMAT = 'reality.object.v0.1';

export function createRealityObject({
  id,
  kind,
  schema = `${kind}.v1`,
  version = 1,
  state = {},
  tags = [],
  metadata = {},
  provenance = {}
}) {
  assertNonEmptyString(id, 'RK_OBJECT_ID_REQUIRED', 'id');
  assertNonEmptyString(kind, 'RK_OBJECT_KIND_REQUIRED', 'kind');
  assertNonEmptyString(schema, 'RK_OBJECT_SCHEMA_REQUIRED', 'schema');
  if (!Number.isInteger(version) || version < 1) {
    throw new RealityKernelError('RK_OBJECT_VERSION_INVALID', 'version must be a positive integer');
  }
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    throw new RealityKernelError('RK_OBJECT_STATE_INVALID', 'state must be a JSON object');
  }
  if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== 'string')) {
    throw new RealityKernelError('RK_OBJECT_TAGS_INVALID', 'tags must be an array of strings');
  }

  const body = {
    format: OBJECT_FORMAT,
    id,
    kind,
    schema,
    version,
    state: clone(state),
    tags: [...new Set(tags)].sort(),
    metadata: clone(metadata),
    provenance: clone(provenance)
  };
  return {...body, objectRoot: rootHash(body)};
}

export function verifyRealityObject(value) {
  if (!value || value.format !== OBJECT_FORMAT || typeof value.objectRoot !== 'string') return false;
  try {
    const body = Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'objectRoot'));
    return value.objectRoot === rootHash(body) &&
      typeof value.id === 'string' && value.id.length > 0 &&
      typeof value.kind === 'string' && value.kind.length > 0 &&
      typeof value.schema === 'string' && value.schema.length > 0 &&
      Number.isInteger(value.version) && value.version > 0 &&
      value.state && typeof value.state === 'object' && !Array.isArray(value.state) &&
      Array.isArray(value.tags) && value.tags.every((tag) => typeof tag === 'string');
  } catch {
    return false;
  }
}

export function assertRealityObject(value) {
  if (!verifyRealityObject(value)) {
    throw new RealityKernelError('RK_OBJECT_INVALID', 'reality object failed ABI verification', {id: value?.id});
  }
  return value;
}

export function objectBody(value) {
  assertRealityObject(value);
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'objectRoot'));
}

export function objectRoot(value) {
  assertRealityObject(value);
  return value.objectRoot;
}

export function replaceObjectState(value, state) {
  const body = objectBody(value);
  return createRealityObject({...body, state});
}

export {OBJECT_FORMAT};
