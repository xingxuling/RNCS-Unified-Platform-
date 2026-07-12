// CSL Workspace — 结构运行包导出 (.cslbundle.zip)
// MVP-2 Phase 6
//
// 包结构:
//   manifest.json              包级元信息(必带 schemaVersion / cslVersion / bundleVersion)
//   source.csl                 纯源码
//   spec.json                  当前 CSL 版本启用的 feature flags
//   ir.json                    IR 快照
//   runtime-manifest.json      runtime 入口能力清单
//   projection-config.json     projection 配置(views/endpoints/manifest)
//   README.md                  人读说明
//
// 纪律:
//   - 不含生成的 .tsx/.ts(那是 scaffold zip 的职责)
//   - 只含"结构契约",是只读快照
//   - 每个 JSON 都带 schemaVersion + cslVersion 双轨版本号

import JSZip from 'jszip';
import type { GrammarVersion } from '../versions/registry';
import type { CSLResult } from '../versions/dispatch';
import { VERSION_FEATURES } from '../versions/registry';
import type { Workspace } from './types';
import {
  currentStamps, stampsEqual, type VersionStamps,
} from '../version-stamps';

export const BUNDLE_SCHEMA_VERSION = 1;
export const BUNDLE_VERSION = '1.0';

interface BundleManifest {
  schemaVersion: number;
  bundleVersion: string;
  exportedAt: string;
  workspace: { id: string; name: string };
  cslVersion: GrammarVersion;
  versionStamps: VersionStamps;
  files: string[];
}

interface SpecJson {
  schemaVersion: number;
  cslVersion: GrammarVersion;
  versionStamps: VersionStamps;
  enabledFeatures: string[];
  enabledHooks: string[];
}

interface IRJson {
  schemaVersion: number;
  cslVersion: GrammarVersion;
  versionStamps: VersionStamps;
  irNodeCount: number;
  ir: unknown;
}

interface RuntimeManifestJson {
  schemaVersion: number;
  cslVersion: GrammarVersion;
  versionStamps: VersionStamps;
  capabilities: Record<string, boolean>;
  guard: { enforced: boolean; policies: string[] };
  oseVerdict?: { blocked: boolean; summary?: unknown };
}

interface ProjectionConfigJson {
  schemaVersion: number;
  cslVersion: GrammarVersion;
  versionStamps: VersionStamps;
  manifest: unknown | null;
  views: unknown[];
  endpoints: unknown[];
  blocked: boolean;
  blockReasons: string[];
}

function countIRNodes(ir: any): number {
  let n = 0;
  for (const k of ['concepts','instances','invariants','rules','evidences','functions','subjects','stages','transitions','signals','regenerations']) {
    if (Array.isArray(ir?.[k])) n += ir[k].length;
  }
  return n;
}

function buildSpecJson(cslVersion: GrammarVersion, stamps: VersionStamps): SpecJson {
  return {
    schemaVersion: BUNDLE_SCHEMA_VERSION,
    cslVersion,
    versionStamps: stamps,
    enabledFeatures: [...(VERSION_FEATURES[cslVersion] ?? [])],
    enabledHooks: [
      'blockIntegrity', 'stageReachability', 'mappingCoverage',
      'boundaryIntegrity', 'functionRisk',
    ],
  };
}

function buildIRJson(cslVersion: GrammarVersion, stamps: VersionStamps, ir: any): IRJson {
  return {
    schemaVersion: BUNDLE_SCHEMA_VERSION,
    cslVersion,
    versionStamps: stamps,
    irNodeCount: countIRNodes(ir),
    ir,
  };
}

/** 可选附加上下文(由 UI 在调用时注入,bundle 模块本身不依赖 projection) */
export interface BundleExtras {
  oseReport?: { blocked?: boolean; summary?: unknown };
  projection?: {
    manifest?: unknown;
    blocked?: boolean;
    blockReasons?: string[];
    frontend?: { views?: unknown[] };
    backend?: { endpoints?: unknown[] };
  };
}

function buildRuntimeManifestJson(
  cslVersion: GrammarVersion,
  stamps: VersionStamps,
  result: CSLResult,
  extra?: BundleExtras,
): RuntimeManifestJson {
  const profile = result.profile;
  return {
    schemaVersion: BUNDLE_SCHEMA_VERSION,
    cslVersion,
    versionStamps: stamps,
    capabilities: {
      validate: true,
      select: true,
      infer: true,
      trace: true,
      callFunction: profile?.runtimePermissions?.allowFunctionCall ?? false,
    },
    guard: {
      enforced: true,
      policies: [
        'runtime.feature.disabled',
        'runtime.ose.blocked',
        'runtime.ir.malformed',
      ],
    },
    oseVerdict: extra?.oseReport
      ? { blocked: extra.oseReport.blocked ?? false, summary: extra.oseReport.summary }
      : undefined,
  };
}

