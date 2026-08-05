import test from 'node:test';
import assert from 'node:assert/strict';
import {createRealityObject} from '../src/object-abi.mjs';
import {RealityGraph} from '../src/reality-graph.mjs';
import {authorizeTransition, buildTransitionEnvelope, RealityTransitionVM} from '../src/transition-vm.mjs';
import {compileEvidence, verifyEvidence} from '../src/evidence-compiler.mjs';

function committedTransition() {
  const graph = new RealityGraph({worldId: 'world:test'}).addObject(
    createRealityObject({id: 'object:door', kind: 'door', state: {locked: true}})
  );
  const envelope = authorizeTransition(buildTransitionEnvelope({
    transitionId: 'transition:evidence',
    worldId: graph.worldId,
    baseRoot: graph.realityRoot,
    actor: 'subject:alice',
    intent: {goal: 'unlock door'},
    operations: [{op: 'set-state', objectId: 'object:door', state: {locked: false}}]
  }), {decisionId: 'decision:evidence', principal: 'authority:owner', scope: ['object:door']});
  return {envelope, receipt: new RealityTransitionVM().execute(graph, envelope).receipt};
}

test('evidence compiler binds observations to transition roots', () => {
  const {envelope, receipt} = committedTransition();
  const evidence = compileEvidence({
    envelope,
    receipt,
    observations: [{
      id: 'observation:door-state',
      source: 'fixture:door-sensor',
      claim: 'door is unlocked',
      value: {locked: false},
      observedAt: 2
    }]
  });
  assert.equal(evidence.format, 'reality.evidence-bundle.v0.1');
  assert.equal(evidence.proposalRoot, envelope.proposalRoot);
  assert.equal(evidence.commitRoot, receipt.commitRoot);
  assert.equal(verifyEvidence(evidence), true);

  const changed = compileEvidence({
    envelope,
    receipt,
    observations: [{
      id: 'observation:door-state',
      source: 'fixture:door-sensor',
      claim: 'door is locked',
      value: {locked: true},
      observedAt: 2
    }]
  });
  assert.notEqual(changed.evidenceRoot, evidence.evidenceRoot);
});

test('evidence compiler rejects a bundle whose receipt link was altered', () => {
  const {envelope, receipt} = committedTransition();
  assert.throws(() => compileEvidence({
    envelope,
    receipt: {...receipt, commitRoot: 'f'.repeat(64)},
    observations: []
  }), /RK_RECEIPT_INVALID/);
});
