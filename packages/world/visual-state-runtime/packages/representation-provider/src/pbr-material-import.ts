import { cryptographicHash } from '../../spec/src/index.js';

type JsonRecord = Record<string, unknown>;

export const VSR_PBR_TEXTURE_PACK_FORMAT = 'reality-asset.pbr-texture-pack.v0.4' as const;
export const VSR_PBR_MATERIAL_CANDIDATE_FORMAT = 'vsr.pbr-material-candidate.v0.1' as const;
export const VSR_PBR_MATERIAL_IMPORT_FORMAT = 'vsr.pbr-material-import-receipt.v0.1' as const;

export const VSR_PBR_MATERIAL_CHANNEL_ROLES = Object.freeze([
  'base-color',
  'normal',
  'occlusion-roughness-metallic',
  'emissive'
] as const);
export type VSRPbrMaterialChannelRole = typeof VSR_PBR_MATERIAL_CHANNEL_ROLES[number];
export type VSRPbrMaterialColorSpace = 'srgb' | 'linear';

export interface VSRPbrMaterialAsset {
  id: string;
  kind?: string;
  format?: string;
  role?: string;
  uri?: string;
  metadata?: JsonRecord;
}

export interface VSRPbrMaterialImportContext {
  entry: JsonRecord;
  assets: VSRPbrMaterialAsset[];
  payloads: Map<string, Uint8Array>;
}

export interface VSRPbrMaterialCandidate {
  format: typeof VSR_PBR_MATERIAL_CANDIDATE_FORMAT;
  version: '0.1.0';
  componentId: string;
  assetId: string;
  representationKind: 'material';
  profileId: string;
  materialModel: string;
  variant: string;
  channelRoles: VSRPbrMaterialChannelRole[];
  channelAssetIds: string[];
  sourceChannelAssetIds?: string[];
  channelByteLengths: number[];
  channelByteRoots: string[];
  channelColorSpaces: VSRPbrMaterialColorSpace[];
  metadataAssetId?: string;
  metadataRoot?: string;
  packRoot?: string;
  resourceRoot: string;
  candidateOnly: true;
  authoritative: false;
  candidateRoot: string;
}

export interface VSRPbrMaterialImportReceipt {
  format: typeof VSR_PBR_MATERIAL_IMPORT_FORMAT;
  version: '0.1.0';
  componentId: string;
  sceneId: string;
  assetId: string;
  representationKind: 'material';
  profileId: string;
  materialModel: string;
  variant: string;
  channelRoles: VSRPbrMaterialChannelRole[];
  channelAssetIds: string[];
  sourceChannelAssetIds?: string[];
  channelByteLengths: number[];
  channelByteRoots: string[];
  channelColorSpaces: VSRPbrMaterialColorSpace[];
  metadataAssetId?: string;
  metadataRoot?: string;
  packRoot?: string;
  resourceRoot: string;
  candidateRoot: string;
  channelCount: number;
  byteLength: number;
  candidateOnly: true;
  authoritative: false;
  receiptRoot: string;
}

export interface VSRPbrMaterialComponentImportResult {
  status: 'EXECUTED';
  candidate: VSRPbrMaterialCandidate;
  receipt: VSRPbrMaterialImportReceipt;
  output_root: string;
  consumed_asset_ids: string[];
  deferred_asset_ids: string[];
  metrics: Record<string, number>;
}

export interface VSRPbrMaterialComponentImportHandlerOptions {
  handlerId?: string;
  sceneId?: (entry: JsonRecord, materialAsset: VSRPbrMaterialAsset) => string;
  requirePackMetadata?: boolean;
}

export interface VSRPbrMaterialComponentImportHandler {
  handler_id: string;
  representation_kind: 'material';
  compile: (context: VSRPbrMaterialImportContext) => Promise<VSRPbrMaterialComponentImportResult>;
  verify: (input: {result: VSRPbrMaterialComponentImportResult}) => boolean;
}

