import {
  canonicalClone,
  compareUtf8,
  createWorldBodyIR,
  semanticHash,
  validateRenderGraph,
  verifyWorldBodyIR,
} from '@taowind/world-body-ir';
import { defineTheorem } from '@taowind/world-body-formal-kernel';
import {
  buildRsrReferenceFixture,
  createRsrReferenceSnapshot,
  replayRsrReference,
  restoreRsrReferenceSnapshot,
  rsrReferenceStep,
  verifyRsrTraceRefinement,
  worldBodyToRsrReferenceState,
} from '@taowind/rsr-formal-theory';
import {
  buildVsrReferenceFixture,
  verifyVsrProjectionRefinement,
  visibleObjectsForObserver,
  worldBodyToVsrReferenceProjection,
} from '@taowind/vsr-formal-theory';

export const WORLD_BODY_JOINT_THEORY_VERSION = '0.1.0-alpha.1';

function unseal(ir) {
  const { roots, ...input } = canonicalClone(ir);
  return input;
}

export function advanceWorldBodyReference(ir, commands = []) {
  const before = worldBodyToRsrReferenceState(ir);
  const afterState = rsrReferenceStep(before, commands);
  const nextInput = unseal(ir);
  nextInput.generation = ir.generation;
  nextInput.revision = ir.revision + 1;
  nextInput.authorityState = {
    ...nextInput.authorityState,
    generation: nextInput.generation,
    revision: nextInput.revision,
    authorityClass: 'authoritative-snapshot',
    sourceRealityRoot: afterState.stateRoot,
  };
  delete nextInput.authorityState.commitRoot;
  nextInput.physicalBodyState = {
    ...nextInput.physicalBodyState,
    bodies: canonicalClone(afterState.bodies),
  };
  nextInput.temporalPresentationState = {
    ...nextInput.temporalPresentationState,
    clock: { ...nextInput.temporalPresentationState.clock, tick: afterState.tick },
  };
  nextInput.worldEventState = {
    ...nextInput.worldEventState,
    events: nextInput.worldEventState.events.map(event => ({
      ...event,
      sourceAuthorityRoot: afterState.stateRoot,
      exactlyOnceKey: `${afterState.stateRoot}:${afterState.tick}:${event.sequence}`,
      tick: afterState.tick,
    })),
  };
  const afterIr = createWorldBodyIR(nextInput);
  const projection = worldBodyToVsrReferenceProjection(afterIr);
  const base = {
    format: 'taowind.world-body-joint-transition.v0.1',
    theoryVersion: WORLD_BODY_JOINT_THEORY_VERSION,
    beforeWorldBodyRoot: ir.roots.worldBodyRoot,
    beforeAuthorityRoot: ir.authorityState.sourceRealityRoot,
    afterWorldBodyRoot: afterIr.roots.worldBodyRoot,
    afterAuthorityRoot: afterState.stateRoot,
    afterPhysicalRoot: afterIr.roots.physicalBodyRoot,
    presentationRoot: projection.projectionRoot,
    presentationSourceAuthorityRoot: projection.sourceAuthorityRoot,
    presentationSourcePhysicalRoot: projection.sourcePhysicalRoot,
    commandRoot: semanticHash(commands),
  };
  return canonicalClone({
    ...base,
    transitionRoot: semanticHash(base),
    beforeState: before,
    afterState,
    afterIr,
    projection,
  });
}

export function routeWorldEvents(ir) {
  const deliveries = ir.worldEventState.events.flatMap(event => event.routes.map(route => ({
    eventId: event.id,
    routeId: route.id,
    consumer: route.consumer,
    target: route.target,
    sourceAuthorityRoot: event.sourceAuthorityRoot,
    deliveryKey: `${event.exactlyOnceKey}:${route.id}`,
  })));
  const ordered = deliveries.sort((left, right) => compareUtf8(left.deliveryKey, right.deliveryKey));
  const base = {
    format: 'taowind.world-body-event-delivery-plan.v0.1',
    sourceWorldBodyRoot: ir.roots.worldBodyRoot,
    deliveries: ordered,
  };
  return canonicalClone({ ...base, deliveryPlanRoot: semanticHash(base) });
}

export function forkWorldBodyReference(ir, branchId, commands = []) {
  if (typeof branchId !== 'string' || branchId.length === 0) throw new TypeError('branchId is required');
  const transition = advanceWorldBodyReference(ir, commands);
  const base = {
    format: 'taowind.world-body-reference-branch.v0.1',
    branchId,
    baseWorldBodyRoot: ir.roots.worldBodyRoot,
    candidateWorldBodyRoot: transition.afterIr.roots.worldBodyRoot,
    transitionRoot: transition.transitionRoot,
    authorityClass: 'candidate',
  };
  return canonicalClone({ ...base, branchRoot: semanticHash(base), transition });
}

