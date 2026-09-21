import { cryptographicHash } from '../../spec/src/index.js';
import { lowerVsrSdfCandidateToSpatialScene, VSR_SDF_PAYLOAD_FORMAT } from './sdf-spatial.js';
import type { Vec3, VSRSpatialScene3D } from './index.js';
import type { VSRSdfRepresentationCandidate } from './sdf-spatial.js';

export const VSR_NEURAL_FIELD_PAYLOAD_FORMAT = 'application/vnd.vsr.neural-field.mlp3x16x4.f32.v0.1' as const;
export const VSR_NEURAL_FIELD_SCENE_FORMAT = 'vsr.spatial-neural-field-scene.v0.1' as const;
export const VSR_NEURAL_FIELD_SCENE_VERSION = '0.1.0' as const;
export const VSR_NEURAL_FIELD_HEADER_BYTE_LENGTH = 16;
export const VSR_NEURAL_FIELD_INPUT_WIDTH = 3;
export const VSR_NEURAL_FIELD_HIDDEN_WIDTH = 16;
export const VSR_NEURAL_FIELD_OUTPUT_WIDTH = 4;
export const VSR_NEURAL_FIELD_PARAMETER_COUNT = 132;
export const VSR_NEURAL_FIELD_SOURCE_LIMIT = 1000000;
export const VSR_NEURAL_FIELD_SAMPLE_RESOLUTION_LIMIT = 64;

type JsonRecord = Record<string, unknown>;

export interface VSRNeuralFieldRepresentationCandidate {
  format: 'vsr.non-mesh-representation-candidate.v0.1';
  version: '0.1.0';
  componentId: string;
  representationKind: 'neural-field';
  profileId: string;
  payloadAssetIds: string[];
  sourcePayloadAssetIds?: string[];
  payloadFormat: string;
  payloadByteLength: number;
  elementCount: number;
  bounds: {min: Vec3; max: Vec3};
  manifestRoot: string;
  contentRoot: string;
  renderStatus: 'NOT_IMPLEMENTED';
  candidateOnly: true;
  authoritative: false;
  candidateRoot: string;
}

export interface VSRNeuralFieldPayloadAsset {
  id: string;
  kind?: string;
  format?: string;
  metadata?: JsonRecord;
}

export interface VSRNeuralFieldSpatialLoweringOptions {
  baseScene?: VSRSpatialScene3D;
  sceneId?: string;
  title?: string;
  origin?: Vec3;
  sampleResolution?: number;
  maxTriangles?: number;
  baseColor?: string;
  idPrefix?: string;
}

export interface VSRNeuralFieldSpatialSceneResult {
  format: typeof VSR_NEURAL_FIELD_SCENE_FORMAT;
  version: typeof VSR_NEURAL_FIELD_SCENE_VERSION;
  status: 'EXECUTED';
  renderStatus: 'CANDIDATE_CPU_NEURAL_FIELD_SURFACE';
  componentId: string;
  sceneId: string;
  sourceCandidateRoot: string;
  contentRoot: string;
  bounds: {min: Vec3; max: Vec3};
  inputWidth: number;
  hiddenWidth: number;
  outputWidth: number;
  parameterCount: number;
  sampleResolution: number;
  sampleCount: number;
  triangleCount: number;
  renderableCount: number;
  maxTriangles: number;
  truncated: boolean;
  baseColor: string;
  origin: Vec3;
  meshId: string;
  meshRoot: string;
  scene: VSRSpatialScene3D;
  sceneRoot: string;
  neuralRoot: string;
  candidateOnly: true;
  authoritative: false;
  root: string;
}

interface NeuralFieldNetwork {
  inputWidth: number;
  hiddenWidth: number;
  outputWidth: number;
  weightsInputHidden: number[];
  biasHidden: number[];
  weightsHiddenOutput: number[];
  biasOutput: number[];
  parameterCount: number;
}

const EPS = 1e-9;
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isRoot = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
const nonEmpty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

