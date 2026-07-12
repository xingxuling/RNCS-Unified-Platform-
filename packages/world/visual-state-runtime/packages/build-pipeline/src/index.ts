import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { canonicalize, semanticHash } from '../../spec/src/index.js';

export interface PipelineAssetSource {
  id: string;
  source: string;
  type: 'json' | 'text' | 'binary' | 'image';
  dependencies?: string[];
}

export interface PipelineBuildRequest {
  format: 'reality-build.request.v0.1';
  projectId: string;
  target: 'node' | 'browser' | 'mobile' | 'xr';
  rootDir: string;
  outDir: string;
  assets: PipelineAssetSource[];
}

export interface CompiledAssetEntry {
  id: string;
  type: PipelineAssetSource['type'];
  source: string;
  sourceHash: string;
  contentHash: string;
  byteLength: number;
  compiledPath: string;
  dependencies: string[];
}

export interface RealityBuildManifest {
  format: 'reality-build.manifest.v0.1';
  projectId: string;
  target: PipelineBuildRequest['target'];
  assets: CompiledAssetEntry[];
  buildRoot: string;
}

export interface PipelineBuildResult {
  manifest: RealityBuildManifest;
  builtAssetIds: string[];
  reusedAssetIds: string[];
  manifestPath: string;
}

export interface ManifestVerification {
  ok: boolean;
  checked: number;
  errors: string[];
  recomputedRoot?: string;
}

function sha256(data: any): string { return createHash('sha256').update(data).digest('hex'); }
function slash(path: string): string { return path.replaceAll('\\', '/'); }
function extension(asset: PipelineAssetSource): string {
  const sourceExtension = extname(asset.source).replace(/^\./, '').toLowerCase();
  if (asset.type === 'json') return 'json';
  if (asset.type === 'text') return sourceExtension || 'txt';
  if (asset.type === 'image') return sourceExtension || 'bin';
  return sourceExtension || 'bin';
}
function compileAsset(asset: PipelineAssetSource, absoluteSource: string): Buffer {
  const raw = readFileSync(absoluteSource);
  if (asset.type === 'json') {
    const parsed = JSON.parse(raw.toString('utf8')) as unknown;
    return Buffer.from(`${canonicalize(parsed)}\n`, 'utf8');
  }
  if (asset.type === 'text') {
    const normalized = raw.toString('utf8').replaceAll('\r\n', '\n');
    return Buffer.from(normalized, 'utf8');
  }
  return Buffer.from(raw);
}
function manifestSemanticView(manifest: Omit<RealityBuildManifest, 'buildRoot'>): unknown {
  return {
    format: manifest.format,
    projectId: manifest.projectId,
    target: manifest.target,
    assets: manifest.assets.map(asset => ({
      id: asset.id, type: asset.type, source: asset.source,
      sourceHash: asset.sourceHash, contentHash: asset.contentHash,
      byteLength: asset.byteLength, compiledPath: asset.compiledPath,
      dependencies: asset.dependencies
    }))
  };
}
function validateRequest(request: PipelineBuildRequest): void {
  if (request.format !== 'reality-build.request.v0.1') throw new Error('不支持的构建请求格式。');
  if (!request.projectId) throw new Error('projectId 不能为空。');
  const ids = new Set<string>();
  for (const asset of request.assets) {
    if (!asset.id || ids.has(asset.id)) throw new Error(`资产 id 无效或重复：${asset.id}`);
    ids.add(asset.id);
  }
  for (const asset of request.assets) for (const dependency of asset.dependencies ?? []) if (!ids.has(dependency)) throw new Error(`资产 ${asset.id} 引用了不存在的依赖 ${dependency}。`);
}

export function buildRealityAssets(request: PipelineBuildRequest): PipelineBuildResult {
  validateRequest(request);
  const rootDir = resolve(request.rootDir);
  const outDir = resolve(request.outDir);
  const cacheDir = join(outDir, 'cache');
  const manifestPath = join(outDir, 'manifest.json');
  mkdirSync(cacheDir, { recursive: true });
  let previous: RealityBuildManifest | undefined;
  if (existsSync(manifestPath)) {
    try { previous = JSON.parse(readFileSync(manifestPath, 'utf8')) as RealityBuildManifest; } catch { previous = undefined; }
  }
  const previousById = new Map((previous?.assets ?? []).map(asset => [asset.id, asset]));
  const assets: CompiledAssetEntry[] = [];
  const builtAssetIds: string[] = [];
  const reusedAssetIds: string[] = [];
  for (const source of [...request.assets].sort((a, b) => a.id.localeCompare(b.id))) {
    const absoluteSource = resolve(rootDir, source.source);
    if (!existsSync(absoluteSource)) throw new Error(`资产源文件不存在：${source.source}`);
    const raw = readFileSync(absoluteSource);
    const sourceHash = sha256(raw);
    const compiled = compileAsset(source, absoluteSource);
    const contentHash = sha256(compiled);
    const filename = `${contentHash}.${extension(source)}`;
    const absoluteCompiled = join(cacheDir, filename);
    const compiledPath = slash(relative(outDir, absoluteCompiled));
    const entry: CompiledAssetEntry = {
      id: source.id,
      type: source.type,
      source: slash(source.source),
      sourceHash,
      contentHash,
      byteLength: compiled.byteLength,
      compiledPath,
      dependencies: [...(source.dependencies ?? [])].sort()
    };
    const old = previousById.get(source.id);
    const reusable = old?.contentHash === contentHash && old.compiledPath === compiledPath && existsSync(absoluteCompiled);
    if (reusable) reusedAssetIds.push(source.id);
    else {
      mkdirSync(dirname(absoluteCompiled), { recursive: true });
      writeFileSync(absoluteCompiled, compiled);
      builtAssetIds.push(source.id);
    }
    assets.push(entry);
  }
  const withoutRoot: Omit<RealityBuildManifest, 'buildRoot'> = {
    format: 'reality-build.manifest.v0.1', projectId: request.projectId, target: request.target, assets
  };
  const manifest: RealityBuildManifest = { ...withoutRoot, buildRoot: semanticHash(manifestSemanticView(withoutRoot)) };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return { manifest, builtAssetIds, reusedAssetIds, manifestPath };
}

export function verifyRealityBuildManifest(manifestPath: string): ManifestVerification {
  const absoluteManifest = resolve(manifestPath);
  if (!existsSync(absoluteManifest)) return { ok: false, checked: 0, errors: ['Manifest 不存在。'] };
  const manifest = JSON.parse(readFileSync(absoluteManifest, 'utf8')) as RealityBuildManifest;
  const outDir = dirname(absoluteManifest);
  const errors: string[] = [];
  for (const asset of manifest.assets) {
    const compiled = resolve(outDir, asset.compiledPath);
    if (!existsSync(compiled)) { errors.push(`编译资产缺失：${asset.id}`); continue; }
    const bytes = readFileSync(compiled);
    const actualHash = sha256(bytes);
    if (actualHash !== asset.contentHash) errors.push(`资产哈希不匹配：${asset.id}`);
    if (bytes.byteLength !== asset.byteLength) errors.push(`资产大小不匹配：${asset.id}`);
  }
  const withoutRoot: Omit<RealityBuildManifest, 'buildRoot'> = {
    format: manifest.format, projectId: manifest.projectId, target: manifest.target, assets: manifest.assets
  };
  const recomputedRoot = semanticHash(manifestSemanticView(withoutRoot));
  if (recomputedRoot !== manifest.buildRoot) errors.push('Manifest 根哈希不匹配。');
  return { ok: errors.length === 0, checked: manifest.assets.length, errors, recomputedRoot };
}
