import crypto from 'node:crypto';

export function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
}

export function sha256(value) {
  const input = Buffer.isBuffer(value) ? value : Buffer.from(typeof value === 'string' ? value : canonical(value));
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function randomCode(length = 12) {
  let value = '';
  while (value.length < length) value += crypto.randomInt(0, 10).toString();
  return value;
}

export function now() {
  return new Date().toISOString();
}

export function clone(value) {
  return structuredClone(value);
}

export function id(prefix, seed = randomToken(18)) {
  return `${prefix}:${sha256(seed).slice(0, 24)}`;
}

export function safeEqualHex(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const a = Buffer.from(left, 'hex');
  const b = Buffer.from(right, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class RemoteLinkError extends Error {
  constructor(code, message = code, status = 400) {
    super(message);
    this.name = 'RemoteLinkError';
    this.code = code;
    this.status = status;
  }
}
