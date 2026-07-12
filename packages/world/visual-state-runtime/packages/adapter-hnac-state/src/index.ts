import { documentHash, cryptographicHash, deepClone, type VSRDocument, type VSRValue } from '../../spec/src/index.js';
import { VSRRuntimeSession } from '../../core/src/index.js';

export const VSR_HNAC_STATE_ADAPTER_VERSION = '0.1.0-alpha.12';
export const HNAC_PORTABLE_STATE_FORMAT = 'hnaf.portable-state.v0.5' as const;

export interface HNACPortableStatePartitions {
  portable: Record<string, VSRValue>;
  device_private: Record<string, VSRValue>;
  secret: Record<string, VSRValue>;
  cache: Record<string, VSRValue>;
}

export interface HNACPortableStateDocument {
  format: typeof HNAC_PORTABLE_STATE_FORMAT;
  app_id: string;
  schema_version: string;
  partitions: HNACPortableStatePartitions;
  state_root: string;
}

export interface VSRHNACStateSnapshot {
  format: 'vsr.hnac-state-snapshot.v0.1';
  adapterVersion: string;
  replicaId: string;
  generation: number;
  parentSnapshotRoot?: string;
  labels: string[];
  state: HNACPortableStateDocument;
  ephemeral: Record<string, VSRValue>;
  snapshotRoot: string;
}

export interface VSRHNACExportBundle {
  format: 'hnaf.state-bundle.v0.5';
  app_id: string;
  schema_version: string;
  source_state_root: string;
  partitions: Pick<HNACPortableStatePartitions, 'portable' | 'cache'>;
  omitted_partitions: Array<'device_private' | 'secret' | 'ephemeral'>;
  bundle_root: string;
}

export interface VSRHNACConflict {
  partition: keyof HNACPortableStatePartitions;
  path: string;
  base?: VSRValue;
  local?: VSRValue;
  incoming?: VSRValue;
  conflictRoot: string;
}

export interface VSRHNACMergeResult {
  format: 'vsr.hnac-state-merge.v0.1';
  strategy: 'three-way-explicit-conflict';
  baseStateRoot: string;
  localStateRoot: string;
  incomingStateRoot: string;
  merged: HNACPortableStateDocument;
  conflicts: VSRHNACConflict[];
  mergeRoot: string;
}

export interface VSRHNACSnapshotOptions {
  appId?: string;
  schemaVersion?: string;
  replicaId?: string;
  generation?: number;
  parentSnapshotRoot?: string;
  labels?: string[];
  devicePrivate?: Record<string, VSRValue>;
  secret?: Record<string, VSRValue>;
  cache?: Record<string, VSRValue>;
  ephemeral?: Record<string, VSRValue>;
}

function cloneMap(value: Record<string, VSRValue> | undefined): Record<string, VSRValue> {
  return deepClone(value ?? {});
}

function statePayload(appId: string, schemaVersion: string, partitions: HNACPortableStatePartitions) {
  return {
    format: HNAC_PORTABLE_STATE_FORMAT,
    app_id: String(appId),
    schema_version: String(schemaVersion),
    partitions: {
      cache: cloneMap(partitions.cache),
      device_private: cloneMap(partitions.device_private),
      portable: cloneMap(partitions.portable),
      secret: cloneMap(partitions.secret),
    },
  };
}

export function computeHNACStateRoot(appId: string, schemaVersion: string, partitions: HNACPortableStatePartitions): string {
  return cryptographicHash(statePayload(appId, schemaVersion, partitions));
}

export function sealHNACPortableState(input: Omit<HNACPortableStateDocument, 'state_root'> & { state_root?: string }): HNACPortableStateDocument {
  if (input.format !== HNAC_PORTABLE_STATE_FORMAT) throw new Error(`Unsupported HNAC state format: ${String(input.format)}`);
  if (!input.app_id) throw new Error('HNAC portable state requires app_id.');
  if (!input.schema_version) throw new Error('HNAC portable state requires schema_version.');
  const partitions: HNACPortableStatePartitions = {
    portable: cloneMap(input.partitions?.portable),
    device_private: cloneMap(input.partitions?.device_private),
    secret: cloneMap(input.partitions?.secret),
    cache: cloneMap(input.partitions?.cache),
  };
  const state_root = computeHNACStateRoot(input.app_id, input.schema_version, partitions);
  if (input.state_root !== undefined && input.state_root !== state_root) throw new Error('HNAC portable state root mismatch.');
  return { format: HNAC_PORTABLE_STATE_FORMAT, app_id: input.app_id, schema_version: input.schema_version, partitions, state_root };
}