function validBounds(bounds: unknown): bounds is {min: Vec3; max: Vec3} {
  if (!bounds || typeof bounds !== 'object' || Array.isArray(bounds)) return false;
  const value = bounds as JsonRecord;
  const min = value.min;
  const max = value.max;
  return Array.isArray(min) && min.length === 3 && min.every(finite)
    && Array.isArray(max) && max.length === 3 && max.every(finite)
    && (min as number[]).every((component, index) => component < (max as number[])[index]!);
}

function candidateBase(candidate: VSRNeuralFieldRepresentationCandidate): Omit<VSRNeuralFieldRepresentationCandidate, 'candidateRoot'> {
  const {candidateRoot: _candidateRoot, ...base} = candidate;
  return base;
}

function sourcePayloadIds(candidate: VSRNeuralFieldRepresentationCandidate): string[] {
  const sourceIds = candidate.sourcePayloadAssetIds ?? candidate.payloadAssetIds;
  if (sourceIds.length !== candidate.payloadAssetIds.length || sourceIds.some(assetId => !nonEmpty(assetId)) || new Set(sourceIds).size !== sourceIds.length) throw new Error('VSR neural-field logical payload binding is invalid.');
  return sourceIds;
}

function payloadBytes(payloads: Map<string, Uint8Array>, asset: VSRNeuralFieldPayloadAsset): Uint8Array {
  const bytes = payloads.get(asset.id);
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0) throw new Error(`VSR neural-field payload ${asset.id} is missing or empty.`);
  return bytes;
}

function contentRoot(candidate: VSRNeuralFieldRepresentationCandidate, assets: VSRNeuralFieldPayloadAsset[], payloads: Map<string, Uint8Array>): string {
  const sourceIds = sourcePayloadIds(candidate);
  return cryptographicHash(candidate.payloadAssetIds.map((assetId, index) => {
    const matches = assets.filter(entry => entry.id === assetId);
    if (matches.length !== 1) throw new Error(`VSR neural-field payload asset ${assetId} is missing or ambiguous.`);
    const bytes = payloadBytes(payloads, matches[0]!);
    return {assetId: sourceIds[index]!, byteLength: bytes.byteLength, byteRoot: cryptographicHash([...bytes])};
  }));
}

function mergePayload(candidate: VSRNeuralFieldRepresentationCandidate, assets: VSRNeuralFieldPayloadAsset[], payloads: Map<string, Uint8Array>): Uint8Array {
  const ordered = candidate.payloadAssetIds.map(assetId => {
    const matches = assets.filter(entry => entry.id === assetId);
    if (matches.length !== 1) throw new Error(`VSR neural-field payload asset ${assetId} is missing or ambiguous.`);
    const asset = matches[0]!;
    if ((asset.format ?? asset.metadata?.format) !== candidate.payloadFormat) throw new Error(`VSR neural-field payload ${assetId} format is not ${candidate.payloadFormat}.`);
    return payloadBytes(payloads, asset);
  });
  const byteLength = ordered.reduce((sum, page) => sum + page.byteLength, 0);
  if (byteLength !== candidate.payloadByteLength) throw new Error('VSR neural-field payload byte length mismatch.');
  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const page of ordered) {
    bytes.set(page, offset);
    offset += page.byteLength;
  }
  return bytes;
}

