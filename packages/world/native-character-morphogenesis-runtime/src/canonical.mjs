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

export const add3 = (a, b) => [(a[0] ?? 0) + (b[0] ?? 0), (a[1] ?? 0) + (b[1] ?? 0), (a[2] ?? 0) + (b[2] ?? 0)];
export const sub3 = (a, b) => [(a[0] ?? 0) - (b[0] ?? 0), (a[1] ?? 0) - (b[1] ?? 0), (a[2] ?? 0) - (b[2] ?? 0)];
export const scale3 = (a, scalar) => [(a[0] ?? 0) * scalar, (a[1] ?? 0) * scalar, (a[2] ?? 0) * scalar];
export const length3 = value => Math.hypot(value[0] ?? 0, value[1] ?? 0, value[2] ?? 0);
export const distance3 = (a, b) => length3(sub3(a, b));
export const normalize3 = value => { const length = length3(value) || 1; return scale3(value, 1 / length); };

export function rotateEuler(pointValue, rotation = {}) {
  let [x, y, z] = [pointValue[0] ?? 0, pointValue[1] ?? 0, pointValue[2] ?? 0];
  const pitch = Number(rotation.pitch ?? rotation.x ?? 0);
  const yaw = Number(rotation.yaw ?? rotation.y ?? 0);
  const roll = Number(rotation.roll ?? rotation.z ?? 0);
  let cosine = Math.cos(pitch), sine = Math.sin(pitch);
  [y, z] = [y * cosine - z * sine, y * sine + z * cosine];
  cosine = Math.cos(yaw); sine = Math.sin(yaw);
  [x, z] = [x * cosine - z * sine, x * sine + z * cosine];
  cosine = Math.cos(roll); sine = Math.sin(roll);
  [x, y] = [x * cosine - y * sine, x * sine + y * cosine];
  return [x, y, z];
}

export function addRotation(a = {}, b = {}) {
  return {pitch: Number(a.pitch ?? a.x ?? 0) + Number(b.pitch ?? b.x ?? 0), yaw: Number(a.yaw ?? a.y ?? 0) + Number(b.yaw ?? b.y ?? 0), roll: Number(a.roll ?? a.z ?? 0) + Number(b.roll ?? b.z ?? 0)};
}

export function composeTransform(parent = {position: [0, 0, 0], rotation: {pitch: 0, yaw: 0, roll: 0}}, local = {translation: [0, 0, 0], rotation: {pitch: 0, yaw: 0, roll: 0}}) {
  return {position: add3(parent.position, rotateEuler(local.translation ?? [0, 0, 0], parent.rotation)), rotation: addRotation(parent.rotation, local.rotation)};
}

export const transformPoint = (transform, pointValue) => add3(transform.position, rotateEuler(pointValue, transform.rotation));
