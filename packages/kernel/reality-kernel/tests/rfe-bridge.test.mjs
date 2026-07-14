import test from 'node:test';
import assert from 'node:assert/strict';
import {createRealityObject} from '../src/object-abi.mjs';
import {RealityGraph} from '../src/reality-graph.mjs';
import {ContinuityLedger, createContinuityClaim, createSubjectSovereigntyEnvelope} from '../src/continuity.mjs';
import {authorizeTransition, buildTransitionEnvelope, RealityTransitionVM} from '../src/transition-vm.mjs';
import {commitToRfe, graphFromRfeMaterialized} from '../src/rfe-bridge.mjs';

class FakeRfeStore {
  constructor(materialized) {
    this.state = materialized;
    this.lastCommit = null;
  }

  materialize() {
    return structuredClone(this.state);
  }

  commit(input) {
    this.lastCommit = structuredClone(input);
    return {
      generation: {generationId: 'generation:1', branchId: input.branchId, integrityHash: 'generation-root'},
      receipt: {integrityHash: 'receipt-root'}
    };
  }
}

test('RFE bridge maps a kernel transition to the existing local commit seam', () => {
  const materialized = {
    generation: {
      worldId: 'world:test',
      branchId: 'branch:main',
      generationId: 'generation:0',
      realityRevision: 0,
      logicalTime: 0
    },
    identities: [],
    facts: [],
    relations: []
  };
  const store = new FakeRfeStore(materialized);
  const graph = graphFromRfeMaterialized(materialized);
  const door = createRealityObject({id: 'object:door', kind: 'door', state: {locked: false}});
  const envelope = authorizeTransition(buildTransitionEnvelope({
    transitionId: 'transition:rfe-bridge',
    worldId: graph.worldId,
    baseRoot: graph.realityRoot,
    actor: 'subject:alice',
    intent: {goal: 'create unlocked door'},
    operations: [{op: 'create-object', object: door}]
  }), {decisionId: 'decision:rfe-bridge', principal: 'authority:owner'});

  const result = commitToRfe(store, envelope, {evidence: [{id: 'evidence:fixture'}]});
  assert.equal(result.kernel.phase, 'preview');
  assert.equal(store.lastCommit.baseGenerationId, 'generation:0');
  assert.equal(store.lastCommit.authority, 'authority:owner');
  assert.deepEqual(store.lastCommit.operations.map((operation) => operation.op), ['createIdentity', 'setFact']);
  assert.equal(store.lastCommit.operations[0].identity.id, 'object:door');
  assert.deepEqual(store.lastCommit.operations[1].fact.value, {locked: false});
  assert.deepEqual(store.lastCommit.evidence, [{id: 'evidence:fixture'}]);
});

test('RFE bridge advances continuity only after the persistence commit seam', () => {
  const materialized = {
    generation: {
      worldId: 'world:test',
      branchId: 'branch:main',
      generationId: 'generation:0',
      realityRevision: 0,
      logicalTime: 0
    },
    identities: [],
    facts: [],
    relations: []
  };
  const store = new FakeRfeStore(materialized);
  const graph = graphFromRfeMaterialized(materialized);
  const claim = createContinuityClaim({subjectId: 'subject:alice'});
  const envelope = authorizeTransition(buildTransitionEnvelope({
    transitionId: 'transition:rfe-continuity',
    worldId: graph.worldId,
    baseRoot: graph.realityRoot,
    actor: claim.subjectId,
    intent: {goal: 'create continuity-bound object'},
    operations: [{op: 'create-object', object: createRealityObject({id: 'object:seed', kind: 'seed', state: {ready: true}})}],
    continuity: {
      claim,
      sovereignty: createSubjectSovereigntyEnvelope({
        claim,
        transitionId: 'transition:rfe-continuity',
        leaseId: 'lease:alice',
        fencingToken: 1,
        nonce: 'nonce:rfe-continuity'
      })
    }
  }), {decisionId: 'decision:rfe-continuity', principal: 'authority:owner'});
  const ledger = new ContinuityLedger();
  const result = commitToRfe(store, envelope, {
    vm: new RealityTransitionVM({continuityLedger: ledger, requireContinuity: true})
  });
  assert.equal(result.kernel.phase, 'preview');
  assert.equal(result.continuity.claimRoot, claim.claimRoot);
  assert.equal(ledger.getHead('subject:alice').claimRoot, claim.claimRoot);
});