export function verifyJointRefinement(reference, implementation, options = {}) {
  const rsr = verifyRsrTraceRefinement(reference.rsr, implementation.rsr, { toleranceMm: options.rsrToleranceMm ?? 0 });
  const vsr = verifyVsrProjectionRefinement(reference.vsr, implementation.vsr, { toleranceMm: options.vsrToleranceMm ?? 0 });
  const authorityBound = implementation.vsr.sourceAuthorityRoot === implementation.authorityRoot;
  const errors = [
    ...rsr.errors.map(error => ({ layer: 'RSR', ...error })),
    ...vsr.errors.map(error => ({ layer: 'VSR', ...error })),
    ...(authorityBound ? [] : [{ layer: 'JOINT', code: 'WB_REFINEMENT_AUTHORITY_BINDING_MISMATCH' }]),
  ];
  return { ok: errors.length === 0, errors, rsr, vsr, authorityBound };
}

export function buildWorldBodyJointFixture(ir) {
  const rsrFixture = buildRsrReferenceFixture(ir);
  const vsrFixture = buildVsrReferenceFixture(ir);
  const dynamic = rsrFixture.initial.bodies.find(body => body.kind === 'dynamic');
  const commandA = dynamic ? [{ id: 'command:branch-a', tick: rsrFixture.initial.tick + 1, sequence: 0, bodyId: dynamic.id, kind: 'set-velocity', value: { x: 900, y: 0, z: 0 } }] : [];
  const commandB = dynamic ? [{ id: 'command:branch-b', tick: rsrFixture.initial.tick + 1, sequence: 0, bodyId: dynamic.id, kind: 'set-velocity', value: { x: -900, y: 0, z: 0 } }] : [];
  const transition = advanceWorldBodyReference(ir, commandA);
  const eventPlan = routeWorldEvents(transition.afterIr);
  const rollbackSnapshot = createRsrReferenceSnapshot(transition.afterState);
  const rollbackState = restoreRsrReferenceSnapshot(rollbackSnapshot);
  const branchA = forkWorldBodyReference(ir, 'branch:a', commandA);
  const branchB = forkWorldBodyReference(ir, 'branch:b', commandB);
  const observer = ir.observerState.observers[0];
  const visible = visibleObjectsForObserver(vsrFixture.projection, observer);
  const jointReference = {
    authorityRoot: transition.afterState.stateRoot,
    rsr: transition.afterState,
    vsr: transition.projection,
  };
  return canonicalClone({
    format: 'taowind.world-body-joint-fixture.v0.1',
    ir,
    rsrFixture,
    vsrFixture,
    transition,
    eventPlan,
    rollbackSnapshot,
    rollbackState,
    branchA,
    branchB,
    observerVisibleEntityIds: visible.map(object => object.entityId).sort(),
    jointReference,
    jointImplementation: canonicalClone(jointReference),
  });
}

