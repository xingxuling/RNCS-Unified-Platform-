import test from 'node:test';
import assert from 'node:assert/strict';
import {ContinuityLedger, createContinuityClaim, createSubjectSovereigntyEnvelope, nextContinuityClaim} from '../src/continuity.mjs';
import {createRealityObject} from '../src/object-abi.mjs';
import {RealityGraph} from '../src/reality-graph.mjs';
import {RealityTransitionVM, authorizeTransition, buildTransitionEnvelope} from '../src/transition-vm.mjs';

function transition(graph, claim, transitionId, sequence = claim.sequence, fencingToken = 1) {
  const continuity = {
    claim,
    sovereignty: createSubjectSovereigntyEnvelope({
      claim,
      transitionId,
      leaseId: 'lease:alice',
      fencingToken,
      nonce: `nonce:${sequence}`
    })
  };
  return authorizeTransition(buildTransitionEnvelope({
    transitionId,
    worldId: graph.worldId,
    baseRoot: graph.realityRoot,
    actor: 'subject:alice',
    intent: {goal: `change:${sequence}`},
    operations: [{op: 'set-state', objectId: 'object:door', state: {locked: sequence % 2 !== 0}}],
    continuity
  }), {
    decisionId: `decision:${transitionId}`,
    principal: 'authority:owner',
    scope: ['object:door']
  });
}

test('transition VM binds subject continuity and advances the ledger only on commit', () => {
  const graph = new RealityGraph({worldId: 'world:test'}).addObject(
    createRealityObject({id: 'object:door', kind: 'door', state: {locked: true}})
  );
  const ledger = new ContinuityLedger();
  const vm = new RealityTransitionVM({continuityLedger: ledger, requireContinuity: true});
  const first = createContinuityClaim({subjectId: 'subject:alice', authorityRoot: 'authority-root'});
  const firstTransition = transition(graph, first, 'transition:continuity-1');

  const preview = vm.execute(graph, firstTransition);
  assert.equal(preview.phase, 'preview');
  assert.equal(ledger.getHead('subject:alice'), null);

  const committed = vm.commit(graph, firstTransition);
  assert.equal(committed.phase, 'committed');
  assert.equal(ledger.getHead('subject:alice').claimRoot, first.claimRoot);
  assert.equal(graph.getObject('object:door').state.locked, false);

  const second = nextContinuityClaim(first);
  const secondTransition = transition(graph, second, 'transition:continuity-2', 1);
  vm.commit(graph, secondTransition);
  assert.equal(ledger.getHead('subject:alice').sequence, 1);

  assert.throws(() => vm.commit(graph, firstTransition), /RK_STALE_BASE/);
});

test('transition VM refuses a subject actor without continuity proof when required', () => {
  const graph = new RealityGraph({worldId: 'world:test'}).addObject(
    createRealityObject({id: 'object:door', kind: 'door', state: {locked: true}})
  );
  const envelope = authorizeTransition(buildTransitionEnvelope({
    transitionId: 'transition:continuity-required',
    worldId: graph.worldId,
    baseRoot: graph.realityRoot,
    actor: 'subject:alice',
    intent: {goal: 'must be continuous'},
    operations: [{op: 'set-state', objectId: 'object:door', state: {locked: false}}]
  }), {decisionId: 'decision:required', principal: 'authority:owner', scope: ['object:door']});
  assert.throws(
    () => new RealityTransitionVM({continuityLedger: new ContinuityLedger(), requireContinuity: true}).execute(graph, envelope),
    /RK_CONTINUITY_REQUIRED/
  );
});
