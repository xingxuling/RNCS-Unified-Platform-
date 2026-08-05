import { createHash } from 'node:crypto';
import { WorldBodyValidationError } from './errors.mjs';

export const DEFAULT_CANONICAL_LIMITS = Object.freeze({
  maxDepth: 64,
  maxNodes: 100_000,
  maxStringBytes: 1_048_576,
  maxSerializedBytes: 16_777_216,
});

export function compareUtf8(left, right) {
  return Buffer.compare(Buffer.from(String(left), 'utf8'), Buffer.from(String(right), 'utf8'));
}

function isPlainRecord(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function visit(value, path, depth, state, limits) {
  state.nodes += 1;
  if (state.nodes > limits.maxNodes) {
    throw new WorldBodyValidationError('WBIR_CANONICAL_NODE_LIMIT', path, `node count exceeds ${limits.maxNodes}`);
  }
  if (depth > limits.maxDepth) {
    throw new WorldBodyValidationError('WBIR_CANONICAL_DEPTH_LIMIT', path, `depth exceeds ${limits.maxDepth}`);
  }
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const bytes = Buffer.byteLength(value, 'utf8');
    if (bytes > limits.maxStringBytes) {
      throw new WorldBodyValidationError('WBIR_CANONICAL_STRING_LIMIT', path, `string exceeds ${limits.maxStringBytes} UTF-8 bytes`);
    }
    return value;
  }
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) {
      throw new WorldBodyValidationError(
        'WBIR_CANONICAL_NUMBER_INVALID',
        path,
        'numbers must be safe integers; encode non-integral quantities as scaled integers or canonical decimal strings',
      );
    }
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => visit(item, `${path}/${index}`, depth + 1, state, limits));
  }
  if (!isPlainRecord(value)) {
    throw new WorldBodyValidationError('WBIR_CANONICAL_TYPE_INVALID', path, `unsupported value type ${Object.prototype.toString.call(value)}`);
  }
  const output = Object.create(null);
  for (const key of Object.keys(value).sort(compareUtf8)) {
    if (value[key] === undefined) {
      throw new WorldBodyValidationError('WBIR_CANONICAL_UNDEFINED', `${path}/${key}`, 'undefined is not a canonical value');
    }
    output[key] = visit(value[key], `${path}/${key}`, depth + 1, state, limits);
  }
  return output;
}

export function canonicalize(value, options = {}) {
  const limits = { ...DEFAULT_CANONICAL_LIMITS, ...options };
  return visit(value, '', 0, { nodes: 0 }, limits);
}

export function canonicalJson(value, options = {}) {
  const limits = { ...DEFAULT_CANONICAL_LIMITS, ...options };
  const json = JSON.stringify(canonicalize(value, limits));
  const bytes = Buffer.byteLength(json, 'utf8');
  if (bytes > limits.maxSerializedBytes) {
    throw new WorldBodyValidationError('WBIR_CANONICAL_DOCUMENT_LIMIT', '', `document exceeds ${limits.maxSerializedBytes} UTF-8 bytes`);
  }
  return json;
}

export function semanticHash(value, options = {}) {
  return createHash('sha256').update(canonicalJson(value, options), 'utf8').digest('hex');
}

export function canonicalClone(value, options = {}) {
  return JSON.parse(canonicalJson(value, options));
}

export function isSha256(value) {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
}
