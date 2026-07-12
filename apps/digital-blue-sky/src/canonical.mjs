import crypto from 'node:crypto';

export class DMLError extends Error {
  constructor(code, message = code, details = null) {
    super(message);
    this.name = 'DMLError';
    this.code = code;
    this.details = details;
  }
}

export const clone = (value) => structuredClone(value);

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort((a, b) => a.localeCompare(b, 'en')).map((key) => [key, normalize(value[key])]),
    );
  }
  return value;
}

export const canonicalJson = (value) => JSON.stringify(normalize(value));
export const hash = (value) => crypto.createHash('sha256').update(canonicalJson(value)).digest('hex');
export const now = () => new Date().toISOString();
export const id = (prefix, seed = crypto.randomUUID()) => `${prefix}:${hash({ prefix, seed }).slice(0, 24)}`;
export const uniq = (items = []) => [...new Set(items.map(String))].sort((a, b) => a.localeCompare(b, 'en'));

export function seal(value, field) {
  const out = clone(value);
  delete out[field];
  out[field] = hash(out);
  return out;
}

export function verifySeal(value, field) {
  if (!value || typeof value !== 'object' || typeof value[field] !== 'string') return false;
  const out = clone(value);
  const expected = out[field];
  delete out[field];
  return hash(out) === expected;
}

export function atomicWriteJson(fs, path, value) {
  const tmp = `${path}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(tmp, path);
}
