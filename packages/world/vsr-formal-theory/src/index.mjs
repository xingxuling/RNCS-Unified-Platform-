import {
  canonicalClone,
  compareUtf8,
  composeBodyMapTransform,
  normalizeQuaternion,
  semanticHash,
  validateRenderGraph,
  verifyWorldBodyIR,
} from '@taowind/world-body-ir';
import { defineTheorem } from '@taowind/world-body-formal-kernel';

export const VSR_FORMAL_THEORY_VERSION = '0.1.0-alpha.1';
export const VSR_REFERENCE_PROJECTION_FORMAT = 'taowind.vsr-reference-projection.v0.1';
export const PBR_SCALE = 1_000_000;

function projectionBase(projection) {
  const { projectionRoot, ...base } = projection;
  return base;
}

function sealProjection(projection) {
  const base = canonicalClone(projectionBase(projection));
  return canonicalClone({ ...base, projectionRoot: semanticHash(base) });
}

function assertProjection(projection) {
  if (!projection || projection.format !== VSR_REFERENCE_PROJECTION_FORMAT) throw Object.assign(new Error('VSR_FORMAL_PROJECTION_FORMAT_INVALID'), { code: 'VSR_FORMAL_PROJECTION_FORMAT_INVALID' });
  if (semanticHash(projectionBase(projection)) !== projection.projectionRoot) throw Object.assign(new Error('VSR_FORMAL_PROJECTION_ROOT_MISMATCH'), { code: 'VSR_FORMAL_PROJECTION_ROOT_MISMATCH' });
  return projection;
}

function addVector(left, right) {
  return Object.fromEntries(['x', 'y', 'z'].map(axis => [axis, left[axis] + right[axis]]));
}

export function worldBodyToVsrReferenceProjection(ir, options = {}) {
  const verification = verifyWorldBodyIR(ir);
  if (!verification.ok) throw Object.assign(new Error('VSR_FORMAL_WBIR_INVALID'), { code: 'VSR_FORMAL_WBIR_INVALID', details: verification.errors });
  const physicalBodies = new Map(ir.physicalBodyState.bodies.map(body => [body.id, body]));
  const visualBodies = new Map(ir.visualBodyState.bodies.map(body => [body.id, body]));
  const objects = [...ir.bodyMaps]
    .sort((left, right) => compareUtf8(left.entityId, right.entityId))
    .map(map => {
      const physical = map.physicalBodyRef ? physicalBodies.get(map.physicalBodyRef) : null;
      const visual = visualBodies.get(map.visualBodyRef);
      const baseTransform = physical?.transform ?? {
        positionMm: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1_000_000, scale: 1_000_000 },
      };
      const transform = composeBodyMapTransform(baseTransform, map.visualOnlyOffset);
      const override = options.visualOffsetDeltaMm?.[map.entityId] ?? { x: 0, y: 0, z: 0 };
      return {
        entityId: map.entityId,
        authorityMode: map.authorityMode,
        physicalBodyId: map.physicalBodyRef ?? null,
        authorityBodyRoot: physical ? semanticHash(physical) : null,
        visualBodyId: visual.id,
        temporalPolicyId: map.temporalPolicyRef,
        positionMm: addVector(transform.positionMm, override),
        rotation: transform.rotation,
        scale: transform.scale,
        nodeIds: visual.nodes.map(node => node.id).sort(),
        assetIds: visual.nodes.flatMap(node => node.assetRef ? [node.assetRef] : []).sort(),
        tags: [...new Set(visual.nodes.flatMap(node => node.tags ?? []))].sort(),
      };
    });
  return sealProjection({
    format: VSR_REFERENCE_PROJECTION_FORMAT,
    theoryVersion: VSR_FORMAL_THEORY_VERSION,
    worldId: ir.worldId,
    generation: ir.generation,
    revision: ir.revision,
    tick: ir.temporalPresentationState.clock.tick,
    sourceAuthorityRoot: ir.authorityState.sourceRealityRoot,
    sourcePhysicalRoot: ir.roots.physicalBodyRoot,
    sourceWorldBodyRoot: ir.roots.worldBodyRoot,
    objects,
    assets: ir.assetState.assets.map(asset => canonicalClone(asset)).sort((left, right) => compareUtf8(left.id, right.id)),
    observers: ir.observerState.observers.map(observer => canonicalClone(observer)).sort((left, right) => compareUtf8(left.id, right.id)),
    renderGraphRoots: ir.renderGraphs.map(graph => graph.graphRoot).sort(),
  });
}

