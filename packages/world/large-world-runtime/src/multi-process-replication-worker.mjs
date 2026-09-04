import {createInterface} from 'node:readline';
import {
  LargeWorldRuntime
} from './index.mjs';
import {checkAuthorityLease, rootHash} from '@taowind/rncs-core-contract';

const PROTOCOL = 'rncs.large-world-multi-process-protocol.v0.1';
const VERSION = '0.1.0';
const clone = value => structuredClone(value);
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const text = (value, fallback = '') => String(value ?? fallback);
const integer = (value, fallback = 0) => {
  const number = value === undefined || value === null ? fallback : Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new Error('MULTI_PROCESS_CACHE_INTEGER_INVALID');
  return number;
};

let options;
try { options = JSON.parse(process.argv[2] ?? '{}'); } catch (error) {
  process.stderr.write(`MULTI_PROCESS_OPTIONS_INVALID:${error.message}\n`);
  process.exit(2);
}

const runtime = new LargeWorldRuntime(options);
const cache = new Map();
let shutdownRequested = false;

function cacheRoot() {
  return rootHash([...cache.values()].sort((a, b) => text(a.cache_key).localeCompare(text(b.cache_key))));
}

function invalidateCache(reason, predicate = () => true, details = {}) {
  const invalidated = [];
  for (const [cacheKey, entry] of cache.entries()) {
    if (!predicate(entry)) continue;
    invalidated.push(cacheKey);
    cache.delete(cacheKey);
  }
  return {
    status: invalidated.length > 0 ? 'INVALIDATED' : 'NOOP',
    reason,
    invalidated_cache_keys: invalidated.sort(),
    invalidated_entry_count: invalidated.length,
    cache_root: cacheRoot(),
    ...clone(details)
  };
}

function requireLocalAuthority(receiptInput) {
  const lease = runtime.authorityLease;
  if (!lease) return;
  const admission = checkAuthorityLease(lease, {
    authority_id: lease.authority_id,
    shard_id: runtime.shardId,
    semantic_scope: lease.semantic_scope,
    owner_node: runtime.nodeId,
    epoch: lease.epoch,
    fencing_token: lease.fencing_token,
    tick: runtime.worldTime.simulation_tick,
    current_lease: lease
  });
  if (!admission.valid) throw new Error(`MULTI_PROCESS_LOCAL_LEASE_REJECTED:${admission.errors.join(',')}`);
  const receipt = record(receiptInput);
  if (receipt.lease_root !== undefined) {
    if (receipt.lease_root !== lease.lease_root) throw new Error('MULTI_PROCESS_LOCAL_LEASE_ROOT_MISMATCH');
  }
  if (receipt.epoch !== undefined && Number(receipt.epoch) !== lease.epoch) throw new Error('MULTI_PROCESS_LOCAL_LEASE_EPOCH_MISMATCH');
  if (receipt.fencing_token !== undefined && Number(receipt.fencing_token) !== lease.fencing_token) throw new Error('MULTI_PROCESS_LOCAL_LEASE_FENCING_MISMATCH');
}

