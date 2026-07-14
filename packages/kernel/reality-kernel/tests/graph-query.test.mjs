import test from 'node:test';
import assert from 'node:assert/strict';
import {createRealityObject} from '../src/object-abi.mjs';
import {RealityGraph, createRealityRelation} from '../src/reality-graph.mjs';

test('graph query returns deterministic bounded relation paths', () => {
  const alice = createRealityObject({id: 'subject:alice', kind: 'subject', state: {}});
  const door = createRealityObject({id: 'object:door', kind: 'door', state: {locked: true}});
  const room = createRealityObject({id: 'place:room', kind: 'room', state: {}});
  const graph = new RealityGraph({worldId: 'world:test'});
  graph.addObject(alice).addObject(door).addObject(room);
  graph.addRelation(createRealityRelation({type: 'owns', from: alice.id, to: door.id}));
  graph.addRelation(createRealityRelation({type: 'located-in', from: door.id, to: room.id}));

  const result = graph.query({from: 'subject:alice', depth: 2});
  assert.deepEqual(result.objectIds, ['object:door', 'place:room', 'subject:alice']);
  assert.deepEqual(result.paths, [
    ['subject:alice'],
    ['subject:alice', 'object:door'],
    ['subject:alice', 'object:door', 'place:room']
  ]);
  assert.equal(result.relations.length, 2);
  assert.equal(graph.realityRoot, graph.snapshot().realityRoot);
});
