import crypto from 'node:crypto';

export function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
}

export function sha256(value) {
  const input = Buffer.isBuffer(value) ? value : Buffer.from(typeof value === 'string' ? value : canonicalJson(value));
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

export function nowIso() {
  return new Date().toISOString();
}

export function randomId(prefix) {
  return `${prefix}:${crypto.randomUUID()}`;
}

export function safeFileStem(value) {
  return String(value).replace(/[^A-Za-z0-9_.-]/g, '_');
}

export function boundedText(value, maxBytes = 200_000) {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  const bytes = Buffer.byteLength(text, 'utf8');
  if (bytes <= maxBytes) return text;
  return `${Buffer.from(text, 'utf8').subarray(0, maxBytes).toString('utf8')}\n...[truncated]`;
}

export function publicError(error, fallbackCode = 'TURI_ERROR') {
  return {
    code: String(error?.code ?? fallbackCode),
    message: String(error?.message ?? error).slice(0, 1_000),
    classification: String(error?.classification ?? 'runtime'),
    details: error?.details === undefined ? null : clone(error.details),
  };
}