export const WORLD_BODY_THEOREMS = Object.freeze([
  defineTheorem({
    id: 'WB-T1', domain: 'WORLD_BODY', level: 1, title: 'Seven-root closure',
    statement: 'A valid World Body document closes all seven root objects, BodyMap, Render Graph set, and the world root.',
    classification: 'EXACT', assumptions: ['World Body IR v0.1 validator is normative'],
    predicate: subject => ({ ok: verifyWorldBodyIR(subject.ir).ok && Object.keys(subject.ir.roots).length === 10, observations: { worldBodyRoot: subject.ir.roots.worldBodyRoot } }),
  }),
  defineTheorem({
    id: 'WB-T2', domain: 'WORLD_BODY', level: 1, title: 'BodyMap total functional binding',
    statement: 'Each declared entity has at most one physical reference, exactly one visual reference, and exactly one temporal policy reference.',
    classification: 'EXACT', assumptions: ['Presentation-only entities explicitly omit physicalBodyRef'],
    predicate: subject => {
      const physicalRefs = new Set(subject.ir.bodyMaps.flatMap(map => map.physicalBodyRef ? [map.physicalBodyRef] : []));
      const visualRefs = new Set(subject.ir.bodyMaps.map(map => map.visualBodyRef));
      const functional = new Set(subject.ir.bodyMaps.map(map => map.entityId)).size === subject.ir.bodyMaps.length
        && subject.ir.bodyMaps.every(map => map.visualBodyRef && map.temporalPolicyRef && (map.authorityMode === 'presentation-only' || map.physicalBodyRef));
      const total = subject.ir.physicalBodyState.bodies.every(body => physicalRefs.has(body.id))
        && subject.ir.visualBodyState.bodies.every(body => visualRefs.has(body.id));
      return { ok: functional && total, observations: { bindingCount: subject.ir.bodyMaps.length, physicalCoverage: physicalRefs.size, visualCoverage: visualRefs.size } };
    },
  }),
  defineTheorem({
    id: 'WB-T3', domain: 'WORLD_BODY', level: 2, title: 'Authority-presentation non-interference',
    statement: 'Presentation binds authority and physical roots but cannot mutate either root.',
    classification: 'EXACT', assumptions: ['Projection is pure and owns no commit capability'],
    predicate: subject => ({ ok: subject.vsrFixture.projection.sourceAuthorityRoot === subject.ir.authorityState.sourceRealityRoot && subject.vsrFixture.projection.sourcePhysicalRoot === subject.ir.roots.physicalBodyRoot, observations: { presentationRoot: subject.vsrFixture.projection.projectionRoot } }),
  }),
  defineTheorem({
    id: 'WB-T4', domain: 'WORLD_BODY', level: 2, title: 'Single-source exactly-once event routing',
    statement: 'Every routed event delivery has one authority source and one unique delivery key; no route owns authority.',
    classification: 'EXACT', assumptions: [],
    predicate: subject => {
      const deliveries = subject.eventPlan.deliveries;
      return { ok: new Set(deliveries.map(item => item.deliveryKey)).size === deliveries.length && deliveries.every(item => item.sourceAuthorityRoot === subject.transition.afterAuthorityRoot && item.consumer !== 'authority'), observations: { deliveryCount: deliveries.length, deliveryPlanRoot: subject.eventPlan.deliveryPlanRoot } };
    },
  }),
  defineTheorem({
    id: 'WB-T5', domain: 'WORLD_BODY', level: 3, title: 'Commuting authority-to-presentation transition',
    statement: 'After a physical transition, the projection source roots equal the new authority and physical roots.',
    classification: 'EXACT', assumptions: ['The transition adapter reseals World Body IR before projection'],
    predicate: subject => ({ ok: subject.transition.presentationSourceAuthorityRoot === subject.transition.afterAuthorityRoot && subject.transition.presentationSourcePhysicalRoot === subject.transition.afterPhysicalRoot, observations: { transitionRoot: subject.transition.transitionRoot } }),
  }),
  defineTheorem({
    id: 'WB-T6', domain: 'WORLD_BODY', level: 3, title: 'Snapshot rollback identity',
    statement: 'Restoring a sealed physical snapshot recovers the exact post-transition state root without changing the base World Body root.',
    classification: 'EXACT', assumptions: [],
    predicate: subject => ({ ok: subject.rollbackState.stateRoot === subject.transition.afterState.stateRoot && subject.branchA.baseWorldBodyRoot === subject.ir.roots.worldBodyRoot, observations: { snapshotRoot: subject.rollbackSnapshot.snapshotRoot } }),
  }),
  defineTheorem({
    id: 'WB-T7', domain: 'WORLD_BODY', level: 4, title: 'Generated render-graph safety closure',
    statement: 'Every World Body render graph is a valid DAG with initialized resources, ordered hazards, disjoint aliases, and complete barriers.',
    classification: 'EXACT', assumptions: ['World Body Render Graph validator is normative'],
    predicate: subject => ({ ok: subject.ir.renderGraphs.every(graph => validateRenderGraph(graph).ok), observations: { renderGraphRoots: subject.ir.renderGraphs.map(graph => graph.graphRoot) } }),
  }),
  defineTheorem({
    id: 'WB-T8', domain: 'WORLD_BODY', level: 4, title: 'Branch and observer isolation',
    statement: 'Candidate branches share one immutable base root, diverge by their commands, and observer filtering changes no authority root.',
    classification: 'EXACT', assumptions: ['Branches are candidate-only until an external authority commit'],
    predicate: subject => ({ ok: subject.branchA.baseWorldBodyRoot === subject.branchB.baseWorldBodyRoot && subject.branchA.branchRoot !== subject.branchB.branchRoot && subject.ir.roots.worldBodyRoot === subject.branchA.baseWorldBodyRoot && Array.isArray(subject.observerVisibleEntityIds), observations: { branchRoots: [subject.branchA.branchRoot, subject.branchB.branchRoot] } }),
  }),
  defineTheorem({
    id: 'WB-T9', domain: 'WORLD_BODY', level: 5, title: 'Compositional refinement',
    statement: 'If RSR and VSR refinement relations hold and the VSR source authority equals the implementation authority root, the selected joint observables refine.',
    classification: 'CONDITIONAL', assumptions: ['RSR and VSR adapters are total for their declared observables', 'Tolerance bounds are explicit'],
    predicate: subject => ({ ...verifyJointRefinement(subject.jointReference, subject.jointImplementation), observations: { rsrToleranceMm: 0, vsrToleranceMm: 0 } }),
  }),
  defineTheorem({
    id: 'WB-T10', domain: 'WORLD_BODY', level: 5, title: 'Full external production differential',
    statement: 'The complete declaration-to-RSR-to-network-to-VSR-to-real-GPU/VM/backend chain is differentially equivalent in its declared production scope.',
    classification: 'UNVERIFIED_EXTERNAL', assumptions: ['Real RCL VM, target physics/backend, network recovery, browser GPU, pixels, and target hardware are all executed with independent oracles'],
  }),
]);

export const WORLD_BODY_THEOREM_MANIFEST = Object.freeze(WORLD_BODY_THEOREMS.map(theorem => Object.freeze({
  id: theorem.id,
  domain: theorem.domain,
  level: theorem.level,
  title: theorem.title,
  statement: theorem.statement,
  classification: theorem.classification,
  assumptions: [...theorem.assumptions],
})));