function assertFraction(numerator, denominator) {
  if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator) || denominator <= 0 || numerator < 0 || numerator > denominator) {
    throw Object.assign(new Error('VSR_FORMAL_SAMPLE_FRACTION_INVALID'), { code: 'VSR_FORMAL_SAMPLE_FRACTION_INVALID' });
  }
}

export function interpolateVector3(left, right, numerator, denominator) {
  assertFraction(numerator, denominator);
  return Object.fromEntries(['x', 'y', 'z'].map(axis => [
    axis,
    Math.round((left[axis] * (denominator - numerator) + right[axis] * numerator) / denominator),
  ]));
}

export function interpolateQuaternion(left, right, numerator, denominator) {
  assertFraction(numerator, denominator);
  const dot = left.x * right.x + left.y * right.y + left.z * right.z + left.w * right.w;
  const sign = dot < 0 ? -1 : 1;
  return normalizeQuaternion(Object.fromEntries(['x', 'y', 'z', 'w'].map(component => [
    component,
    left[component] * (denominator - numerator) + sign * right[component] * numerator,
  ])));
}

export function sampleTemporalTransform(left, right, numerator, denominator) {
  return {
    positionMm: interpolateVector3(left.positionMm, right.positionMm, numerator, denominator),
    rotation: interpolateQuaternion(left.rotation, right.rotation, numerator, denominator),
    scale: interpolateVector3(left.scale, right.scale, numerator, denominator),
  };
}

export function boundedExtrapolate(positionMm, velocityMmPerSecond, options) {
  const { requestedTicks, tickHz, maximumExtrapolationTicks } = options;
  if (![requestedTicks, tickHz, maximumExtrapolationTicks].every(Number.isSafeInteger) || requestedTicks < 0 || tickHz <= 0 || maximumExtrapolationTicks < 0) {
    throw Object.assign(new Error('VSR_FORMAL_EXTRAPOLATION_OPTIONS_INVALID'), { code: 'VSR_FORMAL_EXTRAPOLATION_OPTIONS_INVALID' });
  }
  const appliedTicks = Math.min(requestedTicks, maximumExtrapolationTicks);
  return {
    positionMm: Object.fromEntries(['x', 'y', 'z'].map(axis => [axis, positionMm[axis] + Math.round(velocityMmPerSecond[axis] * appliedTicks / tickHz)])),
    requestedTicks,
    appliedTicks,
    maximumExtrapolationTicks,
    clamped: appliedTicks !== requestedTicks,
  };
}

function maximumAxisDistance(left, right) {
  return Math.max(...['x', 'y', 'z'].map(axis => Math.abs(left[axis] - right[axis])));
}

export function planTemporalCorrection(predicted, authoritative, policy) {
  const errorMm = maximumAxisDistance(predicted.positionMm, authoritative.positionMm);
  let mode = 'none';
  if (errorMm >= policy.snapDistanceMm) mode = 'snap';
  else if (errorMm > 0) mode = 'blend';
  const base = {
    format: 'taowind.vsr-formal-correction-plan.v0.1',
    entityId: authoritative.entityId,
    mode,
    errorMm,
    blendTicks: mode === 'blend' ? policy.blendTicks : 0,
    sourceAuthorityRoot: authoritative.sourceAuthorityRoot,
  };
  return canonicalClone({ ...base, planRoot: semanticHash(base) });
}

function qMul(...values) {
  return values.reduce((product, value) => Math.round(product * value / PBR_SCALE), PBR_SCALE);
}

