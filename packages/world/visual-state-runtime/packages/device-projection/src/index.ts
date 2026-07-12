import {
  deepClone,
  semanticHash,
  type VSRClip,
  type VSRDiagnostic,
  type VSRDisplayItem,
  type VSRDisplayState,
  type VSRMatrix3,
  type VSRRect,
  type VSRValue,
} from '../../spec/src/index.js';

export type VSRDeviceClass = 'desktop' | 'mobile' | 'tablet' | 'xr' | 'embedded';
export type VSRDeviceFit = 'contain' | 'cover' | 'stretch';

export interface VSRDeviceProfile {
  format: 'vsr.device-profile.v0.1';
  deviceId: string;
  deviceClass: VSRDeviceClass;
  viewport: { width: number; height: number; dpr?: number };
  safeArea?: { top?: number; right?: number; bottom?: number; left?: number };
  inputModes?: Array<'pointer' | 'touch' | 'keyboard' | 'voice' | 'gaze' | 'controller'>;
  fit?: VSRDeviceFit;
  orientation?: 'portrait' | 'landscape' | 'square' | 'spatial';
  claims?: Record<string, VSRValue>;
}

export interface VSRDeviceProjectionOptions {
  invariant?: Record<string, VSRValue>;
  clipToSafeArea?: boolean;
  preserveDiagnostics?: boolean;
}

export interface VSRDeviceProjectionTransform {
  scaleX: number;
  scaleY: number;
  translateX: number;
  translateY: number;
  sourceWidth: number;
  sourceHeight: number;
  safeViewport: VSRRect;
}

export interface VSRDeviceProjectionManifest {
  format: 'vsr.device-projection-manifest.v0.1';
  runtime: 'vsr@0.1.0-alpha.12';
  deviceId: string;
  deviceProfileHash: string;
  sourceDocumentHash: string;
  sourceDisplayHash: string;
  projectedDisplayHash: string;
  invariantHash: string;
  equivalenceHash: string;
  transform: VSRDeviceProjectionTransform;
  inputModes: string[];
  projectedItemCount: number;
  clippedItemCount: number;
}

export interface VSRDeviceProjection {
  profile: VSRDeviceProfile;
  displayState: VSRDisplayState;
  manifest: VSRDeviceProjectionManifest;
}

export interface VSRDeviceProjectionVerification {
  ok: boolean;
  deviceCount: number;
  sourceDisplayHash?: string;
  invariantHash?: string;
  equivalenceHash?: string;
  projectedDisplayHashes: string[];
  diagnostics: string[];
}

function finitePositive(value: unknown, label: string): number {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) throw new Error(`${label} must be a finite positive number.`);
  return number;
}

function nonNegative(value: unknown): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

export function normalizeDeviceProfile(input: VSRDeviceProfile): VSRDeviceProfile {
  if (input.format !== 'vsr.device-profile.v0.1') throw new Error(`Unsupported device profile format: ${String(input.format)}`);
  if (!input.deviceId) throw new Error('Device profile requires deviceId.');
  const width = finitePositive(input.viewport?.width, 'viewport.width');
  const height = finitePositive(input.viewport?.height, 'viewport.height');
  const dpr = finitePositive(input.viewport?.dpr ?? 1, 'viewport.dpr');
  const inferredOrientation = width === height ? 'square' : width > height ? 'landscape' : 'portrait';
  return {
    ...deepClone(input),
    viewport: { width, height, dpr },
    safeArea: {
      top: nonNegative(input.safeArea?.top),
      right: nonNegative(input.safeArea?.right),
      bottom: nonNegative(input.safeArea?.bottom),
      left: nonNegative(input.safeArea?.left),
    },
    inputModes: [...new Set(input.inputModes ?? [])].sort(),
    fit: input.fit ?? 'contain',
    orientation: input.orientation ?? inferredOrientation,
    claims: deepClone(input.claims ?? {}),
  };
}

export function deviceProfileHash(profile: VSRDeviceProfile): string {
  return semanticHash(normalizeDeviceProfile(profile));
}

function matrixMultiply(a: VSRMatrix3, b: VSRMatrix3): VSRMatrix3 {
  const result = new Array<number>(9).fill(0);
  for (let row = 0; row < 3; row++) {
    for (let column = 0; column < 3; column++) {
      for (let index = 0; index < 3; index++) result[row * 3 + column]! += a[row * 3 + index]! * b[index * 3 + column]!;
    }
  }
  return result as VSRMatrix3;
}