interface ParsedPackMetadata {
  assetId: string;
  variant: string;
  size: number;
  materialModel: string;
  colorSpaces: Record<VSRPbrMaterialChannelRole, VSRPbrMaterialColorSpace>;
  files: Array<{name: string; role: VSRPbrMaterialChannelRole; mime: string; root: string}>;
  packRoot: string;
}

const isHexRoot = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
const nonEmpty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const roleList = [...VSR_PBR_MATERIAL_CHANNEL_ROLES];
const isRecord = (value: unknown): value is JsonRecord => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

function normalizedText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function canonicalRole(value: unknown): VSRPbrMaterialChannelRole | undefined {
  const normalized = normalizedText(value).toLowerCase().replace(/_/g, '-');
  if (['base-color', 'basecolor', 'pbr-base-color', 'albedo', 'pbr-albedo'].includes(normalized)) return 'base-color';
  if (['normal', 'pbr-normal'].includes(normalized)) return 'normal';
  if (['orm', 'pbr-orm', 'occlusion-roughness-metallic', 'metallic-roughness', 'occlusion-roughness-metallic-pack'].includes(normalized)) return 'occlusion-roughness-metallic';
  if (['emissive', 'pbr-emissive'].includes(normalized)) return 'emissive';
  return undefined;
}

function assetRole(asset: VSRPbrMaterialAsset): VSRPbrMaterialChannelRole | undefined {
  return canonicalRole(asset.metadata?.pbr_role ?? asset.metadata?.pbrRole ?? asset.role ?? asset.metadata?.role);
}

function metadataRole(asset: VSRPbrMaterialAsset): string {
  return normalizedText(asset.metadata?.role ?? asset.metadata?.material_role ?? asset.role).toLowerCase().replace(/_/g, '-');
}

function isPackMetadataAsset(asset: VSRPbrMaterialAsset): boolean {
  return metadataRole(asset) === 'pbr-material-metadata'
    || metadataRole(asset) === 'pbr-texture-pack-metadata'
    || asset.metadata?.pbr_material_metadata === true;
}

/** Return whether a component context contains an explicit PBR material pack. */
export function hasVsrPbrMaterialAssets(assets: readonly VSRPbrMaterialAsset[]): boolean {
  return assets.some(asset => isPackMetadataAsset(asset) || assetRole(asset) !== undefined);
}

function assetFormat(asset: VSRPbrMaterialAsset): string {
  return normalizedText(asset.format ?? asset.metadata?.format).toLowerCase();
}

function sourceAssetId(asset: VSRPbrMaterialAsset): string | undefined {
  if (!Object.prototype.hasOwnProperty.call(asset.metadata ?? {}, 'source_asset_id')) return undefined;
  const value = asset.metadata?.source_asset_id;
  if (!nonEmpty(value) || value.trim().length > 256) throw new Error(`VSR PBR material source asset ID ${String(value)} is invalid.`);
  return value.trim();
}

function bytesFor(payloads: Map<string, Uint8Array>, asset: VSRPbrMaterialAsset): Uint8Array {
  const bytes = payloads.get(asset.id);
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0) throw new Error(`VSR PBR material payload ${asset.id} is missing or empty.`);
  return bytes;
}

function base64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  if (typeof btoa === 'function') return btoa(binary);
  return Buffer.from(bytes).toString('base64');
}

function packByteRoot(bytes: Uint8Array): string {
  // RAGF pbr.mjs seals each file root over the base64 representation. Keep
  // this donor contract explicit while the VSR candidate also records a
  // byte-array root for its own resource binding.
  return cryptographicHash(base64(bytes));
}

