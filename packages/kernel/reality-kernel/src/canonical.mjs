import {createHash} from 'node:crypto';

export class RealityKernelError extends Error {
  constructor(code, message, details = undefined) {
    super(`${code}: ${message}`);
    this.name = 'RealityKernelError';
    this.code = code;
    this.details = details;
  }
}

function numberToJson(value) {
  if (!Number.isFinite(value)) {
    throw new RealityKernelError('RK_CANONICAL_NON_FINITE', 'NaN and Infinity are forbidden');
  }
  if (Object.is(value, -0)) return '0';
  return JSON.stringify(value);
}

export function canonicalJson(value) {
  if (value === null) return 'null';
  if (value === true) return 'true';
  if (value === false) return 'false';
  if (typeof value === 'number') return numberToJson(value);
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'undefined') {
    throw new RealityKernelError('RK_CANONICAL_UNSUPPORTED', 'undefined is not representable');
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${canonicalJson(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  throw new RealityKernelError('RK_CANONICAL_UNSUPPORTED', typeof value);
}

export function rootHash(value) {
  return createHash('sha256').update(canonicalJson(value)).digest('hex');
}

export function clone(value) {
  return structuredClone(value);
}

export function withIntegrity(value, field = 'integrityHash') {
  const body = clone(value);
  delete body[field];
  return {...body, [field]: rootHash(body)};
}

export function verifyIntegrity(value, field = 'integrityHash') {
  if (!value || typeof value !== 'object' || typeof value[field] !== 'string') return false;
  const body = Object.fromEntries(Object.entries(value).filter(([key]) => key !== field));
  try {
    return value[field] === rootHash(body);
  } catch {
    return false;
  }
}

export function assertNonEmptyString(value, code, field) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new RealityKernelError(code, `${field} must be a non-empty string`);
  }
}

export function sortedUnique(values) {
  return [...new Set(values)].sort();
}

export function compareStrings(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}