export function createVSRHNACSnapshot(document: VSRDocument, runtime: VSRRuntimeSession, options: VSRHNACSnapshotOptions = {}): VSRHNACStateSnapshot {
  const evaluation = runtime.evaluate();
  const appId = options.appId ?? `vsr:${document.metadata.id}`;
  const schemaVersion = options.schemaVersion ?? '1.0';
  const state = sealHNACPortableState({
    format: HNAC_PORTABLE_STATE_FORMAT,
    app_id: appId,
    schema_version: schemaVersion,
    partitions: {
      portable: {
        documentId: document.metadata.id,
        documentHash: documentHash(document),
        variables: runtime.getVariables(),
        interaction: runtime.getInteractionState(),
        clock: { time: runtime.clock.time, rate: runtime.clock.rate, status: runtime.clock.status },
      },
      device_private: cloneMap(options.devicePrivate),
      secret: cloneMap(options.secret),
      cache: {
        displayHash: evaluation.displayState.semanticHash,
        viewport: evaluation.displayState.viewport as unknown as VSRValue,
        ...cloneMap(options.cache),
      },
    },
  });
  const replicaId = options.replicaId ?? 'replica:local';
  const generation = Math.max(0, Math.floor(options.generation ?? 0));
  const labels = [...new Set(options.labels ?? [])].sort();
  const ephemeral = cloneMap(options.ephemeral);
  const base = {
    format: 'vsr.hnac-state-snapshot.v0.1' as const,
    adapterVersion: VSR_HNAC_STATE_ADAPTER_VERSION,
    replicaId,
    generation,
    parentSnapshotRoot: options.parentSnapshotRoot,
    labels,
    state,
    ephemeral,
  };
  return { ...base, snapshotRoot: cryptographicHash(base) };
}

export function verifyVSRHNACSnapshot(snapshot: VSRHNACStateSnapshot): { ok: boolean; diagnostics: string[] } {
  const diagnostics: string[] = [];
  try { sealHNACPortableState(snapshot.state); } catch (error) { diagnostics.push(error instanceof Error ? error.message : String(error)); }
  const { snapshotRoot, ...base } = snapshot;
  if (cryptographicHash(base) !== snapshotRoot) diagnostics.push('snapshot-root-mismatch');
  if (!Number.isInteger(snapshot.generation) || snapshot.generation < 0) diagnostics.push('invalid-generation');
  return { ok: diagnostics.length === 0, diagnostics };
}

export function restoreVSRSessionFromHNACSnapshot(runtime: VSRRuntimeSession, snapshot: VSRHNACStateSnapshot): void {
  const verification = verifyVSRHNACSnapshot(snapshot);
  if (!verification.ok) throw new Error(`Invalid VSR HNAC snapshot: ${verification.diagnostics.join('; ')}`);
  const portable = snapshot.state.partitions.portable;
  const boundDocumentHash = portable.documentHash;
  if(typeof boundDocumentHash==='string'&&boundDocumentHash!==runtime.prepared.documentHash) throw new Error('HNAC portable state document hash mismatch.');
  const variables = portable.variables;
  const interaction = portable.interaction;
  const clock = portable.clock;
  if (variables && typeof variables === 'object' && !Array.isArray(variables)) runtime.replaceVariables(variables as Record<string, VSRValue>);
  if (interaction && typeof interaction === 'object' && !Array.isArray(interaction)) runtime.replaceInteractionState(interaction as Record<string, VSRValue>);
  if (clock && typeof clock === 'object' && !Array.isArray(clock)) {
    const record = clock as Record<string, VSRValue>;
    const time = Number(record.time ?? 0);
    const rate = Number(record.rate ?? 1);
    if (Number.isFinite(rate) && rate !== 0) runtime.clock.setRate(rate);
    if (Number.isFinite(time)) runtime.clock.seek(time);
    if (record.status === 'playing') runtime.clock.play();
    else if (record.status === 'paused') runtime.clock.pause();
  }
  runtime.invalidate();
}