function parseMetadata(payloads: Map<string, Uint8Array>, asset: VSRPbrMaterialAsset): ParsedPackMetadata {
  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder().decode(bytesFor(payloads, asset)));
  } catch (error) {
    throw new Error(`VSR PBR material metadata is invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!isRecord(value)) throw new Error('VSR PBR material metadata must be an object.');
  const pack = value;
  if (pack.format !== VSR_PBR_TEXTURE_PACK_FORMAT || !nonEmpty(pack.asset_id) || !nonEmpty(pack.variant) || !nonEmpty(pack.material_model)) {
    throw new Error('VSR PBR material metadata contract is invalid.');
  }
  if (!Number.isSafeInteger(pack.size) || Number(pack.size) < 1 || Number(pack.size) > 16384) throw new Error('VSR PBR material metadata texture size is invalid.');
  if (!isHexRoot(pack.pack_root)) throw new Error('VSR PBR material metadata pack root is invalid.');
  const colorSpace = pack.color_space;
  if (!isRecord(colorSpace)) throw new Error('VSR PBR material metadata color spaces are missing.');
  const expectedColorSpaces: Record<VSRPbrMaterialChannelRole, VSRPbrMaterialColorSpace> = {
    'base-color': 'srgb',
    normal: 'linear',
    'occlusion-roughness-metallic': 'linear',
    emissive: 'srgb'
  };
  for (const role of roleList) if (colorSpace[role] !== expectedColorSpaces[role]) throw new Error(`VSR PBR material color space for ${role} is invalid.`);
  if (!Array.isArray(pack.files) || pack.files.length !== roleList.length) throw new Error('VSR PBR material metadata must declare exactly four channel files.');
  const files = pack.files.map((file, index) => {
    if (!isRecord(file) || !nonEmpty(file.name) || !nonEmpty(file.mime) || !isHexRoot(file.root)) throw new Error(`VSR PBR material metadata file ${index} is invalid.`);
    const role = canonicalRole(file.role);
    if (!role) throw new Error(`VSR PBR material metadata file ${index} has an unsupported role.`);
    return {name: file.name.trim(), role, mime: file.mime.trim().toLowerCase(), root: file.root};
  });
  if (new Set(files.map(file => file.role)).size !== roleList.length || !roleList.every(role => files.some(file => file.role === role))) throw new Error('VSR PBR material metadata channel roles are incomplete or duplicated.');
  const {pack_root: _packRoot, ...packBase} = pack;
  if (cryptographicHash(packBase) !== pack.pack_root) throw new Error('VSR PBR material metadata pack root mismatch.');
  return {
    assetId: pack.asset_id.trim(),
    variant: pack.variant.trim(),
    size: Number(pack.size),
    materialModel: pack.material_model.trim(),
    colorSpaces: expectedColorSpaces,
    files,
    packRoot: pack.pack_root
  };
}

function entryText(entry: JsonRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = normalizedText(entry[key]);
    if (value) return value;
  }
  return undefined;
}

function profileIdFromEntry(entry: JsonRecord): string | undefined {
  const direct = entryText(entry, 'representation_profile', 'representationProfile', 'profile_id', 'profileId');
  if (direct) return direct;
  const nested = entry.representation_profile ?? entry.representationProfile;
  return isRecord(nested) ? entryText(nested, 'profile_id', 'profileId') : undefined;
}

function resolveChannelAssets(assets: VSRPbrMaterialAsset[]): Map<VSRPbrMaterialChannelRole, VSRPbrMaterialAsset> {
  const channels = new Map<VSRPbrMaterialChannelRole, VSRPbrMaterialAsset>();
  for (const asset of assets) {
    const role = assetRole(asset);
    if (!role) continue;
    const format = assetFormat(asset);
    if (asset.kind !== 'texture' && !format.startsWith('image/')) throw new Error(`VSR PBR material channel ${asset.id} is not an image asset.`);
    if (channels.has(role)) throw new Error(`VSR PBR material channel ${role} is duplicated.`);
    channels.set(role, asset);
  }
  if (channels.size !== roleList.length || !roleList.every(role => channels.has(role))) throw new Error(`VSR PBR material pack is incomplete: ${channels.size}/${roleList.length} channels.`);
  return channels;
}

function resourceRoot({componentId, assetId, metadataAsset, metadataBytes, channelIds, sourceChannelIds, channelBytes}: {componentId: string; assetId: string; metadataAsset?: VSRPbrMaterialAsset; metadataBytes?: Uint8Array; channelIds: string[]; sourceChannelIds: string[]; channelBytes: Uint8Array[]}): string {
  const resources = [
    ...(metadataAsset && metadataBytes ? [{assetId: metadataAsset.id, byteLength: metadataBytes.byteLength, byteRoot: cryptographicHash([...metadataBytes])}] : []),
    ...roleList.map((role, index) => ({
      role,
      assetId: channelIds[index]!,
      ...(sourceChannelIds[index] === channelIds[index] ? {} : {sourceAssetId: sourceChannelIds[index]}),
      byteLength: channelBytes[index]!.byteLength,
      byteRoot: cryptographicHash([...channelBytes[index]!])
    }))
  ];
  return cryptographicHash({componentId, assetId, representationKind: 'material', resources});
}

function candidateBase(candidate: VSRPbrMaterialCandidate): Omit<VSRPbrMaterialCandidate, 'candidateRoot'> {
  const {candidateRoot: _candidateRoot, ...base} = candidate;
  return base;
}

function receiptBase(receipt: VSRPbrMaterialImportReceipt): Omit<VSRPbrMaterialImportReceipt, 'receiptRoot'> {
  const {receiptRoot: _receiptRoot, ...base} = receipt;
  return base;
}

function sourceIdsValid(value: unknown, channelIds: string[]): value is string[] {
  return value === undefined
    || (Array.isArray(value)
      && value.length === channelIds.length
      && value.every(nonEmpty)
      && new Set(value).size === value.length);
}

function coverageValid(result: VSRPbrMaterialComponentImportResult): boolean {
  const consumed = result.consumed_asset_ids;
  const deferred = result.deferred_asset_ids;
  return Array.isArray(consumed) && Array.isArray(deferred)
    && consumed.every(nonEmpty) && deferred.every(nonEmpty)
    && new Set(consumed).size === consumed.length && new Set(deferred).size === deferred.length
    && consumed.every(assetId => !deferred.includes(assetId));
}

function candidateValid(candidate: VSRPbrMaterialCandidate): boolean {
  return candidate?.format === VSR_PBR_MATERIAL_CANDIDATE_FORMAT
    && candidate.version === '0.1.0'
    && nonEmpty(candidate.componentId)
    && nonEmpty(candidate.assetId)
    && candidate.representationKind === 'material'
    && nonEmpty(candidate.profileId)
    && nonEmpty(candidate.materialModel)
    && nonEmpty(candidate.variant)
    && JSON.stringify(candidate.channelRoles) === JSON.stringify(roleList)
    && Array.isArray(candidate.channelAssetIds)
    && candidate.channelAssetIds.length === roleList.length
    && candidate.channelAssetIds.every(nonEmpty)
    && new Set(candidate.channelAssetIds).size === roleList.length
    && sourceIdsValid(candidate.sourceChannelAssetIds, candidate.channelAssetIds)
    && Array.isArray(candidate.channelByteLengths)
    && candidate.channelByteLengths.length === roleList.length
    && candidate.channelByteLengths.every(value => Number.isSafeInteger(value) && value > 0)
    && Array.isArray(candidate.channelByteRoots)
    && candidate.channelByteRoots.length === roleList.length
    && candidate.channelByteRoots.every(isHexRoot)
    && Array.isArray(candidate.channelColorSpaces)
    && JSON.stringify(candidate.channelColorSpaces) === JSON.stringify(['srgb', 'linear', 'linear', 'srgb'])
    && (candidate.metadataAssetId === undefined || nonEmpty(candidate.metadataAssetId))
    && (candidate.metadataRoot === undefined || isHexRoot(candidate.metadataRoot))
    && (candidate.packRoot === undefined || isHexRoot(candidate.packRoot))
    && isHexRoot(candidate.resourceRoot)
    && candidate.candidateOnly === true
    && candidate.authoritative === false
    && isHexRoot(candidate.candidateRoot)
    && cryptographicHash(candidateBase(candidate)) === candidate.candidateRoot;
}

/** Verify the receipt and, when supplied, its bound PBR candidate. */
export function verifyVsrPbrMaterialImportReceipt(receipt: VSRPbrMaterialImportReceipt, candidate?: VSRPbrMaterialCandidate): boolean {
  try {
    if (!receipt || receipt.format !== VSR_PBR_MATERIAL_IMPORT_FORMAT || receipt.version !== '0.1.0' || !nonEmpty(receipt.componentId) || !nonEmpty(receipt.sceneId) || !nonEmpty(receipt.assetId) || receipt.representationKind !== 'material' || !nonEmpty(receipt.profileId) || !nonEmpty(receipt.materialModel) || !nonEmpty(receipt.variant) || JSON.stringify(receipt.channelRoles) !== JSON.stringify(roleList) || !Array.isArray(receipt.channelAssetIds) || receipt.channelAssetIds.length !== roleList.length || receipt.channelAssetIds.some(assetId => !nonEmpty(assetId)) || new Set(receipt.channelAssetIds).size !== roleList.length || !sourceIdsValid(receipt.sourceChannelAssetIds, receipt.channelAssetIds) || !Array.isArray(receipt.channelByteLengths) || receipt.channelByteLengths.length !== roleList.length || receipt.channelByteLengths.some(value => !Number.isSafeInteger(value) || value < 1) || !Array.isArray(receipt.channelByteRoots) || receipt.channelByteRoots.length !== roleList.length || receipt.channelByteRoots.some(root => !isHexRoot(root)) || !Array.isArray(receipt.channelColorSpaces) || JSON.stringify(receipt.channelColorSpaces) !== JSON.stringify(['srgb', 'linear', 'linear', 'srgb']) || (receipt.metadataAssetId !== undefined && !nonEmpty(receipt.metadataAssetId)) || (receipt.metadataRoot !== undefined && !isHexRoot(receipt.metadataRoot)) || (receipt.packRoot !== undefined && !isHexRoot(receipt.packRoot)) || !isHexRoot(receipt.resourceRoot) || receipt.candidateRoot.length !== 64 || !isHexRoot(receipt.candidateRoot) || receipt.channelCount !== roleList.length || !Number.isSafeInteger(receipt.byteLength) || receipt.byteLength !== receipt.channelByteLengths.reduce((sum, value) => sum + value, 0) || receipt.candidateOnly !== true || receipt.authoritative !== false || !isHexRoot(receipt.receiptRoot)) return false;
    if (cryptographicHash(receiptBase(receipt)) !== receipt.receiptRoot) return false;
    if (candidate) return candidateValid(candidate)
      && candidate.componentId === receipt.componentId
      && candidate.assetId === receipt.assetId
      && candidate.profileId === receipt.profileId
      && candidate.materialModel === receipt.materialModel
      && candidate.variant === receipt.variant
      && JSON.stringify(candidate.channelRoles) === JSON.stringify(receipt.channelRoles)
      && JSON.stringify(candidate.channelAssetIds) === JSON.stringify(receipt.channelAssetIds)
      && JSON.stringify(candidate.sourceChannelAssetIds ?? null) === JSON.stringify(receipt.sourceChannelAssetIds ?? null)
      && JSON.stringify(candidate.channelByteLengths) === JSON.stringify(receipt.channelByteLengths)
      && JSON.stringify(candidate.channelByteRoots) === JSON.stringify(receipt.channelByteRoots)
      && JSON.stringify(candidate.channelColorSpaces) === JSON.stringify(receipt.channelColorSpaces)
      && candidate.metadataAssetId === receipt.metadataAssetId
      && candidate.metadataRoot === receipt.metadataRoot
      && candidate.packRoot === receipt.packRoot
      && candidate.resourceRoot === receipt.resourceRoot
      && candidate.candidateRoot === receipt.candidateRoot;
    return true;
  } catch {
    return false;
  }
}

/**
 * Import a standalone four-channel PBR pack as a candidate material. This is
 * a visual representation adapter: it never writes a canonical RNCS material
 * property, mutates a source asset, or claims that the channels are decoded
 * on a target renderer.
 */
export function createVsrPbrMaterialComponentImportHandler(options: VSRPbrMaterialComponentImportHandlerOptions = {}): VSRPbrMaterialComponentImportHandler {
  const handler_id = options.handlerId ?? 'vsr.pbr-material-component-import.v0.1';
  return {
    handler_id,
    representation_kind: 'material',
    compile: async ({entry, assets, payloads}) => {
      if (!Array.isArray(assets) || !(payloads instanceof Map)) throw new Error('VSR PBR material import requires an asset list and payload map.');
      if (assets.some(asset => !asset || !nonEmpty(asset.id)) || new Set(assets.map(asset => asset.id)).size !== assets.length) throw new Error('VSR PBR material asset IDs must be unique and non-empty.');
      const metadataAssets = assets.filter(isPackMetadataAsset).sort((left, right) => left.id.localeCompare(right.id));
      if (metadataAssets.length > 1) throw new Error(`VSR PBR material import requires at most one pack metadata asset, received ${metadataAssets.length}.`);
      if (options.requirePackMetadata && metadataAssets.length !== 1) throw new Error('VSR PBR material pack metadata is required.');
      const metadataAsset = metadataAssets[0];
      const metadataBytes = metadataAsset ? bytesFor(payloads, metadataAsset) : undefined;
      const metadata = metadataAsset && metadataBytes ? parseMetadata(payloads, metadataAsset) : undefined;
      const channels = resolveChannelAssets(assets);
      const componentId = entryText(entry, 'component_id', 'componentId') ?? metadata?.assetId;
      if (!componentId) throw new Error('VSR PBR material component id is required.');
      const expectedAssetId = entryText(entry, 'asset_id', 'assetId');
      const assetId = expectedAssetId ?? metadata?.assetId;
      if (!assetId) throw new Error('VSR PBR material asset id is required.');
      if (metadata?.assetId && expectedAssetId && metadata.assetId !== expectedAssetId) throw new Error('VSR PBR material metadata asset identity is not bound.');
      const profileId = profileIdFromEntry(entry) ?? 'vsr.pbr-texture-pack.v0.1';
      const materialModel = metadata?.materialModel ?? entryText(entry, 'material_model', 'materialModel') ?? 'untyped-pbr-candidate-v0.1';
      const variant = metadata?.variant ?? entryText(entry, 'variant') ?? 'unspecified';
      const materialAsset = metadataAsset ?? channels.get('base-color')!;
      const sceneId = entryText(entry, 'scene_id', 'sceneId') ?? options.sceneId?.(entry, materialAsset) ?? `component-vsr-pbr-material-${componentId}`;
      if (!sceneId) throw new Error('VSR PBR material scene id is required.');
      const channelAssetIds = roleList.map(role => channels.get(role)!.id);
      const sourceChannelAssetIds = roleList.map(role => sourceAssetId(channels.get(role)! ) ?? channels.get(role)!.id);
      const channelBytes = roleList.map(role => bytesFor(payloads, channels.get(role)!));
      if (metadata) for (const file of metadata.files) {
        const index = roleList.indexOf(file.role);
        const asset = channels.get(file.role)!;
        const bytes = channelBytes[index]!;
        const format = assetFormat(asset);
        if (format && format !== file.mime) throw new Error(`VSR PBR material channel ${file.role} MIME does not match pack metadata.`);
        if (packByteRoot(bytes) !== file.root) throw new Error(`VSR PBR material channel ${file.role} root does not match pack metadata.`);
      }
      const channelByteLengths = channelBytes.map(bytes => bytes.byteLength);
      const channelByteRoots = channelBytes.map(bytes => cryptographicHash([...bytes]));
      const materialResourceRoot = resourceRoot({componentId, assetId, metadataAsset, metadataBytes, channelIds: channelAssetIds, sourceChannelIds: sourceChannelAssetIds, channelBytes});
      const sourceIdsDiffer = sourceChannelAssetIds.some((sourceId, index) => sourceId !== channelAssetIds[index]);
      const candidateBaseValue: Omit<VSRPbrMaterialCandidate, 'candidateRoot'> = {
        format: VSR_PBR_MATERIAL_CANDIDATE_FORMAT,
        version: '0.1.0',
        componentId,
        assetId,
        representationKind: 'material',
        profileId,
        materialModel,
        variant,
        channelRoles: [...roleList],
        channelAssetIds: [...channelAssetIds],
        ...(sourceIdsDiffer ? {sourceChannelAssetIds: [...sourceChannelAssetIds]} : {}),
        channelByteLengths,
        channelByteRoots,
        channelColorSpaces: roleList.map(role => metadata?.colorSpaces[role] ?? (role === 'normal' || role === 'occlusion-roughness-metallic' ? 'linear' : 'srgb')),
        ...(metadataAsset ? {metadataAssetId: metadataAsset.id} : {}),
        ...(metadataBytes ? {metadataRoot: cryptographicHash([...metadataBytes])} : {}),
        ...(metadata ? {packRoot: metadata.packRoot} : {}),
        resourceRoot: materialResourceRoot,
        candidateOnly: true,
        authoritative: false
      };
      const candidate: VSRPbrMaterialCandidate = {...candidateBaseValue, candidateRoot: cryptographicHash(candidateBaseValue)};
      const receiptBaseValue: Omit<VSRPbrMaterialImportReceipt, 'receiptRoot'> = {
        format: VSR_PBR_MATERIAL_IMPORT_FORMAT,
        version: '0.1.0',
        componentId,
        sceneId,
        assetId,
        representationKind: 'material',
        profileId,
        materialModel,
        variant,
        channelRoles: [...roleList],
        channelAssetIds: [...channelAssetIds],
        ...(sourceIdsDiffer ? {sourceChannelAssetIds: [...sourceChannelAssetIds]} : {}),
        channelByteLengths,
        channelByteRoots,
        channelColorSpaces: [...candidate.channelColorSpaces],
        ...(metadataAsset ? {metadataAssetId: metadataAsset.id} : {}),
        ...(metadataBytes ? {metadataRoot: cryptographicHash([...metadataBytes])} : {}),
        ...(metadata ? {packRoot: metadata.packRoot} : {}),
        resourceRoot: materialResourceRoot,
        candidateRoot: candidate.candidateRoot,
        channelCount: roleList.length,
        byteLength: channelByteLengths.reduce((sum, value) => sum + value, 0),
        candidateOnly: true,
        authoritative: false
      };
      const receipt: VSRPbrMaterialImportReceipt = {...receiptBaseValue, receiptRoot: cryptographicHash(receiptBaseValue)};
      const consumed_asset_ids = [...(metadataAsset ? [metadataAsset.id] : []), ...channelAssetIds];
      const consumed = new Set(consumed_asset_ids);
      const deferred_asset_ids = assets.map(asset => asset.id).filter(assetIdValue => !consumed.has(assetIdValue));
      return {
        status: 'EXECUTED',
        candidate,
        receipt,
        output_root: candidate.candidateRoot,
        consumed_asset_ids,
        deferred_asset_ids,
        metrics: {
          pbr_channel_count: roleList.length,
          pbr_byte_length: receipt.byteLength,
          pbr_metadata_present: metadataAsset ? 1 : 0,
          rendered: 0,
          candidate_only: 1
        }
      };
    },
    verify: ({result}) => Boolean(result
      && result.status === 'EXECUTED'
      && result.output_root === result.receipt.candidateRoot
      && coverageValid(result)
      && verifyVsrPbrMaterialImportReceipt(result.receipt, result.candidate)
      && result.metrics.pbr_channel_count === result.receipt.channelCount
      && result.metrics.pbr_byte_length === result.receipt.byteLength
      && result.metrics.pbr_metadata_present === (result.receipt.metadataAssetId ? 1 : 0)
      && result.metrics.rendered === 0
      && result.metrics.candidate_only === 1)
  };
}