async function handle(operation, payloadInput) {
  const payload = record(payloadInput);
  switch (operation) {
    case 'health': {
      const snapshot = runtime.exportReplicationSnapshot();
      return {
        status: 'READY',
        node_id: runtime.nodeId,
        process_id: process.pid,
        world_id: runtime.options.worldId,
        region_root: runtime.region.region_root,
        world_root: runtime.region.world_root,
        snapshot_root: snapshot.snapshot_root,
        lease_root: runtime.authorityLease?.lease_root ?? runtime.acceptedAuthorityLease?.lease_root ?? null,
        epoch: runtime.authorityLease?.epoch ?? runtime.acceptedAuthorityLease?.epoch ?? 0,
        fencing_token: runtime.authorityLease?.fencing_token ?? runtime.acceptedAuthorityLease?.fencing_token ?? 0,
        cache_root: cacheRoot()
      };
    }
    case 'snapshot': return runtime.exportReplicationSnapshot();
    case 'durable-bundle': return runtime.exportDurableBundle();
    case 'observe': return runtime.observe(payload);
    case 'record-event': {
      requireLocalAuthority(payload.authorityReceipt ?? payload.authority_receipt);
      return runtime.recordWorldEvent(payload);
    }
    case 'create-profile':
      return runtime.createServerSovereigntyProfile({...record(payload.profile), register: true});
    case 'server-profile':
      return runtime.serverSovereigntyProfile();
    case 'create-replication-delta':
      return runtime.createReplicationDelta(payload.base_snapshot ?? payload.baseSnapshot, payload.input ?? {});
    case 'apply-replication-delta': {
      const before = runtime.exportReplicationSnapshot();
      const receipt = runtime.applyReplicationDelta(payload.delta, {
        authorityReceipt: payload.authority_receipt ?? payload.authorityReceipt,
        evidenceRefs: payload.evidence_refs ?? payload.evidenceRefs ?? []
      });
      const after = runtime.exportReplicationSnapshot();
      const cacheInvalidation = before.snapshot_root === after.snapshot_root
        ? invalidateCache('DELTA_NO_SNAPSHOT_CHANGE', () => false)
        : invalidateCache('SNAPSHOT_ROOT_CHANGED', entry => entry.snapshot_root !== after.snapshot_root, {snapshot_root: after.snapshot_root});
      return {receipt, before_snapshot_root: before.snapshot_root, after_snapshot_root: after.snapshot_root, cache_invalidation: cacheInvalidation};
    }
    case 'create-migration':
      return runtime.createSovereigntyMigration(payload.target_profile ?? payload.targetProfile, payload.input ?? {});
    case 'handoff': {
      const result = runtime.executeSovereigntyHandoff(payload.migration, {
        durableBundle: payload.durable_bundle ?? payload.durableBundle,
        authorityReceipt: payload.authority_receipt ?? payload.authorityReceipt,
        evidenceRefs: payload.evidence_refs ?? payload.evidenceRefs ?? []
      });
      const cacheInvalidation = invalidateCache('SOVEREIGNTY_HANDOFF');
      return {...result, cache_invalidation: cacheInvalidation};
    }
    case 'cache-put': {
      const cacheKey = text(payload.cache_key ?? payload.cacheKey);
      if (!cacheKey) throw new Error('MULTI_PROCESS_CACHE_KEY_REQUIRED');
      const entry = {
        cache_key: cacheKey,
        snapshot_root: text(payload.snapshot_root ?? payload.snapshotRoot),
        lease_root: payload.lease_root ?? payload.leaseRoot ?? null,
        epoch: integer(payload.epoch, 0),
        fencing_token: integer(payload.fencing_token ?? payload.fencingToken, 0),
        payload_root: rootHash({cache_key: cacheKey, payload: payload.payload ?? null})
      };
      cache.set(cacheKey, entry);
      return {status: 'CACHED', entry: clone(entry), entry_root: rootHash(entry), cache_root: cacheRoot()};
    }
    case 'cache-get': {
      const cacheKey = text(payload.cache_key ?? payload.cacheKey);
      const entry = cache.get(cacheKey);
      if (!entry) return {status: 'MISS', reason: 'CACHE_ENTRY_ABSENT', cache_key: cacheKey, cache_root: cacheRoot()};
      const mismatches = [];
      if (payload.snapshot_root !== undefined && entry.snapshot_root !== payload.snapshot_root) mismatches.push('SNAPSHOT_ROOT');
      if (payload.lease_root !== undefined && entry.lease_root !== payload.lease_root) mismatches.push('LEASE_ROOT');
      if (payload.epoch !== undefined && entry.epoch !== Number(payload.epoch)) mismatches.push('EPOCH');
      if (payload.fencing_token !== undefined && entry.fencing_token !== Number(payload.fencing_token)) mismatches.push('FENCING_TOKEN');
      if (mismatches.length > 0) {
        const invalidation = invalidateCache('CACHE_BINDING_MISMATCH', item => item.cache_key === cacheKey, {mismatches});
        return {status: 'INVALIDATED', cache_key: cacheKey, mismatches, invalidation, cache_root: cacheRoot()};
      }
      return {status: 'HIT', entry: clone(entry), cache_root: cacheRoot()};
    }
    case 'cache-invalidate': return invalidateCache(text(payload.reason, 'EXPLICIT_INVALIDATION'));
    case 'cache-state': return {status: 'READY', entry_count: cache.size, cache_root: cacheRoot()};
    case 'verify': return runtime.verify();
    case 'shutdown': {
      shutdownRequested = true;
      setImmediate(() => process.exit(0));
      return {status: 'STOPPING', node_id: runtime.nodeId};
    }
    default: throw new Error(`MULTI_PROCESS_OPERATION_UNKNOWN:${operation}`);
  }
}

function emit(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

const readline = createInterface({input: process.stdin, crlfDelay: Infinity});
for await (const line of readline) {
  if (!line.trim() || shutdownRequested) continue;
  let request;
  try {
    request = JSON.parse(line);
    if (request.protocol !== PROTOCOL || request.version !== VERSION) throw new Error('MULTI_PROCESS_PROTOCOL_VERSION_INVALID');
    const result = await handle(request.operation, request.payload);
    emit({protocol: PROTOCOL, version: VERSION, id: request.id, result});
  } catch (error) {
    emit({
      protocol: PROTOCOL,
      version: VERSION,
      id: request?.id ?? null,
      error: {code: String(error.code ?? error.message ?? error.name), message: String(error.message ?? error)}
    });
  }
}
