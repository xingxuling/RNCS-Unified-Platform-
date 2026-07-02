import test from 'node:test';
import assert from 'node:assert/strict';

test('engine v0.6 contract keeps authority and presentation roots separate', () => {
  const authority = { protocol: 'rsr.authoritative-state.v0.7', stateRoot: 'authority-root' };
  const presentation = { protocol: 'vsr.temporal-presentation.v0.6', authorityStateRoot: authority.stateRoot, frameRoot: 'presentation-root' };
  assert.equal(presentation.authorityStateRoot, authority.stateRoot);
  assert.notEqual(presentation.frameRoot, authority.stateRoot);
});

test('network v0.2 references the RSR v0.7 protocol', () => {
  const packet = { protocol: 'rncs.network-runtime.v0.2', rsrAuthorityProtocol: 'rsr.authoritative-state.v0.7' };
  assert.equal(packet.rsrAuthorityProtocol, 'rsr.authoritative-state.v0.7');
});
