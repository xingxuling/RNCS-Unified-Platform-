import { cryptographicHash } from '../../spec/src/index.js';

type JsonRecord = Record<string, unknown>;

export const VSR_NON_MESH_REPRESENTATION_MANIFEST_FORMAT = 'vsr.non-mesh-representation-manifest.v0.1' as const;
export const VSR_NON_MESH_REPRESENTATION_CANDIDATE_FORMAT = 'vsr.non-mesh-representation-candidate.v0.1' as const;
export const VSR_NON_MESH_REPRESENTATION_IMPORT_FORMAT = 'vsr.non-mesh-representation-import-receipt.v0.1' as const;
export type VSRNonMeshRepresentationKind = 'sdf' | 'voxel' | 'point-cloud' | 'gaussian-splat' | 'neural-field' | 'curve' | 'material';
export type VSRNonMeshRenderStatus = 'NOT_IMPLEMENTED';

export interface VSRNonMeshRepresentationAsset {
  id: string;
  kind?: string;
  format?: string;
  role?: string;
  metadata?: JsonRecord;
}

export interface VSRNonMeshRepresentationImportContext {
  entry: JsonRecord;
  assets: VSRNonMeshRepresentationAsset[];
  payloads: Map<string, Uint8Array>;
}

export interface VSRNonMeshRepresentationManifest {
  format: typeof VSR_NON_MESH_REPRESENTATION_MANIFEST_FORMAT;
  version: '0.1.0';
  component_id: string;
  asset_id: string;
  representation_kind: string;
  profile_id: string;
  payload_asset_ids: string[];
  payload_format: string;
  payload_byte_length: number;
  element_count: number;
  bounds: {min: [number, number, number]; max: [number, number, number]};
  content_root: string;
  candidate_only: true;
  authoritative: false;
  manifest_root: string;
}

export interface VSRNonMeshRepresentationCandidate {
  format: typeof VSR_NON_MESH_REPRESENTATION_CANDIDATE_FORMAT;
  version: '0.1.0';
  componentId: string;
  representationKind: VSRNonMeshRepresentationKind;
  profileId: string;
  payloadAssetIds: string[];
  payloadFormat: string;
  payloadByteLength: number;
  elementCount: number;
  bounds: {min: [number, number, number]; max: [number, number, number]};
  manifestRoot: string;
  contentRoot: string;
  renderStatus: VSRNonMeshRenderStatus;
  candidateOnly: true;
  authoritative: false;
  candidateRoot: string;
}

export interface VSRNonMeshRepresentationImportReceipt {
  format: typeof VSR_NON_MESH_REPRESENTATION_IMPORT_FORMAT;
  version: '0.1.0';
  componentId: string;
  sceneId: string;
  representationKind: VSRNonMeshRepresentationKind;
  profileId: string;
  manifestRoot: string;
  contentRoot: string;
  resourceRoot: string;
  candidateRoot: string;
  payloadAssetIds: string[];
  payloadFormat: string;
  payloadByteLength: number;
  payloadCount: number;
  elementCount: number;
  renderStatus: VSRNonMeshRenderStatus;
  candidateOnly: true;
  authoritative: false;
  receiptRoot: string;
}

export interface VSRNonMeshRepresentationComponentImportResult {
  status: 'EXECUTED';
  candidate: VSRNonMeshRepresentationCandidate;
  receipt: VSRNonMeshRepresentationImportReceipt;
  output_root: string;
  consumed_asset_ids: string[];
  deferred_asset_ids: string[];
  metrics: Record<string, number>;
}

export interface VSRNonMeshRepresentationComponentImportHandlerOptions {
  handlerId?: string;
  representationKind?: VSRNonMeshRepresentationKind;
  sceneId?: (entry: JsonRecord, manifestAsset: VSRNonMeshRepresentationAsset) => string;
}

export interface VSRNonMeshRepresentationComponentImportHandler {
  handler_id: string;
  representation_kind?: VSRNonMeshRepresentationKind;
  compile: (context: VSRNonMeshRepresentationImportContext) => Promise<VSRNonMeshRepresentationComponentImportResult>;
  verify: (input: {result: VSRNonMeshRepresentationComponentImportResult}) => boolean;
}

const SUPPORTED_KINDS: readonly VSRNonMeshRepresentationKind[] = ['sdf', 'voxel', 'point-cloud', 'gaussian-splat', 'neural-field', 'curve', 'material'];
const isHexRoot = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
const nonEmpty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

