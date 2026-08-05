export interface FloatVector3 { x: number; y: number; z: number }

export type ConvexProxy =
  | { kind: 'sphere'; center: FloatVector3; radius: number }
  | { kind: 'capsule'; center: FloatVector3; segment: [FloatVector3, FloatVector3]; radius: number }
  | { kind: 'box'; center: FloatVector3; axes: [FloatVector3, FloatVector3, FloatVector3]; halfExtents: FloatVector3 }
  | { kind: 'convex'; center: FloatVector3; vertices: FloatVector3[] };

export interface ConvexContact {
  point: FloatVector3;
  normal: FloatVector3;
  penetration: number;
}

export interface ConvexCollisionResult {
  status: 'separated' | 'collision' | 'failed';
  contact?: ConvexContact;
  gjkIterations: number;
  epaIterations: number;
}

interface SimplexVertex {
  point: FloatVector3;
  witnessA: FloatVector3;
  witnessB: FloatVector3;
}

interface SimplexUpdate {
  simplex: SimplexVertex[];
  direction: FloatVector3;
  containsOrigin: boolean;
}

interface Face {
  a: number;
  b: number;
  c: number;
  normal: FloatVector3;
  distance: number;
}

const EPSILON = 1e-7;
const SUPPORT_EPSILON = 1e-5;
const MAX_GJK_ITERATIONS = 32;
const MAX_EPA_ITERATIONS = 48;

const add = (a: FloatVector3, b: FloatVector3): FloatVector3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const sub = (a: FloatVector3, b: FloatVector3): FloatVector3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const scale = (a: FloatVector3, value: number): FloatVector3 => ({ x: a.x * value, y: a.y * value, z: a.z * value });
const neg = (a: FloatVector3): FloatVector3 => scale(a, -1);
const dot = (a: FloatVector3, b: FloatVector3): number => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: FloatVector3, b: FloatVector3): FloatVector3 => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const length = (a: FloatVector3): number => Math.hypot(a.x, a.y, a.z);
const normalize = (a: FloatVector3): FloatVector3 => { const value = length(a); return value <= EPSILON ? { x: 1, y: 0, z: 0 } : scale(a, 1 / value); };
const tripleCross = (a: FloatVector3, b: FloatVector3, c: FloatVector3): FloatVector3 => cross(cross(a, b), c);
const midpoint = (a: FloatVector3, b: FloatVector3): FloatVector3 => scale(add(a, b), 0.5);

function perpendicular(direction: FloatVector3): FloatVector3 {
  const reference = Math.abs(direction.x) < 0.8 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
  return cross(direction, reference);
}

function support(proxy: ConvexProxy, direction: FloatVector3): FloatVector3 {
  const unit = normalize(direction);
  if (proxy.kind === 'sphere') return add(proxy.center, scale(unit, proxy.radius));
  if (proxy.kind === 'capsule') {
    const first = dot(proxy.segment[0], direction) >= dot(proxy.segment[1], direction) ? proxy.segment[0] : proxy.segment[1];
    return add(first, scale(unit, proxy.radius));
  }
  if (proxy.kind === 'convex') {
    let best = proxy.vertices[0] ?? proxy.center;
    let bestProjection = dot(best, direction);
    for (const vertex of proxy.vertices.slice(1)) {
      const projection = dot(vertex, direction);
      if (projection > bestProjection + SUPPORT_EPSILON) { best = vertex; bestProjection = projection; }
    }
    return best;
  }
  let result = proxy.center;
  for (let index = 0; index < 3; index++) {
    const axis = proxy.axes[index]!;
    const extent = index === 0 ? proxy.halfExtents.x : index === 1 ? proxy.halfExtents.y : proxy.halfExtents.z;
    result = add(result, scale(axis, (dot(axis, direction) >= 0 ? 1 : -1) * extent));
  }
  return result;
}

function minkowskiSupport(a: ConvexProxy, b: ConvexProxy, direction: FloatVector3): SimplexVertex {
  const witnessA = support(a, direction), witnessB = support(b, neg(direction));
  return { point: sub(witnessA, witnessB), witnessA, witnessB };
}

function lineSimplex(vertices: SimplexVertex[]): SimplexUpdate {
  const a = vertices[vertices.length - 1]!, b = vertices[vertices.length - 2]!;
  const ab = sub(b.point, a.point), ao = neg(a.point);
  if (length(ao) <= SUPPORT_EPSILON) return { simplex: [a], direction: ao, containsOrigin: true };
  if (dot(ab, ao) > 0) {
    const direction = tripleCross(ab, ao, ab);
    return { simplex: [b, a], direction: length(direction) <= EPSILON ? perpendicular(ab) : direction, containsOrigin: false };
  }
  return { simplex: [a], direction: ao, containsOrigin: false };
}

