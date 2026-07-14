import test from 'node:test';
import assert from 'node:assert/strict';
import {createRealityObject, verifyRealityObject} from '../src/object-abi.mjs';

test('object ABI produces deterministic roots and verifies tamper resistance', () => {
  const object = createRealityObject({
    id: 'object:door',
    kind: 'door',
    schema: 'example.door.v1',
    state: {locked: true, material: 'iron'},
    provenance: {source: 'fixture:door', observedAt: 1}
  });

  assert.equal(object.format, 'reality.object.v0.1');
  assert.equal(typeof object.objectRoot, 'string');
  assert.equal(verifyRealityObject(object), true);
  assert.equal(
    createRealityObject({
      id: 'object:door',
      kind: 'door',
      schema: 'example.door.v1',
      state: {material: 'iron', locked: true},
      provenance: {observedAt: 1, source: 'fixture:door'}
    }).objectRoot,
    object.objectRoot
  );

  const tampered = structuredClone(object);
  tampered.state.locked = false;
  assert.equal(verifyRealityObject(tampered), false);
});
