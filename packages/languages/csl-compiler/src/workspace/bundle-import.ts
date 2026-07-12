// CSL Workspace — 结构运行包导入 (.cslbundle.zip)
// MVP-2 Phase 8 (P2):导入链 + 结构校验 + 兼容判定
//
// 纪律:
//   1. 只解析,不写 workspace —— 由上层 manager 决定如何落库
//   2. 任何缺文件 / stamps 缺失 / spec 不兼容必须返回 BundleImportError,UI 可读
//   3. 不做迁移,只做"能不能开"
//   4. 兼容判定走 compat.checkBundleCompat,verdict 决定后续 lockState

import JSZip from 'jszip';
import { extractStamps, type VersionStamps } from '../version-stamps';
import { checkBundleCompat, type CompatVerdict, type CompatCheckResult } from './compat';
import type { GrammarVersion } from '../versions/registry';

export const BUNDLE_REQUIRED_FILES = [
  'manifest.json',
  'source.csl',
  'spec.json',
  'ir.json',
  'runtime-manifest.json',
  'projection-config.json',
] as const;

export type BundleImportErrorCode =
  | 'invalid_zip'
  | 'missing_file'
  | 'invalid_json'
  | 'manifest_missing_stamps'
  | 'incompatible_version';

export class BundleImportError extends Error {
  constructor(
    public readonly code: BundleImportErrorCode,
    message: string,
    public readonly details: string[] = [],
  ) {
    super(message);
    this.name = 'BundleImportError';
  }
}

export interface ParsedBundle {
  /** 包级元信息(manifest.json) */
  manifest: {
    bundleVersion: string;
    exportedAt: string;
    workspace: { id: string; name: string };
    cslVersion: GrammarVersion;
    versionStamps: VersionStamps;
    files: string[];
  };
  source: string;
  /** 透传 spec.json — UI 可展示 enabledFeatures / enabledHooks */
  spec: { enabledFeatures: string[]; enabledHooks: string[] };
  /** 透传 ir.json.ir(只读) */
  ir: unknown;
  /** 透传 runtime-manifest.json */
  runtime: { capabilities: Record<string, boolean>; oseVerdict?: { blocked: boolean } | null };
  /** 透传 projection-config.json */
  projection: { manifest: unknown | null; views: unknown[]; endpoints: unknown[]; blocked: boolean; blockReasons: string[] };
  /** 兼容判定结果 */
  compat: CompatCheckResult;
  /** 派生:UI 可直接消费 */
  verdict: CompatVerdict;
}

function parseJson(name: string, raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new BundleImportError('invalid_json', `文件「${name}」不是合法 JSON`, [String(e)]);
  }
}

/**
 * 导入主函数:File/Blob/ArrayBuffer → ParsedBundle
 * 抛出 BundleImportError;调用方负责把 message + details 透出到 UI
 */
export async function importBundleZip(input: Blob | ArrayBuffer | File): Promise<ParsedBundle> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(input as Blob);
  } catch (e) {
    throw new BundleImportError('invalid_zip', '无法解析为 .zip 文件', [String(e)]);
  }

  // 1) 检查必需文件
  const missing: string[] = [];
  for (const name of BUNDLE_REQUIRED_FILES) {
    if (!zip.file(name)) missing.push(name);
  }
  if (missing.length > 0) {
    throw new BundleImportError(
      'missing_file',
      `运行包缺少必需文件 (${missing.length})`,
      missing.map(n => `缺失:${n}`),
    );
  }

  // 2) 读取
  const read = async (name: string) => {
    const f = zip.file(name);
    if (!f) throw new BundleImportError('missing_file', `读取阶段缺文件:${name}`);
    return f.async('string');
  };
  const [
    manifestRaw, sourceRaw, specRaw, irRaw, rtRaw, projRaw,
  ] = await Promise.all([
    read('manifest.json'),
    read('source.csl'),
    read('spec.json'),
    read('ir.json'),
    read('runtime-manifest.json'),
    read('projection-config.json'),
  ]);

  // 3) 解析 JSON
  const manifestJ = parseJson('manifest.json', manifestRaw) as Record<string, unknown>;
  const specJ = parseJson('spec.json', specRaw) as Record<string, unknown>;
  const irJ = parseJson('ir.json', irRaw) as Record<string, unknown>;
  const rtJ = parseJson('runtime-manifest.json', rtRaw) as Record<string, unknown>;
  const projJ = parseJson('projection-config.json', projRaw) as Record<string, unknown>;

  // 4) 校验 manifest 必备字段
  const cslVersion = (manifestJ.cslVersion as GrammarVersion) || (manifestJ.grammarVersion as GrammarVersion);
  if (cslVersion !== 'v0.8' && cslVersion !== 'v0.9') {
    throw new BundleImportError(
      'manifest_missing_stamps',
      `manifest.json 中 cslVersion 字段缺失或非法:${String(cslVersion)}`,
    );
  }
  const stampsRaw = manifestJ.versionStamps;
  if (!stampsRaw || typeof stampsRaw !== 'object') {
    throw new BundleImportError(
      'manifest_missing_stamps',
      'manifest.json 缺少 versionStamps,无法判定兼容性',
    );
  }
  const stamps = extractStamps(stampsRaw);

  // 5) 兼容判定
  const compat = checkBundleCompat(stamps);

  const parsed: ParsedBundle = {
    manifest: {
      bundleVersion: String(manifestJ.bundleVersion ?? '1.0'),
      exportedAt: String(manifestJ.exportedAt ?? ''),
      workspace: (manifestJ.workspace as { id: string; name: string }) ?? { id: '', name: '导入工作区' },
      cslVersion,
      versionStamps: stamps,
      files: Array.isArray(manifestJ.files) ? (manifestJ.files as string[]) : [],
    },
    source: sourceRaw,
    spec: {
      enabledFeatures: Array.isArray(specJ.enabledFeatures) ? (specJ.enabledFeatures as string[]) : [],
      enabledHooks: Array.isArray(specJ.enabledHooks) ? (specJ.enabledHooks as string[]) : [],
    },
    ir: irJ.ir ?? null,
    runtime: {
      capabilities: (rtJ.capabilities as Record<string, boolean>) ?? {},
      oseVerdict: (rtJ.oseVerdict as { blocked: boolean } | null) ?? null,
    },
    projection: {
      manifest: projJ.manifest ?? null,
      views: Array.isArray(projJ.views) ? (projJ.views as unknown[]) : [],
      endpoints: Array.isArray(projJ.endpoints) ? (projJ.endpoints as unknown[]) : [],
      blocked: Boolean(projJ.blocked),
      blockReasons: Array.isArray(projJ.blockReasons) ? (projJ.blockReasons as string[]) : [],
    },
    compat,
    verdict: compat.verdict,
  };

  // 6) incompatible 直接拒绝(允许调用方 catch 后只展示元信息)
  if (compat.verdict === 'incompatible') {
    const err = new BundleImportError(
      'incompatible_version',
      compat.primaryHint,
      compat.reasons,
    );
    // 附带 parsed 供 UI "只看元信息"
    (err as unknown as { parsed: ParsedBundle }).parsed = parsed;
    throw err;
  }

  return parsed;
}

/** 浏览器选包 — 只拾取 .cslbundle.zip / .zip */
export function pickBundleFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip,.cslbundle,application/zip';
    input.onchange = () => {
      const file = input.files?.[0];
      resolve(file ?? null);
    };
    input.click();
  });
}
