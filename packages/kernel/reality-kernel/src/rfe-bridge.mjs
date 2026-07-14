import {RealityKernelError, clone, rootHash} from './canonical.mjs';
import {createRealityObject} from './object-abi.mjs';
import {createRealityRelation, RealityGraph} from './reality-graph.mjs';
import {RealityTransitionVM} from './transition-vm.mjs';

const STATE_PREDICATE = 'reality:state';

function active(record, logicalTime) {
  return Number(record.validFrom ?? 0) <= logicalTime &&
    (record.validTo === null || record.validTo === undefined || logicalTime < Number(record.validTo));
}

export function graphFromRfeMaterialized(materialized) {
  if (!materialized?.generation) throw new RealityKernelError('RK_RFE_MATERIALIZED_REQUIRED', 'materialized generation is required');
  const generation = materialized.generation;
  const logicalTime = Number(generation.logicalTime ?? 0);
  const graph = new RealityGraph({
    worldId: generation.worldId ?? generation.reality_id ?? 'world:default',
    revision: Number(generation.realityRevision ?? generation.generation ?? 0),
    logicalTime
  });
  for (const identity of materialized.identities ?? []) {
    const metadata = identity.metadata ?? {};
    const stateFact = (materialized.facts ?? []).find((fact) =>
      fact.subject === identity.id && fact.predicate === STATE_PREDICATE && active(fact, logicalTime)
    );
    graph.addObject(createRealityObject({
      id: identity.id,
      kind: identity.kind ?? 'identity',
      schema: metadata.realitySchema ?? `${identity.kind ?? 'identity'}.v1`,
      version: Number(metadata.realityVersion ?? 1),
      state: stateFact?.value ?? {},
      tags: metadata.realityTags ?? [],
      metadata: metadata.realityMetadata ?? {},
      provenance: metadata.realityProvenance ?? {}
    }));
  }
  for (const relation of materialized.relations ?? []) {
    if (!active(relation, logicalTime)) continue;
    graph.addRelation(createRealityRelation({
      type: relation.type,
      from: relation.from,
      to: relation.to,
      qualifiers: relation.qualifiers ?? {},
      metadata: relation.metadata ?? {}
    }));
  }
  return graph;
}

function identityFor(object) {
  return {
    id: object.id,
    kind: object.kind,
    createdAt: '$logicalTime',
    retiredAt: null,
    lineage: [],
    metadata: {
      realitySchema: object.schema,
      realityVersion: object.version,
      realityTags: clone(object.tags),
      realityMetadata: clone(object.metadata),
      realityProvenance: clone(object.provenance)
    }
  };
}

export function transitionToRfeOperations(beforeGraph, afterGraph, envelope) {
  const operations = [];
  for (const operation of envelope.operations) {
    if (operation.op === 'create-object') {
      const object = afterGraph.getObject(operation.object?.id ?? operation.spec?.id);
      if (!object) throw new RealityKernelError('RK_RFE_OBJECT_MISSING', operation.object?.id ?? operation.spec?.id);
      operations.push({op: 'createIdentity', identity: identityFor(object)});
      operations.push({op: 'setFact', fact: {subject: object.id, predicate: STATE_PREDICATE, value: object.state, source: 'source:reality-kernel'}});
    } else if (operation.op === 'set-state') {
      const object = afterGraph.getObject(operation.objectId);
      if (!object) throw new RealityKernelError('RK_RFE_OBJECT_MISSING', operation.objectId);
      operations.push({op: 'setFact', fact: {subject: object.id, predicate: STATE_PREDICATE, value: object.state, source: 'source:reality-kernel'}});
    } else if (operation.op === 'add-relation') {
      const relation = afterGraph.listRelations({from: operation.relation.from, to: operation.relation.to})
        .find((candidate) => candidate.type === operation.relation.type &&
          rootHash(candidate.qualifiers ?? {}) === rootHash(operation.relation.qualifiers ?? {}));
      if (!relation) throw new RealityKernelError('RK_RFE_RELATION_MISSING', operation.relation.type);
      operations.push({op: 'addRelation', relation: {
        type: relation.type,
        from: relation.from,
        to: relation.to,
        qualifiers: relation.qualifiers,
        authority: 'reality-kernel'
      }});
    } else if (operation.op === 'remove-relation') {
      operations.push({op: 'removeRelation', match: clone(operation.match)});
    } else {
      throw new RealityKernelError('RK_RFE_OPERATION_UNSUPPORTED', operation.op);
    }
  }
  return operations;
}

export function commitToRfe(store, envelope, {
  vm = new RealityTransitionVM(),
  branchId = null,
  evidence = []
} = {}) {
  if (!store || typeof store.materialize !== 'function' || typeof store.commit !== 'function') {
    throw new RealityKernelError('RK_RFE_STORE_REQUIRED', 'store must expose materialize() and commit()');
  }
  const materialized = store.materialize();
  const beforeGraph = graphFromRfeMaterialized(materialized);
  const kernel = vm.execute(beforeGraph, envelope);
  const afterGraph = RealityGraph.fromSnapshot(kernel.snapshot);
  const generation = materialized.generation;
  const rfe = store.commit({
    actor: envelope.actor,
    intent: clone(envelope.intent),
    authority: envelope.authority.principal,
    operations: transitionToRfeOperations(beforeGraph, afterGraph, envelope),
    branchId: branchId ?? generation.branchId ?? store.defaultBranch,
    baseGenerationId: generation.generationId,
    evidence: clone(evidence)
  });
  return {kernel, rfe};
}

export {STATE_PREDICATE};
