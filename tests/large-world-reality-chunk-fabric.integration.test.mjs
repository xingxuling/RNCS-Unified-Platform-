import assert from 'node:assert/strict';
import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {rootHash} from '@taowind/rncs-core-contract';
import {LargeWorldRuntime, RealityChunkReplicationLink, verifyRealityChunkAck, verifyRealityChunkPacket} from '@taowind/large-world-runtime';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(process.env.URRF_LARGE_WORLD_REALITY_CHUNK_FABRIC_OUT ?? join(rootDir, 'docs', 'verification', 'URRF_LARGE_WORLD_REALITY_CHUNK_FABRIC'));

class DeterministicChunkTransport {
  constructor() {
    this.handlers = new Map();
    this.queue = [];
    this.sent = 0;
    this.dropped = 0;
    this.delivered = 0;
    this.dropNext = true;
  }

  register(endpoint, handler) { this.handlers.set(endpoint, handler); }

  send(from, to, type, payload) {
    this.sent += 1;
    if (this.dropNext && type === 'reality-chunk-replication') {
      this.dropNext = false;
      this.dropped += 1;
      return;
    }
    this.queue.push({from, to, type, payload: structuredClone(payload)});
  }

  advance() {
    const pending = this.queue;
    this.queue = [];
    for (const message of pending) {
      this.handlers.get(message.to)?.(message);
      this.delivered += 1;
    }
  }
}

const options = {
  worldId: 'world:urrf-v03-reality-chunk-fabric',
  seed: 'seed:urrf-v03-reality-chunk-fabric',
  width: 5,
  depth: 5,
  chunkSize: 64,
  sampleResolution: 8,
  loadRadius: 1,
  unloadRadius: 1,
  maxActiveChunks: 9
};

function targetVariant(runtime, base, label) {
  return runtime.exportRealityChunkSnapshot(base.chunk_id, {
    forceCanonical: true,
    parent_version: base.version_root,
    content_hash: rootHash({base_content_hash: base.content_hash, label}),
    delta_root: rootHash({base_version_root: base.version_root, label}),
    replication_class: 'REPLICA',
    priority_class: 'STATE',
    residency: {tier: 'RAM', status: 'HOT'}
  });
}

test('runs chunk delta over authenticated retry/resync fabric and records rooted evidence', () => {
  mkdirSync(outputDir, {recursive: true});
  const source = new LargeWorldRuntime({...options, nodeId: 'node:urrf-fabric-source'});
  const target = new LargeWorldRuntime({...options, nodeId: 'node:urrf-fabric-target'});
  const chunkId = 'chunk:world:urrf-v03-reality-chunk-fabric:0:0';
  const base = source.exportRealityChunkSnapshot(chunkId);
  const staleDelta = source.createRealityChunkDelta(base, {
    targetNode: target.nodeId,
    targetChunk: targetVariant(source, base, 'stale'),
    operations: [{op: 'replace', path: 'state', value: 'stale'}]
  });
  target.applyRealityChunkDelta(staleDelta);
  const freshDelta = source.createRealityChunkDelta(base, {
    deltaId: 'delta:urrf-v03-fabric:fresh',
    targetNode: target.nodeId,
    targetChunk: targetVariant(source, base, 'fresh'),
    operations: [{op: 'replace', path: 'state', value: 'fresh'}]
  });
  const transport = new DeterministicChunkTransport();
  const authKey = 'urrf-v03-reality-chunk-fabric-key';
  const link = new RealityChunkReplicationLink({
    source,
    target,
    transport,
    authKey,
    channelId: 'urrf-v03-fabric',
    sourceEndpoint: 'fabric-source',
    targetEndpoint: 'fabric-target'
  });
  const packet = link.sendDelta(freshDelta);
  assert.equal(verifyRealityChunkPacket(packet, {authKey}).valid, true);
  transport.advance();
  link.retryPending();
  transport.advance();
  transport.advance();
  assert.equal(link.status().resync_request_packet_ids.length, 1);
  const resyncPacket = link.resyncPending(packet.packet_id);
  assert.equal(resyncPacket.kind, 'SNAPSHOT');
  assert.equal(verifyRealityChunkPacket(resyncPacket, {authKey}).valid, true);
  for (let index = 0; index < 4; index += 1) transport.advance();
  assert.equal(link.status().pending_packet_ids.length, 0);
  const replica = target.exportRealityChunkSnapshot(chunkId);
  assert.equal(replica.version_root, freshDelta.target_version_root);
  assert.equal(replica.canonical_state_root, target.getChunk(chunkId).state_root);
  assert.equal(source.getRegion().world_root, target.getRegion().world_root);
  const duplicatePacket = link.sendDelta(freshDelta);
  transport.advance();
  transport.advance();
  const duplicateAck = link.acks.at(-1);
  assert.equal(duplicateAck.status, 'DUPLICATE');
  assert.equal(verifyRealityChunkAck(duplicateAck, {authKey}).valid, true);
  const appliedAck = link.acks.find(ack => ack.packet_id === packet.packet_id && ['APPLIED', 'DUPLICATE'].includes(ack.status));
  assert.ok(appliedAck?.receipt_root);

  const reportBase = {
    format: 'urrf.v03.large-world-reality-chunk-fabric-report.v0.1',
    world_id: options.worldId,
    chunk_id: chunkId,
    region_root: source.getRegion().region_root,
    world_root: source.getRegion().world_root,
    delta_root: freshDelta.delta_root,
    delta_packet_root: packet.packet_root,
    resync_snapshot_packet_root: resyncPacket.packet_root,
    applied_receipt_root: appliedAck.receipt_root,
    duplicate_ack_root: duplicateAck.ack_root,
    dropped_packets: transport.dropped,
    delivered_messages: transport.delivered,
    resync_used: true,
    retry_used: true,
    duplicate_replay: duplicateAck.status === 'DUPLICATE',
    pending_after_apply: link.status().pending_packet_ids.length,
    canonical_world_root_unchanged: source.getRegion().world_root === target.getRegion().world_root,
    authority: {
      canonical_owner: 'RNCS',
      canonical_write_authorized: false,
      candidate_only: true,
      authoritative: false,
      commit_status: 'NOT_COMMITTED'
    },
    evidence_level: 'LOCAL_RUNTIME_AND_CONTRACT_TEST',
    notes: 'Authenticated local chunk transport with deliberate loss, stale-base resync, retry, and duplicate replay. This is not distributed consensus, production network proof, hardware rendering, or provider authority.'
  };
  const report = {...reportBase, report_root: rootHash(reportBase)};
  writeFileSync(join(outputDir, 'reality-chunk-fabric-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  assert.match(report.report_root, /^[a-f0-9]{64}$/);
  assert.equal(duplicatePacket.kind, 'DELTA');
});