function canonicalKind(value: unknown): VSRNonMeshRepresentationKind | undefined {
  const normalized = String(value ?? '').trim().toLowerCase().replace(/_/g, '-');
  if (normalized === 'gaussian-splats') return 'gaussian-splat';
  if (normalized === 'point-clouds') return 'point-cloud';
  return (SUPPORTED_KINDS as readonly string[]).includes(normalized) ? normalized as VSRNonMeshRepresentationKind : undefined;
}

function assetFormat(asset: VSRNonMeshRepresentationAsset): string {
  return String(asset.format ?? asset.metadata?.format ?? '').trim();
}

function isManifestAsset(asset: VSRNonMeshRepresentationAsset): boolean {
  const role = String(asset.metadata?.role ?? asset.metadata?.representation_role ?? asset.role ?? '').trim().toLowerCase().replace(/_/g, '-');
  return asset.kind === 'representation-manifest'
    || asset.kind === 'non-mesh-manifest'
    || asset.metadata?.representation_manifest === true
    || assetFormat(asset) === 'application/vnd.vsr.non-mesh-manifest+json'
    || (assetFormat(asset) === 'application/json' && ['representation-manifest', 'non-mesh-manifest', 'visual-representation-manifest'].includes(role));
}

function bytesFor(payloads: Map<string, Uint8Array>, asset: VSRNonMeshRepresentationAsset): Uint8Array {
  const bytes = payloads.get(asset.id);
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0) throw new Error(`VSR non-mesh representation payload ${asset.id} is missing or empty.`);
  return bytes;
}

