import test from 'node:test';
import assert from 'node:assert/strict';
import {createRealityObject} from '../src/object-abi.mjs';
import {RealityGraph} from '../src/reality-graph.mjs';
import {
  RealityTransitionVM,
  authorizeTransition,
  buildTransitionEnvelope
} from '../src/transition-vm.mjs';

function seedGraph() {
  return new RealityGraph({worldId: 'world:test'}).addObject(
    createRealityObject({id: 'object:door', kind: 'door', state: {locked: true}})
  );
}

test('transition VM previews and commits an approved atomic transition', () => {
  const graph = seedGraph();
  const beforeRoot = graph.realityRoot;
  const envelope = authorizeTransition(
    buildTransitionEnvelope({
      transitionId: 'transition:unlock-door',
      worldId: graph.worldId,
      baseRoot: beforeRoot,
      actor: 'subject:alice',
      intent: {goal: 'unlock door'},
      operations: [{op: 'set-state', objectId: 'object:door', state: {locked: false}}]
    }),
    {decisionId: 'decision:unlock-door', principal: 'authority:owner', scope: ['object:door']}
  );

  const vm = new RealityTransitionVM();
  const preview = vm.execute(graph, envelope);
  assert.equal(preview.phase, 'preview');
  assert.equal(preview.snapshot.objects[0].state.locked, false);
  assert.equal(graph.realityRoot, beforeRoot);

  const committed = vm.commit(graph, envelope);
  assert.equal(committed.phase, 'committed');
  assert.equal(committed.receipt.status, 'committed');
  assert.equal(graph.getObject('object:door').state.locked, false);
  assert.notEqual(committed.receipt.commitRoot, beforeRoot);
});

test('transition VM rejects stale or unauthorized envelopes without mutation', () => {
  const graph = seedGraph();
  const before = graph.snapshot();
  const stale = authorizeTransition(
    buildTransitionEnvelope({
      transitionId: 'transition:stale',
      worldId: graph.worldId,
      baseRoot: '0'.repeat(64),
      actor: 'subject:alice',
      intent: {goal: 'invalid'},
      operations: [{op: 'set-state', objectId: 'object:door', state: {locked: false}}]
    }),
    {decisionId: 'decision:stale', principal: 'authority:owner', scope: ['object:door']}
  );
  assert.throws(() => new RealityTransitionVM().commit(graph, stale), /RK_STALE_BASE/);
  assert.deepEqual(graph.snapshot(), before);

  const unauthorized = buildTransitionEnvelope({
    transitionId: 'transition:unauthorized',
    worldId: graph.worldId,
    baseRoot: graph.realityRoot,
    actor: 'subject:alice',
    intent: {goal: 'invalid'},
    operations: [{op: 'set-state', objectId: 'object:door', state: {locked: false}}]
  });
  assert.throws(() => new RealityTransitionVM().commit(graph, unauthorized), /RK_AUTHORITY_REQUIRED/);
  assert.deepEqual(graph.snapshot(), before);
});

test('transition VM keeps preview atomic when a later operation fails', () => {
  const graph = seedGraph();
  const before = graph.snapshot();
  const envelope = authorizeTransition(
    buildTransitionEnvelope({
      transitionId: 'transition:atomic',
      worldId: graph.worldId,
      baseRoot: graph.realityRoot,
      actor: 'subject:alice',
      intent: {goal: 'atomicity'},
      operations: [
        {op: 'set-state', objectId: 'object:door', state: {locked: false}},
        {op: 'set-state', objectId: 'object:missing', state: {locked: false}}
      ]
    }),
    {decisionId: 'decision:atomic', principal: 'authority:owner', scope: '*'}
  );
  assert.throws(() => new RealityTransitionVM().execute(graph, envelope), /RK_OBJECT_NOT_FOUND/);
  assert.deepEqual(graph.snapshot(), before);
});