function readNetwork(bytes: Uint8Array): NeuralFieldNetwork {
  if (bytes.byteLength < VSR_NEURAL_FIELD_HEADER_BYTE_LENGTH) throw new Error('VSR neural-field payload header is missing.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const inputWidth = view.getUint32(0, true);
  const hiddenWidth = view.getUint32(4, true);
  const outputWidth = view.getUint32(8, true);
  const activation = view.getUint32(12, true);
  if (inputWidth !== VSR_NEURAL_FIELD_INPUT_WIDTH || hiddenWidth !== VSR_NEURAL_FIELD_HIDDEN_WIDTH || outputWidth !== VSR_NEURAL_FIELD_OUTPUT_WIDTH || activation !== 1) throw new Error('VSR neural-field network header is not the bounded tanh 3x16x4 profile.');
  const parameterCount = inputWidth * hiddenWidth + hiddenWidth + hiddenWidth * outputWidth + outputWidth;
  if (parameterCount !== VSR_NEURAL_FIELD_PARAMETER_COUNT || bytes.byteLength !== VSR_NEURAL_FIELD_HEADER_BYTE_LENGTH + parameterCount * 4) throw new Error('VSR neural-field parameter byte length is invalid.');
  const values = Array.from({length: parameterCount}, (_, index) => view.getFloat32(VSR_NEURAL_FIELD_HEADER_BYTE_LENGTH + index * 4, true));
  if (values.some(value => !finite(value) || Math.abs(value) > 1000)) throw new Error('VSR neural-field parameter values are non-finite or outside the bounded range.');
  let offset = 0;
  const weightsInputHidden = values.slice(offset, offset += inputWidth * hiddenWidth);
  const biasHidden = values.slice(offset, offset += hiddenWidth);
  const weightsHiddenOutput = values.slice(offset, offset += hiddenWidth * outputWidth);
  const biasOutput = values.slice(offset, offset + outputWidth);
  return {inputWidth, hiddenWidth, outputWidth, weightsInputHidden, biasHidden, weightsHiddenOutput, biasOutput, parameterCount};
}

function evaluateNetwork(network: NeuralFieldNetwork, input: Vec3): number[] {
  const hidden = Array.from({length: network.hiddenWidth}, (_, hiddenIndex) => {
    let value = network.biasHidden[hiddenIndex]!;
    for (let inputIndex = 0; inputIndex < network.inputWidth; inputIndex++) value += network.weightsInputHidden[hiddenIndex * network.inputWidth + inputIndex]! * input[inputIndex]!;
    return Math.tanh(value);
  });
  return Array.from({length: network.outputWidth}, (_, outputIndex) => {
    let value = network.biasOutput[outputIndex]!;
    for (let hiddenIndex = 0; hiddenIndex < network.hiddenWidth; hiddenIndex++) value += network.weightsHiddenOutput[outputIndex * network.hiddenWidth + hiddenIndex]! * hidden[hiddenIndex]!;
    return value;
  });
}

function sigmoid(value: number): number {
  return 1 / (1 + Math.exp(-Math.max(-60, Math.min(60, value))));
}

function rgbHex(rgb: [number, number, number]): string {
  return `#${rgb.map(value => Math.round(Math.max(0, Math.min(1, value)) * 255).toString(16).padStart(2, '0')).join('')}`;
}

function sampleField(network: NeuralFieldNetwork, bounds: {min: Vec3; max: Vec3}, resolution: number): Uint8Array {
  const count = resolution * resolution * resolution;
  const bytes = new Uint8Array(16 + count * 4);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, resolution, true);
  view.setUint32(4, resolution, true);
  view.setUint32(8, resolution, true);
  const center: Vec3 = [(bounds.min[0] + bounds.max[0]) / 2, (bounds.min[1] + bounds.max[1]) / 2, (bounds.min[2] + bounds.max[2]) / 2];
  const half: Vec3 = [(bounds.max[0] - bounds.min[0]) / 2, (bounds.max[1] - bounds.min[1]) / 2, (bounds.max[2] - bounds.min[2]) / 2];
  for (let z = 0; z < resolution; z++) {
    for (let y = 0; y < resolution; y++) {
      for (let x = 0; x < resolution; x++) {
        const position: Vec3 = [
          bounds.min[0] + ((bounds.max[0] - bounds.min[0]) * x) / (resolution - 1),
          bounds.min[1] + ((bounds.max[1] - bounds.min[1]) * y) / (resolution - 1),
          bounds.min[2] + ((bounds.max[2] - bounds.min[2]) * z) / (resolution - 1)
        ];
        const input: Vec3 = [(position[0] - center[0]) / half[0], (position[1] - center[1]) / half[1], (position[2] - center[2]) / half[2]];
        const output = evaluateNetwork(network, input);
        view.setFloat32(16 + (x + resolution * (y + resolution * z)) * 4, output[0]!, true);
      }
    }
  }
  return bytes;
}