function transformPoint(transform: VSRDeviceProjectionTransform, x: number, y: number): { x: number; y: number } {
  return { x: x * transform.scaleX + transform.translateX, y: y * transform.scaleY + transform.translateY };
}

function transformRect(transform: VSRDeviceProjectionTransform, rect: VSRRect): VSRRect {
  const a = transformPoint(transform, rect.x, rect.y);
  const b = transformPoint(transform, rect.x + rect.width, rect.y + rect.height);
  return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(b.x - a.x), height: Math.abs(b.y - a.y) };
}

function intersects(a: VSRRect, b: VSRRect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function computeTransform(source: VSRDisplayState, profile: VSRDeviceProfile): VSRDeviceProjectionTransform {
  const safe = profile.safeArea ?? {};
  const safeViewport: VSRRect = {
    x: safe.left ?? 0,
    y: safe.top ?? 0,
    width: Math.max(1, profile.viewport.width - (safe.left ?? 0) - (safe.right ?? 0)),
    height: Math.max(1, profile.viewport.height - (safe.top ?? 0) - (safe.bottom ?? 0)),
  };
  const sourceWidth = source.viewport.width;
  const sourceHeight = source.viewport.height;
  let scaleX = safeViewport.width / sourceWidth;
  let scaleY = safeViewport.height / sourceHeight;
  if (profile.fit === 'contain' || profile.fit === 'cover') {
    const uniform = profile.fit === 'contain' ? Math.min(scaleX, scaleY) : Math.max(scaleX, scaleY);
    scaleX = uniform;
    scaleY = uniform;
  }
  const contentWidth = sourceWidth * scaleX;
  const contentHeight = sourceHeight * scaleY;
  const translateX = safeViewport.x + (safeViewport.width - contentWidth) / 2;
  const translateY = safeViewport.y + (safeViewport.height - contentHeight) / 2;
  return { scaleX, scaleY, translateX, translateY, sourceWidth, sourceHeight, safeViewport };
}

function transformClip(clip: VSRClip, transform: VSRDeviceProjectionTransform): VSRClip {
  return { ...deepClone(clip), worldBounds: transformRect(transform, clip.worldBounds) };
}

function transformItem(item: VSRDisplayItem, transform: VSRDeviceProjectionTransform): VSRDisplayItem {
  const deviceMatrix: VSRMatrix3 = [transform.scaleX, 0, transform.translateX, 0, transform.scaleY, transform.translateY, 0, 0, 1];
  return {
    ...item,
    worldTransform: matrixMultiply(deviceMatrix, item.worldTransform),
    worldBounds: transformRect(transform, item.worldBounds),
    clipStack: item.clipStack?.map(clip => transformClip(clip, transform)),
    sourceTrace: { ...(item.sourceTrace ?? {}), 'device.projection': 'applied' },
  };
}

function projectionDiagnostic(profile: VSRDeviceProfile, transform: VSRDeviceProjectionTransform): VSRDiagnostic {
  return {
    code: 'DEVICE_PROJECTION_APPLIED',
    severity: 'info',
    message: `Device projection applied for ${profile.deviceId}.`,
    messageZh: `已为设备 ${profile.deviceId} 应用宿主投影。`,
    details: {
      deviceClass: profile.deviceClass,
      scaleX: transform.scaleX,
      scaleY: transform.scaleY,
      inputModes: profile.inputModes ?? [],
    },
  };
}

export function projectDisplayForDevice(
  source: VSRDisplayState,
  profileInput: VSRDeviceProfile,
  options: VSRDeviceProjectionOptions = {},
): VSRDeviceProjection {
  const profile = normalizeDeviceProfile(profileInput);
  const transform = computeTransform(source, profile);
  const clipToSafeArea = options.clipToSafeArea ?? true;
  const items = source.items.map(item => transformItem(item, transform));
  const clippedItemCount = clipToSafeArea ? items.filter(item => !intersects(item.worldBounds, transform.safeViewport)).length : 0;
  const projectedItems = clipToSafeArea ? items.filter(item => intersects(item.worldBounds, transform.safeViewport)) : items;
  const invariantHash = semanticHash(options.invariant ?? {
    sourceDocumentHash: source.documentHash,
    sourceDisplayHash: source.semanticHash,
    time: source.time,
    frame: source.frame,
  });
  const equivalenceHash = semanticHash({
    sourceDocumentHash: source.documentHash,
    sourceDisplayHash: source.semanticHash,
    invariantHash,
    semantics: 'device-independent-reality-v1',
  });
  const profileHash = deviceProfileHash(profile);
  const projectedDisplayHash = semanticHash({
    sourceDocumentHash: source.documentHash,
    sourceDisplayHash: source.semanticHash,
    profileHash,
    invariantHash,
    transform,
    itemIds: projectedItems.map(item => item.id),
    clippedItemCount,
    hashMode: 'device-projection-manifest-v1',
  });
  const displayState: VSRDisplayState = {
    ...source,
    viewport: { width: profile.viewport.width, height: profile.viewport.height, dpr: profile.viewport.dpr ?? 1 },
    items: projectedItems,
    diagnostics: [
      ...(options.preserveDiagnostics === false ? [] : deepClone(source.diagnostics)),
      projectionDiagnostic(profile, transform),
    ],
    semanticHash: projectedDisplayHash,
  };
  const manifest: VSRDeviceProjectionManifest = {
    format: 'vsr.device-projection-manifest.v0.1',
    runtime: 'vsr@0.1.0-alpha.12',
    deviceId: profile.deviceId,
    deviceProfileHash: profileHash,
    sourceDocumentHash: source.documentHash,
    sourceDisplayHash: source.semanticHash,
    projectedDisplayHash,
    invariantHash,
    equivalenceHash,
    transform,
    inputModes: profile.inputModes ?? [],
    projectedItemCount: projectedItems.length,
    clippedItemCount,
  };
  return { profile, displayState, manifest };
}

export function verifyDeviceProjectionSet(projections: VSRDeviceProjection[]): VSRDeviceProjectionVerification {
  const diagnostics: string[] = [];
  if (!projections.length) return { ok: false, deviceCount: 0, projectedDisplayHashes: [], diagnostics: ['No device projections supplied.'] };
  const first = projections[0]!.manifest;
  const ids = new Set<string>();
  for (const projection of projections) {
    const manifest = projection.manifest;
    if (manifest.sourceDisplayHash !== first.sourceDisplayHash) diagnostics.push(`Device ${manifest.deviceId} has a different source display hash.`);
    if (manifest.sourceDocumentHash !== first.sourceDocumentHash) diagnostics.push(`Device ${manifest.deviceId} has a different source document hash.`);
    if (manifest.invariantHash !== first.invariantHash) diagnostics.push(`Device ${manifest.deviceId} has a different reality invariant hash.`);
    if (manifest.equivalenceHash !== first.equivalenceHash) diagnostics.push(`Device ${manifest.deviceId} has a different equivalence hash.`);
    if (manifest.projectedDisplayHash !== projection.displayState.semanticHash) diagnostics.push(`Device ${manifest.deviceId} projected display hash mismatch.`);
    if (ids.has(manifest.deviceId)) diagnostics.push(`Duplicate device id: ${manifest.deviceId}.`);
    ids.add(manifest.deviceId);
  }
  return {
    ok: diagnostics.length === 0,
    deviceCount: projections.length,
    sourceDisplayHash: first.sourceDisplayHash,
    invariantHash: first.invariantHash,
    equivalenceHash: first.equivalenceHash,
    projectedDisplayHashes: projections.map(projection => projection.manifest.projectedDisplayHash),
    diagnostics,
  };
}

export function createDeviceProfile(kind: VSRDeviceClass, deviceId = `device:${kind}`): VSRDeviceProfile {
  const presets: Record<VSRDeviceClass, Omit<VSRDeviceProfile, 'format' | 'deviceId' | 'deviceClass'>> = {
    desktop: { viewport: { width: 1440, height: 900, dpr: 1 }, inputModes: ['pointer', 'keyboard'], fit: 'contain' },
    mobile: { viewport: { width: 390, height: 844, dpr: 3 }, safeArea: { top: 47, bottom: 34 }, inputModes: ['touch', 'voice'], fit: 'contain' },
    tablet: { viewport: { width: 1024, height: 1366, dpr: 2 }, safeArea: { top: 24, bottom: 20 }, inputModes: ['touch', 'keyboard'], fit: 'contain' },
    xr: { viewport: { width: 1832, height: 1920, dpr: 1 }, safeArea: { top: 80, right: 120, bottom: 80, left: 120 }, inputModes: ['gaze', 'controller', 'voice'], fit: 'contain', orientation: 'spatial' },
    embedded: { viewport: { width: 800, height: 480, dpr: 1 }, inputModes: ['touch'], fit: 'contain' },
  };
  return { format: 'vsr.device-profile.v0.1', deviceId, deviceClass: kind, ...deepClone(presets[kind]) };
}