export function evaluateDiffusePbrQ(input) {
  const fields = ['metallicQ', 'normalDotLightQ'];
  if (!Array.isArray(input.baseColorQ) || !Array.isArray(input.radianceQ) || input.baseColorQ.length !== 3 || input.radianceQ.length !== 3) throw new TypeError('baseColorQ and radianceQ must have three channels');
  if ([...input.baseColorQ, ...input.radianceQ, ...fields.map(field => input[field])].some(value => !Number.isSafeInteger(value) || value < 0)) throw new TypeError('PBR inputs must be non-negative safe integers');
  if (input.metallicQ > PBR_SCALE || input.normalDotLightQ > PBR_SCALE || input.baseColorQ.some(value => value > PBR_SCALE)) throw new TypeError('normalized PBR inputs exceed scale');
  const diffuseWeightQ = PBR_SCALE - input.metallicQ;
  return input.baseColorQ.map((channel, index) => qMul(channel, diffuseWeightQ, input.radianceQ[index], input.normalDotLightQ));
}

export function visibleObjectsForObserver(projection, observer) {
  assertProjection(projection);
  const tags = new Set(observer.visibleTags ?? []);
  if (tags.size === 0) return canonicalClone(projection.objects);
  return projection.objects.filter(object => object.tags.some(tag => tags.has(tag))).map(object => canonicalClone(object));
}

export function verifyVsrProjectionRefinement(reference, implementation, options = {}) {
  const toleranceMm = options.toleranceMm ?? 0;
  const errors = [];
  if (reference.worldId !== implementation.worldId) errors.push({ code: 'VSR_REFINEMENT_WORLD_MISMATCH' });
  if (reference.sourceAuthorityRoot !== implementation.sourceAuthorityRoot) errors.push({ code: 'VSR_REFINEMENT_AUTHORITY_ROOT_MISMATCH' });
  const expected = new Map(reference.objects.map(object => [object.entityId, object]));
  const actual = new Map(implementation.objects.map(object => [object.entityId, object]));
  if (expected.size !== actual.size) errors.push({ code: 'VSR_REFINEMENT_OBJECT_COUNT_MISMATCH' });
  for (const [entityId, object] of expected) {
    const candidate = actual.get(entityId);
    if (!candidate) {
      errors.push({ code: 'VSR_REFINEMENT_OBJECT_MISSING', entityId });
      continue;
    }
    const errorMm = maximumAxisDistance(object.positionMm, candidate.positionMm);
    if (errorMm > toleranceMm) errors.push({ code: 'VSR_REFINEMENT_POSITION_BOUND', entityId, errorMm, toleranceMm });
    if (object.visualBodyId !== candidate.visualBodyId) errors.push({ code: 'VSR_REFINEMENT_VISUAL_BODY_MISMATCH', entityId });
  }
  return { ok: errors.length === 0, errors, toleranceMm };
}

export function buildVsrReferenceFixture(ir) {
  const projection = worldBodyToVsrReferenceProjection(ir);
  const replay = worldBodyToVsrReferenceProjection(ir);
  const entityId = projection.objects[0].entityId;
  const visualVariant = worldBodyToVsrReferenceProjection(ir, { visualOffsetDeltaMm: { [entityId]: { x: 0, y: 25, z: 0 } } });
  const object = projection.objects[0];
  const temporalLeft = { positionMm: object.positionMm, rotation: object.rotation, scale: object.scale };
  const temporalRight = { positionMm: addVector(object.positionMm, { x: 120, y: 60, z: -30 }), rotation: object.rotation, scale: object.scale };
  const temporalSample = sampleTemporalTransform(temporalLeft, temporalRight, 1, 2);
  const extrapolation = boundedExtrapolate(object.positionMm, { x: 600, y: 0, z: 0 }, { requestedTicks: 8, tickHz: 60, maximumExtrapolationTicks: 2 });
  const policy = ir.temporalPresentationState.policies[0];
  const correctionBlend = planTemporalCorrection(
    { entityId, positionMm: object.positionMm },
    { entityId, positionMm: addVector(object.positionMm, { x: 10, y: 0, z: 0 }), sourceAuthorityRoot: projection.sourceAuthorityRoot },
    policy,
  );
  const correctionSnap = planTemporalCorrection(
    { entityId, positionMm: object.positionMm },
    { entityId, positionMm: addVector(object.positionMm, { x: policy.snapDistanceMm, y: 0, z: 0 }), sourceAuthorityRoot: projection.sourceAuthorityRoot },
    policy,
  );
  const pbr = evaluateDiffusePbrQ({
    baseColorQ: [800_000, 200_000, 100_000],
    metallicQ: 350_000,
    normalDotLightQ: 900_000,
    radianceQ: [1_000_000, 900_000, 800_000],
  });
  return canonicalClone({
    format: 'taowind.vsr-formal-fixture.v0.1',
    ir,
    projection,
    replay,
    visualVariant,
    temporalLeft,
    temporalRight,
    temporalSample,
    extrapolation,
    correctionBlend,
    correctionSnap,
    pbr,
    refinementCandidate: canonicalClone(projection),
  });
}