function centerColor(network: NeuralFieldNetwork): string {
  const output = evaluateNetwork(network, [0, 0, 0]);
  return rgbHex([sigmoid(output[1]!), sigmoid(output[2]!), sigmoid(output[3]!)]);
}

function neuralPayload(result: Pick<VSRNeuralFieldSpatialSceneResult, 'componentId' | 'sceneId' | 'sourceCandidateRoot' | 'contentRoot' | 'bounds' | 'inputWidth' | 'hiddenWidth' | 'outputWidth' | 'parameterCount' | 'sampleResolution' | 'sampleCount' | 'triangleCount' | 'renderableCount' | 'maxTriangles' | 'truncated' | 'baseColor' | 'origin' | 'meshId' | 'meshRoot'>): JsonRecord {
  return {
    format: VSR_NEURAL_FIELD_SCENE_FORMAT,
    version: VSR_NEURAL_FIELD_SCENE_VERSION,
    componentId: result.componentId,
    sceneId: result.sceneId,
    sourceCandidateRoot: result.sourceCandidateRoot,
    contentRoot: result.contentRoot,
    bounds: result.bounds,
    inputWidth: result.inputWidth,
    hiddenWidth: result.hiddenWidth,
    outputWidth: result.outputWidth,
    parameterCount: result.parameterCount,
    sampleResolution: result.sampleResolution,
    sampleCount: result.sampleCount,
    triangleCount: result.triangleCount,
    renderableCount: result.renderableCount,
    maxTriangles: result.maxTriangles,
    truncated: result.truncated,
    baseColor: result.baseColor,
    origin: result.origin,
    meshId: result.meshId,
    meshRoot: result.meshRoot
  };
}

