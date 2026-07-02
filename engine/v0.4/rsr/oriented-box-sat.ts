export interface Vec3 { x: number; y: number; z: number }
export interface OBB { center: Vec3; axes: [Vec3, Vec3, Vec3]; halfExtents: Vec3 }
export interface OBBContact { point: Vec3; normal: Vec3; penetration: number }

const add = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const scale = (a: Vec3, n: number): Vec3 => ({ x: a.x * n, y: a.y * n, z: a.z * n });
const dot = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: Vec3, b: Vec3): Vec3 => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const length = (a: Vec3): number => Math.hypot(a.x, a.y, a.z);
const normalize = (a: Vec3): Vec3 => { const n = length(a); return n < 1e-9 ? { x: 1, y: 0, z: 0 } : scale(a, 1 / n); };

/** Rz × Ry × Rx, shared with VSR transform semantics. */
export function rotationAxes(rotationDeg: Vec3): [Vec3, Vec3, Vec3] {
  const rx = rotationDeg.x * Math.PI / 180;
  const ry = rotationDeg.y * Math.PI / 180;
  const rz = rotationDeg.z * Math.PI / 180;
  const cx = Math.cos(rx), sx = Math.sin(rx);
  const cy = Math.cos(ry), sy = Math.sin(ry);
  const cz = Math.cos(rz), sz = Math.sin(rz);
  return [
    { x: cz * cy, y: sz * cy, z: -sy },
    { x: cz * sy * sx - sz * cx, y: sz * sy * sx + cz * cx, z: cy * sx },
    { x: cz * sy * cx + sz * sx, y: sz * sy * cx - cz * sx, z: cy * cx },
  ];
}

export function rotateLocal(local: Vec3, axes: [Vec3, Vec3, Vec3]): Vec3 {
  return add(add(scale(axes[0], local.x), scale(axes[1], local.y)), scale(axes[2], local.z));
}

export function closestPointOBB(point: Vec3, box: OBB): Vec3 {
  const delta = sub(point, box.center);
  let result = box.center;
  const extents = [box.halfExtents.x, box.halfExtents.y, box.halfExtents.z];
  for (let i = 0; i < 3; i++) {
    const distance = Math.max(-extents[i], Math.min(extents[i], dot(delta, box.axes[i])));
    result = add(result, scale(box.axes[i], distance));
  }
  return result;
}

/** Deterministic 15-axis OBB SAT narrowphase. */
export function collideOBB(a: OBB, b: OBB): OBBContact | undefined {
  const axes: Vec3[] = [...a.axes, ...b.axes];
  for (const axisA of a.axes) for (const axisB of b.axes) {
    const candidate = cross(axisA, axisB);
    if (length(candidate) > 1e-7) axes.push(normalize(candidate));
  }
  const delta = sub(b.center, a.center);
  const radius = (box: OBB, axis: Vec3): number =>
    Math.abs(dot(box.axes[0], axis)) * box.halfExtents.x +
    Math.abs(dot(box.axes[1], axis)) * box.halfExtents.y +
    Math.abs(dot(box.axes[2], axis)) * box.halfExtents.z;

  let bestAxis: Vec3 | undefined;
  let bestPenetration = Infinity;
  for (const raw of axes) {
    const axis = normalize(raw);
    const penetration = radius(a, axis) + radius(b, axis) - Math.abs(dot(delta, axis));
    if (penetration <= 0) return undefined;
    if (penetration < bestPenetration) {
      bestPenetration = penetration;
      bestAxis = dot(delta, axis) >= 0 ? axis : scale(axis, -1);
    }
  }
  const normal = bestAxis ?? { x: 1, y: 0, z: 0 };
  return { point: scale(add(a.center, b.center), 0.5), normal, penetration: bestPenetration };
}