function parseManifest(payloads: Map<string, Uint8Array>, asset: VSRNonMeshRepresentationAsset): VSRNonMeshRepresentationManifest {
  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder().decode(bytesFor(payloads, asset)));
  } catch (error) {
    throw new Error(`VSR non-mesh representation manifest is invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('VSR non-mesh representation manifest must be an object.');
  return value as VSRNonMeshRepresentationManifest;
}

function manifestBase(manifest: VSRNonMeshRepresentationManifest): Omit<VSRNonMeshRepresentationManifest, 'manifest_root'> {
  const {manifest_root: _manifestRoot, ...base} = manifest;
  return base;
}

function payloadRoot(payloads: Map<string, Uint8Array>, payloadAssets: VSRNonMeshRepresentationAsset[], payloadAssetIds: string[]): string {
  return cryptographicHash(payloadAssetIds.map(assetId => {
    const asset = payloadAssets.find(candidate => candidate.id === assetId);
    if (!asset) throw new Error(`VSR non-mesh representation payload asset ${assetId} is missing.`);
    const bytes = bytesFor(payloads, asset);
    return {assetId, byteLength: bytes.byteLength, byteRoot: cryptographicHash([...bytes])};
  }));
}

function resourceRoot(manifestAsset: VSRNonMeshRepresentationAsset, manifestBytes: Uint8Array, payloads: Map<string, Uint8Array>, payloadAssets: VSRNonMeshRepresentationAsset[], payloadAssetIds: string[], componentId: string, representationKind: VSRNonMeshRepresentationKind): string {
  return cryptographicHash({
    componentId,
    representationKind,
    resources: [
      {assetId: manifestAsset.id, byteLength: manifestBytes.byteLength, byteRoot: cryptographicHash([...manifestBytes])},
      ...payloadAssetIds.map(assetId => {
        const asset = payloadAssets.find(candidate => candidate.id === assetId)!;
        const bytes = bytesFor(payloads, asset);
        return {assetId, byteLength: bytes.byteLength, byteRoot: cryptographicHash([...bytes])};
      })
    ]
  });
}

function finiteBounds(bounds: unknown): bounds is {min: [number, number, number]; max: [number, number, number]} {
  if (!bounds || typeof bounds !== 'object' || Array.isArray(bounds)) return false;
  const candidate = bounds as {min?: unknown; max?: unknown};
  if (!Array.isArray(candidate.min) || !Array.isArray(candidate.max) || candidate.min.length !== 3 || candidate.max.length !== 3) return false;
  return candidate.min.every(value => typeof value === 'number' && Number.isFinite(value))
    && candidate.max.every(value => typeof value === 'number' && Number.isFinite(value))
    && candidate.max.every((value, index) => value > (candidate.min as number[])[index]!);
}

function validateManifest(manifest: VSRNonMeshRepresentationManifest, {entry, componentId, expectedKind, assets, payloads, manifestAsset}: {entry: JsonRecord; componentId: string; expectedKind: VSRNonMeshRepresentationKind | undefined; assets: VSRNonMeshRepresentationAsset[]; payloads: Map<string, Uint8Array>; manifestAsset: VSRNonMeshRepresentationAsset}): {kind: VSRNonMeshRepresentationKind; payloadAssets: VSRNonMeshRepresentationAsset[]; manifestBytes: Uint8Array; contentRoot: string; resourceRoot: string} {
  const kind = canonicalKind(manifest.representation_kind);
  if (manifest.format !== VSR_NON_MESH_REPRESENTATION_MANIFEST_FORMAT || manifest.version !== '0.1.0' || !kind) throw new Error('VSR non-mesh representation manifest contract is invalid.');
  if (expectedKind && kind !== expectedKind) throw new Error(`VSR non-mesh representation kind ${kind} does not match handler ${expectedKind}.`);
  if (manifest.component_id !== componentId) throw new Error('VSR non-mesh representation component identity is not bound.');
  const expectedAssetId = entry.asset_id ?? entry.assetId;
  if (expectedAssetId !== undefined && manifest.asset_id !== expectedAssetId) throw new Error('VSR non-mesh representation asset identity is not bound.');
  if (!nonEmpty(manifest.asset_id) || !nonEmpty(manifest.profile_id) || !nonEmpty(manifest.payload_format) || !finiteBounds(manifest.bounds) || !Array.isArray(manifest.payload_asset_ids) || manifest.payload_asset_ids.length < 1 || manifest.payload_asset_ids.length > 4096 || new Set(manifest.payload_asset_ids).size !== manifest.payload_asset_ids.length || manifest.payload_asset_ids.some(assetId => !nonEmpty(assetId) || assetId === manifestAsset.id) || !Number.isSafeInteger(manifest.payload_byte_length) || manifest.payload_byte_length < 1 || !Number.isSafeInteger(manifest.element_count) || manifest.element_count < 1 || !isHexRoot(manifest.content_root) || manifest.candidate_only !== true || manifest.authoritative !== false || !isHexRoot(manifest.manifest_root) || cryptographicHash(manifestBase(manifest)) !== manifest.manifest_root) throw new Error('VSR non-mesh representation manifest integrity or bounds contract is invalid.');
  const payloadAssets = manifest.payload_asset_ids.map(assetId => {
    const asset = assets.find(candidate => candidate.id === assetId);
    if (!asset) throw new Error(`VSR non-mesh representation payload asset ${assetId} is not declared.`);
    if (assetFormat(asset) !== manifest.payload_format) throw new Error(`VSR non-mesh representation payload ${assetId} format is not ${manifest.payload_format}.`);
    return asset;
  });
  const actualByteLength = payloadAssets.reduce((sum, asset) => sum + bytesFor(payloads, asset).byteLength, 0);
  if (actualByteLength !== manifest.payload_byte_length) throw new Error('VSR non-mesh representation payload byte length mismatch.');
  const contentRoot = payloadRoot(payloads, payloadAssets, manifest.payload_asset_ids);
  if (contentRoot !== manifest.content_root) throw new Error('VSR non-mesh representation content root mismatch.');
  const manifestBytes = bytesFor(payloads, manifestAsset);
  return {kind, payloadAssets, manifestBytes, contentRoot, resourceRoot: resourceRoot(manifestAsset, manifestBytes, payloads, payloadAssets, manifest.payload_asset_ids, componentId, kind)};
}

function candidateBase(candidate: VSRNonMeshRepresentationCandidate): Omit<VSRNonMeshRepresentationCandidate, 'candidateRoot'> {
  const {candidateRoot: _candidateRoot, ...base} = candidate;
  return base;
}

function receiptBase(receipt: VSRNonMeshRepresentationImportReceipt): Omit<VSRNonMeshRepresentationImportReceipt, 'receiptRoot'> {
  const {receiptRoot: _receiptRoot, ...base} = receipt;
  return base;
}

function coverageValid(result: VSRNonMeshRepresentationComponentImportResult): boolean {
  const consumed = result.consumed_asset_ids;
  const deferred = result.deferred_asset_ids;
  return Array.isArray(consumed) && Array.isArray(deferred)
    && consumed.every(nonEmpty) && deferred.every(nonEmpty)
    && new Set(consumed).size === consumed.length && new Set(deferred).size === deferred.length
    && consumed.every(assetId => !deferred.includes(assetId));
}

export function verifyVsrNonMeshRepresentationImportReceipt(receipt: VSRNonMeshRepresentationImportReceipt, candidate?: VSRNonMeshRepresentationCandidate): boolean {
  try {
    if (!receipt || receipt.format !== VSR_NON_MESH_REPRESENTATION_IMPORT_FORMAT || receipt.version !== '0.1.0' || !nonEmpty(receipt.componentId) || !nonEmpty(receipt.sceneId) || !canonicalKind(receipt.representationKind) || !nonEmpty(receipt.profileId) || !isHexRoot(receipt.manifestRoot) || !isHexRoot(receipt.contentRoot) || !isHexRoot(receipt.resourceRoot) || !isHexRoot(receipt.candidateRoot) || !Array.isArray(receipt.payloadAssetIds) || receipt.payloadAssetIds.length < 1 || new Set(receipt.payloadAssetIds).size !== receipt.payloadAssetIds.length || !nonEmpty(receipt.payloadFormat) || !Number.isSafeInteger(receipt.payloadByteLength) || receipt.payloadByteLength < 1 || !Number.isSafeInteger(receipt.payloadCount) || receipt.payloadCount !== receipt.payloadAssetIds.length || !Number.isSafeInteger(receipt.elementCount) || receipt.elementCount < 1 || receipt.renderStatus !== 'NOT_IMPLEMENTED' || receipt.candidateOnly !== true || receipt.authoritative !== false) return false;
    if (cryptographicHash(receiptBase(receipt)) !== receipt.receiptRoot) return false;
    if (candidate) return candidate.format === VSR_NON_MESH_REPRESENTATION_CANDIDATE_FORMAT
      && candidate.version === '0.1.0'
      && candidate.componentId === receipt.componentId
      && candidate.representationKind === receipt.representationKind
      && candidate.profileId === receipt.profileId
      && candidate.manifestRoot === receipt.manifestRoot
      && candidate.contentRoot === receipt.contentRoot
      && JSON.stringify(candidate.payloadAssetIds) === JSON.stringify(receipt.payloadAssetIds)
      && candidate.payloadFormat === receipt.payloadFormat
      && candidate.payloadByteLength === receipt.payloadByteLength
      && candidate.elementCount === receipt.elementCount
      && candidate.renderStatus === receipt.renderStatus
      && candidate.candidateOnly === true
      && candidate.authoritative === false
      && isHexRoot(candidate.candidateRoot)
      && cryptographicHash(candidateBase(candidate)) === candidate.candidateRoot
      && candidate.candidateRoot === receipt.candidateRoot;
    return true;
  } catch {
    return false;
  }
}

/**
 * Import a descriptor plus ordered opaque payload pages for a non-mesh visual
 * representation. This is a candidate package compiler: it verifies identity,
 * bounds, format, byte/content roots, and coverage, but deliberately does not
 * claim splat/SDF/voxel/neural-field rendering.
 */
export function createVsrNonMeshRepresentationComponentImportHandler(options: VSRNonMeshRepresentationComponentImportHandlerOptions = {}): VSRNonMeshRepresentationComponentImportHandler {
  const handler_id = options.handlerId ?? 'vsr.non-mesh-representation-component-import.v0.1';
  const expectedKind = options.representationKind;
  return {
    handler_id,
    ...(expectedKind ? {representation_kind: expectedKind} : {}),
    compile: async ({entry, assets, payloads}) => {
      if (!Array.isArray(assets) || !(payloads instanceof Map)) throw new Error('VSR non-mesh representation import requires an asset list and payload map.');
      if (assets.some(asset => !asset || !nonEmpty(asset.id)) || new Set(assets.map(asset => asset.id)).size !== assets.length) throw new Error('VSR non-mesh representation asset IDs must be unique and non-empty.');
      const manifestAssets = assets.filter(isManifestAsset).sort((left, right) => left.id.localeCompare(right.id));
      if (manifestAssets.length !== 1) throw new Error(`VSR non-mesh representation import requires exactly one manifest, received ${manifestAssets.length}.`);
      const manifestAsset = manifestAssets[0]!;
      const manifest = parseManifest(payloads, manifestAsset);
      const entryKind = canonicalKind(entry.representation_kind ?? entry.representationKind);
      if (!entryKind && !expectedKind) throw new Error('VSR non-mesh representation entry kind is missing or unsupported.');
      if (entryKind && expectedKind && entryKind !== expectedKind) throw new Error('VSR non-mesh representation entry kind does not match handler.');
      const componentId = String(entry.component_id ?? entry.componentId ?? manifest.component_id ?? '').trim();
      if (!componentId) throw new Error('VSR non-mesh representation component id is required.');
      const validation = validateManifest(manifest, {entry, componentId, expectedKind: entryKind ?? expectedKind, assets, payloads, manifestAsset});
      const sceneId = String(options.sceneId?.(entry, manifestAsset) ?? `component-vsr-import-${validation.kind}-${componentId}`).trim();
      if (!sceneId) throw new Error('VSR non-mesh representation scene id is required.');
      const candidateBaseValue: Omit<VSRNonMeshRepresentationCandidate, 'candidateRoot'> = {
        format: VSR_NON_MESH_REPRESENTATION_CANDIDATE_FORMAT,
        version: '0.1.0',
        componentId,
        representationKind: validation.kind,
        profileId: manifest.profile_id,
        payloadAssetIds: [...manifest.payload_asset_ids],
        payloadFormat: manifest.payload_format,
        payloadByteLength: manifest.payload_byte_length,
        elementCount: manifest.element_count,
        bounds: {min: [...manifest.bounds.min] as [number, number, number], max: [...manifest.bounds.max] as [number, number, number]},
        manifestRoot: manifest.manifest_root,
        contentRoot: validation.contentRoot,
        renderStatus: 'NOT_IMPLEMENTED',
        candidateOnly: true,
        authoritative: false
      };
      const candidate: VSRNonMeshRepresentationCandidate = {...candidateBaseValue, candidateRoot: cryptographicHash(candidateBaseValue)};
      const consumed_asset_ids = [manifestAsset.id, ...manifest.payload_asset_ids];
      const consumed = new Set(consumed_asset_ids);
      const deferred_asset_ids = assets.map(asset => asset.id).filter(assetId => !consumed.has(assetId));
      const resourceRootValue = validation.resourceRoot;
      const receiptBaseValue: Omit<VSRNonMeshRepresentationImportReceipt, 'receiptRoot'> = {
        format: VSR_NON_MESH_REPRESENTATION_IMPORT_FORMAT,
        version: '0.1.0',
        componentId,
        sceneId,
        representationKind: validation.kind,
        profileId: manifest.profile_id,
        manifestRoot: manifest.manifest_root,
        contentRoot: validation.contentRoot,
        resourceRoot: resourceRootValue,
        candidateRoot: candidate.candidateRoot,
        payloadAssetIds: [...manifest.payload_asset_ids],
        payloadFormat: manifest.payload_format,
        payloadByteLength: manifest.payload_byte_length,
        payloadCount: manifest.payload_asset_ids.length,
        elementCount: manifest.element_count,
        renderStatus: 'NOT_IMPLEMENTED',
        candidateOnly: true,
        authoritative: false
      };
      const receipt: VSRNonMeshRepresentationImportReceipt = {...receiptBaseValue, receiptRoot: cryptographicHash(receiptBaseValue)};
      return {
        status: 'EXECUTED',
        candidate,
        receipt,
        output_root: candidate.candidateRoot,
        consumed_asset_ids,
        deferred_asset_ids,
        metrics: {
          representation_element_count: candidate.elementCount,
          representation_payload_count: candidate.payloadAssetIds.length,
          representation_byte_length: candidate.payloadByteLength,
          rendered: 0,
          candidate_only: 1
        }
      };
    },
    verify: ({result}) => Boolean(result
      && result.status === 'EXECUTED'
      && result.output_root === result.receipt.candidateRoot
      && coverageValid(result)
      && verifyVsrNonMeshRepresentationImportReceipt(result.receipt, result.candidate)
      && result.metrics.representation_element_count === result.receipt.elementCount
      && result.metrics.representation_payload_count === result.receipt.payloadCount
      && result.metrics.representation_byte_length === result.receipt.payloadByteLength
      && result.metrics.rendered === 0
      && result.metrics.candidate_only === 1)
  };
}