export function lowerVsrNeuralFieldCandidateToSpatialScene(candidate: VSRNeuralFieldRepresentationCandidate, input: {assets: VSRNeuralFieldPayloadAsset[]; payloads: Map<string, Uint8Array>}, options: VSRNeuralFieldSpatialLoweringOptions = {}): VSRNeuralFieldSpatialSceneResult {
  if (!candidate || candidate.format !== 'vsr.non-mesh-representation-candidate.v0.1' || candidate.version !== '0.1.0' || !nonEmpty(candidate.componentId) || candidate.representationKind !== 'neural-field' || !nonEmpty(candidate.profileId) || !Array.isArray(candidate.payloadAssetIds) || candidate.payloadAssetIds.length < 1 || new Set(candidate.payloadAssetIds).size !== candidate.payloadAssetIds.length || candidate.payloadAssetIds.some(assetId => !nonEmpty(assetId)) || candidate.payloadFormat !== VSR_NEURAL_FIELD_PAYLOAD_FORMAT || !Number.isSafeInteger(candidate.payloadByteLength) || candidate.payloadByteLength < VSR_NEURAL_FIELD_HEADER_BYTE_LENGTH + VSR_NEURAL_FIELD_PARAMETER_COUNT * 4 || !Number.isSafeInteger(candidate.elementCount) || candidate.elementCount !== VSR_NEURAL_FIELD_PARAMETER_COUNT || !validBounds(candidate.bounds) || !isRoot(candidate.manifestRoot) || !isRoot(candidate.contentRoot) || candidate.renderStatus !== 'NOT_IMPLEMENTED' || candidate.candidateOnly !== true || candidate.authoritative !== false || !isRoot(candidate.candidateRoot) || cryptographicHash(candidateBase(candidate)) !== candidate.candidateRoot) throw new Error('VSR neural-field candidate contract or root is invalid.');
  sourcePayloadIds(candidate);
  if (contentRoot(candidate, input.assets, input.payloads) !== candidate.contentRoot) throw new Error('VSR neural-field candidate content root mismatch.');
  const bytes = mergePayload(candidate, input.assets, input.payloads);
  const network = readNetwork(bytes);
  const sampleResolution = Math.floor(options.sampleResolution ?? 24);
  if (!Number.isSafeInteger(sampleResolution) || sampleResolution < 2 || sampleResolution > VSR_NEURAL_FIELD_SAMPLE_RESOLUTION_LIMIT) throw new Error('VSR neural-field sample resolution is outside its finite bounds.');
  const origin = options.origin ?? [0, 0, 0];
  if (!Array.isArray(origin) || origin.length !== 3 || origin.some(component => !finite(component))) throw new Error('VSR neural-field origin must be a finite XYZ triple.');
  const maxTriangles = Math.floor(options.maxTriangles ?? 32768);
  if (!Number.isSafeInteger(maxTriangles) || maxTriangles < 1 || maxTriangles > 32768) throw new Error('VSR neural-field maxTriangles is outside its bounded contract.');
  const sceneId = options.sceneId?.trim() || options.baseScene?.sceneId || `neural-field:${candidate.componentId}`;
  const namespace = options.idPrefix?.trim() || `neural-field:${candidate.componentId}:${sceneId}`;
  const sampledBytes = sampleField(network, candidate.bounds, sampleResolution);
  const internalPayloadAssetId = `internal:${candidate.componentId}:neural-field-sampled-grid`;
  const internalContentRoot = cryptographicHash([{assetId: internalPayloadAssetId, byteLength: sampledBytes.byteLength, byteRoot: cryptographicHash([...sampledBytes])}]);
  const internalCandidateBase = {
    format: 'vsr.non-mesh-representation-candidate.v0.1' as const,
    version: '0.1.0' as const,
    componentId: candidate.componentId,
    representationKind: 'sdf' as const,
    profileId: `${candidate.profileId}:sampled-surface`,
    payloadAssetIds: [internalPayloadAssetId],
    payloadFormat: VSR_SDF_PAYLOAD_FORMAT,
    payloadByteLength: sampledBytes.byteLength,
    elementCount: sampleResolution * sampleResolution * sampleResolution,
    bounds: {min: [...candidate.bounds.min] as Vec3, max: [...candidate.bounds.max] as Vec3},
    manifestRoot: candidate.manifestRoot,
    contentRoot: internalContentRoot,
    renderStatus: 'NOT_IMPLEMENTED' as const,
    candidateOnly: true as const,
    authoritative: false as const
  };
  const internalCandidate = {...internalCandidateBase, candidateRoot: cryptographicHash(internalCandidateBase)} as VSRSdfRepresentationCandidate;
  const sdfResult = lowerVsrSdfCandidateToSpatialScene(internalCandidate, {assets: [{id: internalPayloadAssetId, format: VSR_SDF_PAYLOAD_FORMAT}], payloads: new Map([[internalPayloadAssetId, sampledBytes]])}, {baseScene: options.baseScene, sceneId, title: options.title, origin, maxTriangles, baseColor: options.baseColor?.trim() || centerColor(network), idPrefix: namespace});
  const scene: VSRSpatialScene3D = {...sdfResult.scene, reality: sdfResult.scene.reality ? {...sdfResult.scene.reality, realityRoot: cryptographicHash({sceneId, purpose: 'spatial-neural-field-candidate'})} : sdfResult.scene.reality, nodes: sdfResult.scene.nodes.map(node => node.meshId === sdfResult.meshId ? {...node, tags: ['neural-field', `neural-field-component:${candidate.componentId}`]} : node)};
  const resolvedBaseColor = options.baseColor?.trim() || centerColor(network);
  const sampleCount = sampleResolution * sampleResolution * sampleResolution;
  const resultBase = {format: VSR_NEURAL_FIELD_SCENE_FORMAT, version: VSR_NEURAL_FIELD_SCENE_VERSION, status: 'EXECUTED' as const, renderStatus: 'CANDIDATE_CPU_NEURAL_FIELD_SURFACE' as const, componentId: candidate.componentId, sceneId, sourceCandidateRoot: candidate.candidateRoot, contentRoot: candidate.contentRoot, bounds: {min: [...candidate.bounds.min] as Vec3, max: [...candidate.bounds.max] as Vec3}, inputWidth: network.inputWidth, hiddenWidth: network.hiddenWidth, outputWidth: network.outputWidth, parameterCount: network.parameterCount, sampleResolution, sampleCount, triangleCount: sdfResult.triangleCount, renderableCount: sdfResult.renderableCount, maxTriangles, truncated: sdfResult.truncated, baseColor: resolvedBaseColor, origin: [...origin] as Vec3, meshId: sdfResult.meshId, meshRoot: sdfResult.meshRoot, scene, sceneRoot: cryptographicHash(scene), neuralRoot: ''};
  const neuralRoot = cryptographicHash(neuralPayload(resultBase));
  const rooted = {...resultBase, neuralRoot, candidateOnly: true as const, authoritative: false as const};
  return {...rooted, root: cryptographicHash(rooted)};
}