export function exportVSRHNACBundle(snapshot: VSRHNACStateSnapshot, includeCache = true): VSRHNACExportBundle {
  const verification = verifyVSRHNACSnapshot(snapshot);
  if (!verification.ok) throw new Error(`Invalid VSR HNAC snapshot: ${verification.diagnostics.join('; ')}`);
  const base = {
    format: 'hnaf.state-bundle.v0.5' as const,
    app_id: snapshot.state.app_id,
    schema_version: snapshot.state.schema_version,
    source_state_root: snapshot.state.state_root,
    partitions: {
      portable: cloneMap(snapshot.state.partitions.portable),
      cache: includeCache ? cloneMap(snapshot.state.partitions.cache) : {},
    },
    omitted_partitions: ['device_private', 'secret', 'ephemeral'] as Array<'device_private' | 'secret' | 'ephemeral'>,
  };
  return { ...base, bundle_root: cryptographicHash(base) };
}

function isRecord(value: unknown): value is Record<string, VSRValue> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function equal(a: unknown, b: unknown): boolean { if(a===undefined||b===undefined)return a===b; return cryptographicHash(a) === cryptographicHash(b); }

function mergeValue(partition: keyof HNACPortableStatePartitions, path: string, base: VSRValue | undefined, local: VSRValue | undefined, incoming: VSRValue | undefined, conflicts: VSRHNACConflict[]): VSRValue | undefined {
  if (equal(local, incoming)) return deepClone(local);
  if (equal(local, base)) return deepClone(incoming);
  if (equal(incoming, base)) return deepClone(local);
  if (isRecord(base) || isRecord(local) || isRecord(incoming)) {
    const result: Record<string, VSRValue> = {};
    const keys = [...new Set([...Object.keys(base ?? {}), ...Object.keys(local ?? {}), ...Object.keys(incoming ?? {})])].sort();
    for (const key of keys) {
      const child = mergeValue(partition, path ? `${path}.${key}` : key, isRecord(base) ? base[key] : undefined, isRecord(local) ? local[key] : undefined, isRecord(incoming) ? incoming[key] : undefined, conflicts);
      if (child !== undefined) result[key] = child;
    }
    return result;
  }
  const conflictBase = { partition, path, base: deepClone(base), local: deepClone(local), incoming: deepClone(incoming) };
  conflicts.push({ ...conflictBase, conflictRoot: cryptographicHash(conflictBase) });
  return deepClone(local);
}

export function mergeHNACPortableStates(baseInput: HNACPortableStateDocument, localInput: HNACPortableStateDocument, incomingInput: HNACPortableStateDocument): VSRHNACMergeResult {
  const base = sealHNACPortableState(baseInput);
  const local = sealHNACPortableState(localInput);
  const incoming = sealHNACPortableState(incomingInput);
  if (base.app_id !== local.app_id || base.app_id !== incoming.app_id) throw new Error('HNAC state app_id mismatch.');
  if (base.schema_version !== local.schema_version || base.schema_version !== incoming.schema_version) throw new Error('HNAC state schema_version mismatch.');
  const conflicts: VSRHNACConflict[] = [];
  const partitions = {} as HNACPortableStatePartitions;
  for (const partition of ['portable', 'device_private', 'secret', 'cache'] as const) {
    partitions[partition] = (mergeValue(partition, '', base.partitions[partition], local.partitions[partition], incoming.partitions[partition], conflicts) ?? {}) as Record<string, VSRValue>;
  }
  const merged = sealHNACPortableState({ format: HNAC_PORTABLE_STATE_FORMAT, app_id: base.app_id, schema_version: base.schema_version, partitions });
  const baseResult = {
    format: 'vsr.hnac-state-merge.v0.1' as const,
    strategy: 'three-way-explicit-conflict' as const,
    baseStateRoot: base.state_root,
    localStateRoot: local.state_root,
    incomingStateRoot: incoming.state_root,
    merged,
    conflicts,
  };
  return { ...baseResult, mergeRoot: cryptographicHash(baseResult) };
}
