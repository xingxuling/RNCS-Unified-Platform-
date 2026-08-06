import crypto from 'node:crypto';

export const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));

function canonicalize(value) {
  if (value == null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(canonicalize);
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalize(value[key])]));
}

export function rootHash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(canonicalize(value))).digest('hex');
}

export function seal(value, rootKey) {
  const next = clone(value);
  next[rootKey] = '';
  next[rootKey] = rootHash(next);
  return next;
}

export function stableId(prefix, value) {
  return `${prefix}:${rootHash(value).slice(0, 16)}`;
}

export const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, Number(value)));
export const lerp = (a, b, t) => a + (b - a) * t;
export const deg = value => Number(value) * Math.PI / 180;

export function rotateXZ(point, angle) {
  const [x, y, z = 0] = point;
  const c = Math.cos(angle), s = Math.sin(angle);
  return [x * c - z * s, y, x * s + z * c];
}

export function distance2(a, b) {
  return Math.hypot((a[0] ?? 0) - (b[0] ?? 0), (a[1] ?? 0) - (b[1] ?? 0));
}

export function samplePolyline(points, count = 8) {
  const output = [];
  for (let index = 0; index < count; index += 1) {
    const t = count <= 1 ? 0 : index / (count - 1);
    const segment = Math.min(points.length - 2, Math.floor(t * (points.length - 1)));
    const local = t * (points.length - 1) - segment;
    const a = points[Math.max(0, segment)] ?? points[0];
    const b = points[Math.min(points.length - 1, segment + 1)] ?? a;
    output.push([lerp(a[0], b[0], local), lerp(a[1], b[1], local), lerp(a[2] ?? 0, b[2] ?? 0, local)]);
  }
  return output;
}