function triangleSimplex(vertices: SimplexVertex[]): SimplexUpdate {
  const a = vertices[vertices.length - 1]!, b = vertices[vertices.length - 2]!, c = vertices[vertices.length - 3]!;
  const ab = sub(b.point, a.point), ac = sub(c.point, a.point), ao = neg(a.point), abc = cross(ab, ac);
  if (length(ao) <= SUPPORT_EPSILON) return { simplex: [a], direction: ao, containsOrigin: true };

  const acPerpendicular = cross(abc, ac);
  if (dot(acPerpendicular, ao) > 0) {
    if (dot(ac, ao) > 0) {
      const direction = tripleCross(ac, ao, ac);
      return { simplex: [c, a], direction: length(direction) <= EPSILON ? perpendicular(ac) : direction, containsOrigin: false };
    }
    return lineSimplex([b, a]);
  }

  const abPerpendicular = cross(ab, abc);
  if (dot(abPerpendicular, ao) > 0) return lineSimplex([b, a]);
  if (dot(abc, ao) > 0) return { simplex: [c, b, a], direction: abc, containsOrigin: false };
  return { simplex: [b, c, a], direction: neg(abc), containsOrigin: false };
}

function tetrahedronSimplex(vertices: SimplexVertex[]): SimplexUpdate {
  const a = vertices[3]!, b = vertices[2]!, c = vertices[1]!, d = vertices[0]!;
  const ao = neg(a.point), ab = sub(b.point, a.point), ac = sub(c.point, a.point), ad = sub(d.point, a.point);
  if (length(ao) <= SUPPORT_EPSILON) return { simplex: [a], direction: ao, containsOrigin: true };

  const abc = cross(ab, ac), acd = cross(ac, ad), adb = cross(ad, ab);
  if (dot(abc, ao) > 0) return triangleSimplex([c, b, a]);
  if (dot(acd, ao) > 0) return triangleSimplex([d, c, a]);
  if (dot(adb, ao) > 0) return triangleSimplex([b, d, a]);
  return { simplex: vertices, direction: ao, containsOrigin: true };
}

function updateSimplex(vertices: SimplexVertex[]): SimplexUpdate {
  if (vertices.length === 1) {
    const point = vertices[0]!;
    return { simplex: vertices, direction: neg(point.point), containsOrigin: length(point.point) <= SUPPORT_EPSILON };
  }
  if (vertices.length === 2) return lineSimplex(vertices);
  if (vertices.length === 3) return triangleSimplex(vertices);
  return tetrahedronSimplex(vertices.slice(-4));
}

function orientedFace(vertices: SimplexVertex[], a: number, b: number, c: number): Face | undefined {
  const pa = vertices[a]!.point, pb = vertices[b]!.point, pc = vertices[c]!.point;
  let normal = normalize(cross(sub(pb, pa), sub(pc, pa)));
  if (length(cross(sub(pb, pa), sub(pc, pa))) <= EPSILON) return undefined;
  let first = a, second = b, third = c;
  if (dot(normal, pa) < 0) {
    normal = neg(normal);
    second = c;
    third = b;
  }
  return { a: first, b: second, c: third, normal, distance: dot(normal, vertices[first]!.point) };
}

function closestTriangleToOrigin(a: FloatVector3, b: FloatVector3, c: FloatVector3): { weights: [number, number, number]; point: FloatVector3 } {
  const ab = sub(b, a), ac = sub(c, a), ap = neg(a);
  const d1 = dot(ab, ap), d2 = dot(ac, ap);
  if (d1 <= 0 && d2 <= 0) return { weights: [1, 0, 0], point: a };
  const bp = neg(b), d3 = dot(ab, bp), d4 = dot(ac, bp);
  if (d3 >= 0 && d4 <= d3) return { weights: [0, 1, 0], point: b };
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) { const value = d1 / (d1 - d3); return { weights: [1 - value, value, 0], point: add(a, scale(ab, value)) }; }
  const cp = neg(c), d5 = dot(ab, cp), d6 = dot(ac, cp);
  if (d6 >= 0 && d5 <= d6) return { weights: [0, 0, 1], point: c };
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) { const value = d2 / (d2 - d6); return { weights: [1 - value, 0, value], point: add(a, scale(ac, value)) }; }
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && (d4 - d3) >= 0 && (d5 - d6) >= 0) { const value = (d4 - d3) / ((d4 - d3) + (d5 - d6)); return { weights: [0, 1 - value, value], point: add(b, scale(sub(c, b), value)) }; }
  const denominator = 1 / (va + vb + vc), v = vb * denominator, w = vc * denominator;
  return { weights: [1 - v - w, v, w], point: add(a, add(scale(ab, v), scale(ac, w))) };
}

