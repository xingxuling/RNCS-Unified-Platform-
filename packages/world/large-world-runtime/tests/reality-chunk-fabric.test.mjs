import assert from 'node:assert/strict';
import test from 'node:test';
import {rootHash} from '@taowind/rncs-core-contract';
import {
  LargeWorldRuntime,
  RealityChunkReplicationLink,
  createRealityChunkPacket,
  verifyRealityChunkAck,
  verifyRealityChunkPacket
} from '../src/index.mjs';

class LossyTransport {
  constructor() {
    this.handlers = new Map();
    this.queue = [];
    this.dropNextChunk = true;
  }

  register(endpoint, handler) { this.handlers.set(endpoint, handler); }

  send(from, to, type, payload) {
    if (this.dropNextChunk && type === 'reality-chunk-replication') {
      this.dropNextChunk = false;
      return;
    }
    this.queue.push({from, to, type, payload: structuredClone(payload)});
  }

  advance() {
    const pending = this.queue;
    this.queue = [];
    for (const message of pending) this.handlers.get(message.to)?.(message);
  }
}

const options = {
  worldId: 'world:reality-chunk-fabric',
  seed: 'seed:reality-chunk-fabric',
  width: 3,
  depth: 3,
  chunkSize: 64,
  sampleResolution: 8,
  loadRadius: 1,
  unloadRadius: 1,
  maxActiveChunks: 9
};

function variantTarget(runtime, base, name) {
  return runtime.exportRealityChunkSnapshot(base.chunk_id, {
    forceCanonical: true,
    parent_version: base.version_root,
    content_hash: rootHash({base_content_hash: base.content_hash, name}),
    delta_root: rootHash({base_version_root: base.version_root, name}),
    replication_class: 'REPLICA',
    priority_class: 'STATE',
    residency: {tier: 'RAM', status: 'HOT'}
  });
}

test('authenticates chunk packets, retries loss, resyncs a stale base, and deduplicates replay', () => {
  const source = new LargeWorldRuntime({...options, nodeId: 'node:fabric-source'});
  const target = new LargeWorldRuntime({...options, nodeId: 'node:fabric-target'});
  const chunkId = 'chunk:world:reality-chunk-fabric:0:0';
  const base = source.exportRealityChunkSnapshot(chunkId);
  const staleTarget = variantTarget(source, base, 'stale');
  const staleDelta = source.createRealityChunkDelta(base, {targetNode: target.nodeId, targetChunk: staleTarget, operations: [{op: 'replace', path: 'stale', value: true}]});
  target.applyRealityChunkDelta(staleDelta);
  const freshTarget = variantTarget(source, base, 'fresh');
  const freshDelta = source.createRealityChunkDelta(base, {targetNode: target.nodeId, targetChunk: freshTarget, operations: [{op: 'replace', path: 'fresh', value: true}]});
  const authKey = 'reality-chunk-fabric-test-key';
  const transport = new LossyTransport();
  const link = new RealityChunkReplicationLink({
    source,
    target,
    transport,
    authKey,
    channelId: 'fabric-test',
    sourceEndpoint: 'fabric-source',
    targetEndpoint: 'fabric-target'
  });
  const packet = link.sendDelta(freshDelta);
  assert.equal(verifyRealityChunkPacket(packet, {authKey}).valid, true);
  assert.equal(verifyRealityChunkPacket({...packet, auth_tag: '0'.repeat(64)}, {authKey}).valid, false);
  transport.advance();
  assert.equal(link.status().pending_packet_ids.length, 1);
  link.retryPending();
  transport.advance();
  transport.advance();
  assert.equal(link.status().resync_request_packet_ids.length, 1);
  const resyncPacket = link.resyncPending(packet.packet_id);
  assert.equal(resyncPacket.kind, 'SNAPSHOT');
  assert.equal(verifyRealityChunkPacket(resyncPacket, {authKey}).valid, true);
  transport.advance();
  transport.advance();
  transport.advance();
  transport.advance();
  assert.equal(link.status().pending_packet_ids.length, 0);
  assert.equal(target.exportRealityChunkSnapshot(chunkId).version_root, freshTarget.version_root);
  assert.equal(target.getChunk(chunkId).state_root, freshTarget.canonical_state_root);
  assert.equal(link.status().errors.length, 1);
  assert.match(link.status().errors[0].error, /BASE_VERSION_MISMATCH/);

  const duplicatePacket = link.sendDelta(freshDelta);
  transport.advance();
  transport.advance();
  assert.equal(link.acks.at(-1).status, 'DUPLICATE');
  assert.equal(verifyRealityChunkAck(link.acks.at(-1), {authKey}).valid, true);
  assert.equal(link.status().pending_packet_ids.length, 0);
  assert.equal(duplicatePacket.kind, 'DELTA');
});

test('creates a standalone snapshot packet for an empty target', () => {
  const source = new LargeWorldRuntime({...options, nodeId: 'node:snapshot-source'});
  const target = new LargeWorldRuntime({...options, nodeId: 'node:snapshot-target'});
  const snapshot = source.exportRealityChunkSnapshot('chunk:world:reality-chunk-fabric:1:0', {forceCanonical: true});
  const packet = createRealityChunkPacket(snapshot, {kind: 'SNAPSHOT', authKey: 'snapshot-key', channelId: 'snapshot-test', senderId: 'source', recipientId: 'target'});
  assert.equal(verifyRealityChunkPacket(packet, {authKey: 'snapshot-key'}).valid, true);
  assert.equal(target.applyRealityChunkSnapshot(snapshot, {sourceNode: 'source', targetNode: 'node:snapshot-target'}).status, 'APPLIED');
});

console.log('reality chunk fabric tests: 2 PASS');