export function verifyVsrNeuralFieldSpatialScene(result: VSRNeuralFieldSpatialSceneResult): boolean {
  try {
    if (!result || result.format !== VSR_NEURAL_FIELD_SCENE_FORMAT || result.version !== VSR_NEURAL_FIELD_SCENE_VERSION || result.status !== 'EXECUTED' || result.renderStatus !== 'CANDIDATE_CPU_NEURAL_FIELD_SURFACE' || !nonEmpty(result.componentId) || !nonEmpty(result.sceneId) || !isRoot(result.sourceCandidateRoot) || !isRoot(result.contentRoot) || !validBounds(result.bounds) || result.inputWidth !== VSR_NEURAL_FIELD_INPUT_WIDTH || result.hiddenWidth !== VSR_NEURAL_FIELD_HIDDEN_WIDTH || result.outputWidth !== VSR_NEURAL_FIELD_OUTPUT_WIDTH || result.parameterCount !== VSR_NEURAL_FIELD_PARAMETER_COUNT || !Number.isSafeInteger(result.sampleResolution) || result.sampleResolution < 2 || result.sampleResolution > VSR_NEURAL_FIELD_SAMPLE_RESOLUTION_LIMIT || result.sampleCount !== result.sampleResolution ** 3 || !Number.isSafeInteger(result.triangleCount) || result.triangleCount < 1 || result.triangleCount > result.maxTriangles || !Number.isSafeInteger(result.renderableCount) || result.renderableCount !== 1 || !Number.isSafeInteger(result.maxTriangles) || result.maxTriangles < 1 || result.maxTriangles > 32768 || typeof result.truncated !== 'boolean' || !nonEmpty(result.baseColor) || !Array.isArray(result.origin) || result.origin.length !== 3 || result.origin.some(component => !finite(component)) || !nonEmpty(result.meshId) || !isRoot(result.meshRoot) || !isRoot(result.sceneRoot) || !isRoot(result.neuralRoot) || !isRoot(result.root) || result.candidateOnly !== true || result.authoritative !== false) return false;
    const mesh = result.scene.meshes.find(entry => entry.id === result.meshId);
    const nodes = result.scene.nodes.filter(entry => entry.meshId === result.meshId);
    if (!mesh || cryptographicHash(mesh) !== result.meshRoot || mesh.indices.length !== result.triangleCount * 3 || mesh.positions.length !== result.triangleCount * 9 || mesh.normals?.length !== mesh.positions.length || mesh.uvs?.length !== result.triangleCount * 6 || nodes.length !== 1) return false;
    if (cryptographicHash(result.scene) !== result.sceneRoot) return false;
    if (cryptographicHash(neuralPayload(result)) !== result.neuralRoot) return false;
    const {root: _root, ...base} = result;
    return cryptographicHash(base) === result.root;
  } catch {
    return false;
  }
}