function epa(a: ConvexProxy, b: ConvexProxy, simplex: SimplexVertex[]): { contact?: ConvexContact; iterations: number } {
  if (simplex.length !== 4) return { iterations: 0 };
  const vertices = [...simplex];
  let faces = ([
    orientedFace(vertices, 0, 1, 2),
    orientedFace(vertices, 0, 3, 1),
    orientedFace(vertices, 0, 2, 3),
    orientedFace(vertices, 1, 3, 2)
  ]).filter((face): face is Face => Boolean(face));
  if (faces.length !== 4) return { iterations: 0 };

  for (let iteration = 1; iteration <= MAX_EPA_ITERATIONS; iteration++) {
    faces.sort((left, right) => left.distance - right.distance || left.a - right.a || left.b - right.b || left.c - right.c);
    const face = faces[0];
    if (!face) return { iterations: iteration };
    const next = minkowskiSupport(a, b, face.normal), supportDistance = dot(next.point, face.normal);
    if (supportDistance - face.distance <= SUPPORT_EPSILON) {
      const closest = closestTriangleToOrigin(vertices[face.a]!.point, vertices[face.b]!.point, vertices[face.c]!.point);
      const witnessA = add(add(scale(vertices[face.a]!.witnessA, closest.weights[0]), scale(vertices[face.b]!.witnessA, closest.weights[1])), scale(vertices[face.c]!.witnessA, closest.weights[2]));
      const witnessB = add(add(scale(vertices[face.a]!.witnessB, closest.weights[0]), scale(vertices[face.b]!.witnessB, closest.weights[1])), scale(vertices[face.c]!.witnessB, closest.weights[2]));
      return { iterations: iteration, contact: { point: midpoint(witnessA, witnessB), normal: face.normal, penetration: Math.max(0, face.distance) } };
    }

    const newIndex = vertices.length;
    vertices.push(next);
    const visible = faces.filter(current => dot(current.normal, sub(next.point, vertices[current.a]!.point)) > SUPPORT_EPSILON);
    if (!visible.length) return { iterations: iteration };
    const boundary = new Map<string, [number, number]>();
    const addEdge = (first: number, second: number): void => {
      const reverse = `${second}:${first}`;
      if (boundary.has(reverse)) boundary.delete(reverse);
      else boundary.set(`${first}:${second}`, [first, second]);
    };
    for (const current of visible) { addEdge(current.a, current.b); addEdge(current.b, current.c); addEdge(current.c, current.a); }
    const visibleSet = new Set(visible);
    faces = faces.filter(current => !visibleSet.has(current));
    for (const [first, second] of boundary.values()) {
      const nextFace = orientedFace(vertices, first, second, newIndex);
      if (nextFace) faces.push(nextFace);
    }
    if (faces.length < 4) return { iterations: iteration };
  }
  return { iterations: MAX_EPA_ITERATIONS };
}

function sphereSphereContact(a: Extract<ConvexProxy, { kind: 'sphere' }>, b: Extract<ConvexProxy, { kind: 'sphere' }>): ConvexContact | undefined {
  const delta = sub(b.center, a.center), distance = length(delta), radius = a.radius + b.radius;
  if (distance >= radius) return undefined;
  const normal = distance <= EPSILON ? { x: 1, y: 0, z: 0 } : scale(delta, 1 / distance);
  const witnessA = add(a.center, scale(normal, a.radius));
  const witnessB = sub(b.center, scale(normal, b.radius));
  return { point: midpoint(witnessA, witnessB), normal, penetration: Math.max(0, radius - distance) };
}

export function collideConvex(a: ConvexProxy, b: ConvexProxy): ConvexCollisionResult {
  if (a.kind === 'sphere' && b.kind === 'sphere') {
    const contact = sphereSphereContact(a, b);
    return contact ? { status: 'collision', contact, gjkIterations: 0, epaIterations: 0 } : { status: 'separated', gjkIterations: 0, epaIterations: 0 };
  }
  let direction = sub(b.center, a.center);
  if (length(direction) <= EPSILON) direction = { x: 1, y: 0, z: 0 };
  let simplex: SimplexVertex[] = [minkowskiSupport(a, b, direction)];
  direction = neg(simplex[0]!.point);
  for (let iteration = 1; iteration <= MAX_GJK_ITERATIONS; iteration++) {
    if (length(direction) <= SUPPORT_EPSILON) {
      const result = epa(a, b, simplex);
      return result.contact ? { status: 'collision', contact: result.contact, gjkIterations: iteration, epaIterations: result.iterations } : { status: 'failed', gjkIterations: iteration, epaIterations: result.iterations };
    }
    const next = minkowskiSupport(a, b, direction);
    if (dot(next.point, direction) <= SUPPORT_EPSILON) return { status: 'separated', gjkIterations: iteration, epaIterations: 0 };
    const update = updateSimplex([...simplex, next]);
    simplex = update.simplex;
    if (update.containsOrigin) {
      const result = epa(a, b, simplex);
      return result.contact ? { status: 'collision', contact: result.contact, gjkIterations: iteration, epaIterations: result.iterations } : { status: 'failed', gjkIterations: iteration, epaIterations: result.iterations };
    }
    direction = update.direction;
  }
  return { status: 'failed', gjkIterations: MAX_GJK_ITERATIONS, epaIterations: 0 };
}