function buildProjectionConfigJson(
  cslVersion: GrammarVersion,
  stamps: VersionStamps,
  extra?: BundleExtras,
): ProjectionConfigJson {
  return {
    schemaVersion: BUNDLE_SCHEMA_VERSION,
    cslVersion,
    versionStamps: stamps,
    manifest: extra?.projection?.manifest ?? null,
    views: extra?.projection?.frontend?.views ?? [],
    endpoints: extra?.projection?.backend?.endpoints ?? [],
    blocked: extra?.projection?.blocked ?? false,
    blockReasons: extra?.projection?.blockReasons ?? [],
  };
}

function buildReadme(workspace: Workspace, cslVersion: GrammarVersion): string {
  return `# ${workspace.name} — CSL Bundle

> 由 CSL Workspace 导出(MVP-2 Phase 6)
> 导出时间: ${new Date().toISOString()}
> CSL 版本: ${cslVersion}
> Bundle 版本: ${BUNDLE_VERSION}

## 文件清单

| 文件 | 说明 |
|------|------|
| manifest.json | 包级元信息 |
| source.csl | 工作区源码 |
| spec.json | 当前 CSL 版本启用的 feature flags |
| ir.json | IR 快照(随 CSL 版本演化,不跨版本迁移) |
| runtime-manifest.json | runtime 入口能力 + Guard 策略 |
| projection-config.json | projection 配置(views/endpoints/manifest 摘要) |

## 版本字段

所有 JSON 文件都带:
- \`schemaVersion\`: bundle 内 schema 版本(整数,迁移依据)
- \`cslVersion\`: 源码所属 CSL 语言版本

## 边界

- 这是**只读快照**,不能反向编辑回 Workspace
- 不含生成的 .tsx/.ts(那是 scaffold zip 的职责)
- 跨 cslVersion 不做 IR 迁移,只能"重新编译"
`;
}

/** 触发浏览器下载 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** 主导出函数 — 一键打包并触发下载 */
export async function exportBundleZip(
  workspace: Workspace,
  result: CSLResult,
  extra?: BundleExtras,
): Promise<void> {
  const cslVersion = workspace.cslVersion;
  // MVP-2 Phase 7:取 IR._meta 的 stamps 优先(出生指纹),否则取 currentStamps
  const irMeta = (result.ir as any)?._meta;
  const stamps: VersionStamps = irMeta
    ? {
        grammarVersion: cslVersion,
        specVersion: Number.parseInt(irMeta.specVersion, 10) || currentStamps(cslVersion).specVersion,
        compilerVersion: irMeta.compilerVersion || currentStamps(cslVersion).compilerVersion,
        osePolicyVersion: Number.parseInt(irMeta.osePolicyVersion, 10) || currentStamps(cslVersion).osePolicyVersion,
      }
    : currentStamps(cslVersion);

  const zip = new JSZip();

  const files = [
    'manifest.json',
    'source.csl',
    'spec.json',
    'ir.json',
    'runtime-manifest.json',
    'projection-config.json',
    'README.md',
  ];

  const manifest: BundleManifest = {
    schemaVersion: BUNDLE_SCHEMA_VERSION,
    bundleVersion: BUNDLE_VERSION,
    exportedAt: new Date().toISOString(),
    workspace: { id: workspace.id, name: workspace.name },
    cslVersion,
    versionStamps: stamps,
    files,
  };

  // 一致性自检:5 个 JSON 出口的 stamps 必须 === manifest.stamps
  const specJ = buildSpecJson(cslVersion, stamps);
  const irJ = buildIRJson(cslVersion, stamps, result.ir ?? null);
  const rtJ = buildRuntimeManifestJson(cslVersion, stamps, result, extra);
  const projJ = buildProjectionConfigJson(cslVersion, stamps, extra);
  for (const j of [specJ, irJ, rtJ, projJ]) {
    if (!stampsEqual(j.versionStamps, stamps)) {
      throw new Error('[bundle] versionStamps 不一致,拒绝导出');
    }
  }

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  zip.file('source.csl', workspace.source);
  zip.file('spec.json', JSON.stringify(specJ, null, 2));
  zip.file('ir.json', JSON.stringify(irJ, null, 2));
  zip.file('runtime-manifest.json', JSON.stringify(rtJ, null, 2));
  zip.file('projection-config.json', JSON.stringify(projJ, null, 2));
  zip.file('README.md', buildReadme(workspace, cslVersion));

  const blob = await zip.generateAsync({ type: 'blob' });
  const safeName = workspace.name.replace(/[^\w\u4e00-\u9fa5\-]+/g, '_') || 'workspace';
  downloadBlob(blob, `${safeName}.cslbundle.zip`);
}