export const VSR_THEOREMS = Object.freeze([
  defineTheorem({
    id: 'VSR-T1.1', domain: 'VSR', level: 1, title: 'World-body visual well-formedness',
    statement: 'Every VSR reference projection originates from a verified World Body IR.',
    classification: 'EXACT', assumptions: ['World Body IR v0.1 runtime validator is normative'],
    predicate: subject => ({ ok: verifyWorldBodyIR(subject.ir).ok, observations: { worldBodyRoot: subject.ir.roots.worldBodyRoot } }),
  }),
  defineTheorem({
    id: 'VSR-T1.2', domain: 'VSR', level: 1, title: 'Projection source binding',
    statement: 'Every projection carries the exact authority and physical source roots.',
    classification: 'EXACT', assumptions: [],
    predicate: subject => ({ ok: subject.projection.sourceAuthorityRoot === subject.ir.authorityState.sourceRealityRoot && subject.projection.sourcePhysicalRoot === subject.ir.roots.physicalBodyRoot, observations: { sourceAuthorityRoot: subject.projection.sourceAuthorityRoot } }),
  }),
  defineTheorem({
    id: 'VSR-T1.3', domain: 'VSR', level: 1, title: 'Unique visual and asset identity',
    statement: 'Visual objects and assets have unique stable identities.',
    classification: 'EXACT', assumptions: [],
    predicate: subject => ({ ok: new Set(subject.projection.objects.map(object => object.entityId)).size === subject.projection.objects.length && new Set(subject.projection.assets.map(asset => asset.id)).size === subject.projection.assets.length, observations: { objectCount: subject.projection.objects.length, assetCount: subject.projection.assets.length } }),
  }),
  defineTheorem({
    id: 'VSR-T2.1', domain: 'VSR', level: 2, title: 'Authority non-interference',
    statement: 'Projection does not mutate authority or physical component roots.',
    classification: 'EXACT', assumptions: ['Projection functions are pure'],
    predicate: subject => ({ ok: subject.projection.sourceAuthorityRoot === subject.ir.authorityState.sourceRealityRoot && subject.projection.sourcePhysicalRoot === subject.ir.roots.physicalBodyRoot, observations: { physicalRoot: subject.projection.sourcePhysicalRoot } }),
  }),
  defineTheorem({
    id: 'VSR-T2.2', domain: 'VSR', level: 2, title: 'BodyMap transform law',
    statement: 'Every authoritative visual pose is the physical pose composed with the declared visual-only offset.',
    classification: 'EXACT', assumptions: ['Presentation-only entities use the zero authority transform'],
    predicate: subject => {
      const physical = new Map(subject.ir.physicalBodyState.bodies.map(body => [body.id, body]));
      const projected = new Map(subject.projection.objects.map(object => [object.entityId, object]));
      const ok = subject.ir.bodyMaps.every(map => {
        const base = physical.get(map.physicalBodyRef)?.transform ?? { positionMm: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1_000_000, scale: 1_000_000 } };
        const expected = composeBodyMapTransform(base, map.visualOnlyOffset);
        return JSON.stringify(expected.positionMm) === JSON.stringify(projected.get(map.entityId)?.positionMm);
      });
      return { ok, observations: {} };
    },
  }),
  defineTheorem({
    id: 'VSR-T2.3', domain: 'VSR', level: 2, title: 'Observer authority exclusion',
    statement: 'Observer capability sets contain no write, commit, or authorization authority.',
    classification: 'EXACT', assumptions: [],
    predicate: subject => ({ ok: subject.projection.observers.every(observer => observer.capabilities.every(capability => !/(^|[.:/-])(write|commit|authorize)([.:/-]|$)/i.test(capability))), observations: { observerCount: subject.projection.observers.length } }),
  }),
  defineTheorem({
    id: 'VSR-T2.4', domain: 'VSR', level: 2, title: 'Resident asset completeness',
    statement: 'Every asset referenced by the reference projection is declared resident.',
    classification: 'CONDITIONAL', assumptions: ['The reference frame requests only resident assets'],
    predicate: subject => {
      const assets = new Map(subject.projection.assets.map(asset => [asset.id, asset]));
      return { ok: subject.projection.objects.flatMap(object => object.assetIds).every(id => assets.get(id)?.residency === 'resident'), observations: {} };
    },
  }),
  defineTheorem({
    id: 'VSR-T3.1', domain: 'VSR', level: 3, title: 'Deterministic projection',
    statement: 'Equal World Body inputs produce equal presentation roots.',
    classification: 'EXACT', assumptions: [],
    predicate: subject => ({ ok: subject.projection.projectionRoot === subject.replay.projectionRoot, observations: { projectionRoot: subject.projection.projectionRoot } }),
  }),
  defineTheorem({
    id: 'VSR-T3.2', domain: 'VSR', level: 3, title: 'Temporal interpolation bound',
    statement: 'Every sampled position component lies in the closed interval between its two samples, up to integer rounding.',
    classification: 'BOUNDED_NUMERIC', assumptions: ['Sample fraction is in [0,1]'],
    predicate: subject => ({ ok: ['x', 'y', 'z'].every(axis => subject.temporalSample.positionMm[axis] >= Math.min(subject.temporalLeft.positionMm[axis], subject.temporalRight.positionMm[axis]) && subject.temporalSample.positionMm[axis] <= Math.max(subject.temporalLeft.positionMm[axis], subject.temporalRight.positionMm[axis])), observations: { samplePositionMm: subject.temporalSample.positionMm } }),
  }),
  defineTheorem({
    id: 'VSR-T3.3', domain: 'VSR', level: 3, title: 'Bounded extrapolation',
    statement: 'Temporal extrapolation applies no more than maximumExtrapolationTicks.',
    classification: 'EXACT', assumptions: [],
    predicate: subject => ({ ok: subject.extrapolation.appliedTicks <= subject.extrapolation.maximumExtrapolationTicks && subject.extrapolation.clamped === true, observations: { requestedTicks: subject.extrapolation.requestedTicks, appliedTicks: subject.extrapolation.appliedTicks, maximumExtrapolationTicks: subject.extrapolation.maximumExtrapolationTicks } }),
  }),
  defineTheorem({
    id: 'VSR-T3.4', domain: 'VSR', level: 3, title: 'Deterministic correction partition',
    statement: 'Correction is none, blend, or snap according to the declared distance threshold.',
    classification: 'EXACT', assumptions: [],
    predicate: subject => ({ ok: subject.correctionBlend.mode === 'blend' && subject.correctionSnap.mode === 'snap', observations: { blendPlanRoot: subject.correctionBlend.planRoot, snapPlanRoot: subject.correctionSnap.planRoot } }),
  }),
  defineTheorem({
    id: 'VSR-T4.1', domain: 'VSR', level: 4, title: 'Render graph safety',
    statement: 'Every declared render graph is acyclic and free of initialization, ordering, and alias lifetime errors.',
    classification: 'EXACT', assumptions: ['The World Body Render Graph validator is normative'],
    predicate: subject => ({ ok: subject.ir.renderGraphs.every(graph => validateRenderGraph(graph).ok), observations: { graphCount: subject.ir.renderGraphs.length } }),
  }),
  defineTheorem({
    id: 'VSR-T4.2', domain: 'VSR', level: 4, title: 'Barrier completeness',
    statement: 'Every ordered read/write or write/write hazard has its deterministic declared barrier and no unjustified barrier.',
    classification: 'EXACT', assumptions: [],
    predicate: subject => ({ ok: subject.ir.renderGraphs.every(graph => {
      const result = validateRenderGraph(graph);
      return result.ok && result.expectedBarriers.length === graph.barriers.length;
    }), observations: { barrierCount: subject.ir.renderGraphs.reduce((count, graph) => count + graph.barriers.length, 0) } }),
  }),
  defineTheorem({
    id: 'VSR-T4.3', domain: 'VSR', level: 4, title: 'Visual-offset source-root invariance',
    statement: 'A visual-only offset may change a projection root but cannot change its authority or physical source roots.',
    classification: 'EXACT', assumptions: [],
    predicate: subject => ({ ok: subject.projection.projectionRoot !== subject.visualVariant.projectionRoot && subject.projection.sourceAuthorityRoot === subject.visualVariant.sourceAuthorityRoot && subject.projection.sourcePhysicalRoot === subject.visualVariant.sourcePhysicalRoot, observations: { baseProjectionRoot: subject.projection.projectionRoot, variantProjectionRoot: subject.visualVariant.projectionRoot } }),
  }),
  defineTheorem({
    id: 'VSR-T4.4', domain: 'VSR', level: 4, title: 'Non-negative bounded diffuse PBR',
    statement: 'For normalized non-negative inputs, the scaled diffuse term is non-negative and bounded by incoming radiance.',
    classification: 'BOUNDED_NUMERIC', assumptions: ['This theorem covers only the declared diffuse reference term, not complete Cook-Torrance pixels'],
    predicate: subject => ({ ok: subject.pbr.every((value, index) => value >= 0 && value <= [1_000_000, 900_000, 800_000][index]), observations: { pbrQ: subject.pbr } }),
  }),
  defineTheorem({
    id: 'VSR-T5.1', domain: 'VSR', level: 5, title: 'Projection refinement reflexivity',
    statement: 'The declared VSR observable refinement relation is reflexive at zero positional tolerance.',
    classification: 'EXACT', assumptions: ['Observable scope is authority root, entity identity, visual body identity, and position'],
    predicate: subject => ({ ...verifyVsrProjectionRefinement(subject.projection, subject.projection), observations: { toleranceMm: 0 } }),
  }),
  defineTheorem({
    id: 'VSR-T5.2', domain: 'VSR', level: 5, title: 'Adapter refinement sufficiency',
    statement: 'Any implementation projection satisfying the declared relation preserves selected VSR observables within its explicit bound.',
    classification: 'CONDITIONAL', assumptions: ['The production adapter is total for the selected observable scope'],
    predicate: subject => ({ ...verifyVsrProjectionRefinement(subject.projection, subject.refinementCandidate, { toleranceMm: 0 }), observations: { adapter: 'reference-fixture', toleranceMm: 0 } }),
  }),
  defineTheorem({
    id: 'VSR-T5.3', domain: 'VSR', level: 5, title: 'External GPU and pixel equivalence',
    statement: 'A real browser/target GPU backend produces semantically and visually equivalent resources, commands, and pixels.',
    classification: 'UNVERIFIED_EXTERNAL', assumptions: ['A real target adapter, texture path, shadows, pixel capture, and tolerance contract are executed'],
  }),
]);

export const VSR_THEOREM_MANIFEST = Object.freeze(VSR_THEOREMS.map(theorem => Object.freeze({
  id: theorem.id,
  domain: theorem.domain,
  level: theorem.level,
  title: theorem.title,
  statement: theorem.statement,
  classification: theorem.classification,
  assumptions: [...theorem.assumptions],
})));
