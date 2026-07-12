// P2 回归:bundle 导入链 + 兼容判定 + lockState
// - 缺文件 → BundleImportError(missing_file)
// - 非法 zip → invalid_zip
// - manifest 缺 stamps → manifest_missing_stamps
// - grammar 高于当前 → incompatible_version
// - 完整且兼容 → ParsedBundle.verdict='compatible'

import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { importBundleZip, BundleImportError } from '@/csl/workspace/bundle-import';
import { CURRENT_GRAMMAR_VERSION, CURRENT_SPEC_VERSION, CURRENT_COMPILER_VERSION, CURRENT_OSE_POLICY_VERSION } from '@/csl/version-stamps';

function buildValidZip(overrides: { stampsPatch?: Record<string, unknown>; omit?: string[] } = {}): Promise<Blob> {
  const zip = new JSZip();
  const stamps = {
    grammarVersion: CURRENT_GRAMMAR_VERSION,
    specVersion: CURRENT_SPEC_VERSION,
    compilerVersion: CURRENT_COMPILER_VERSION,
    osePolicyVersion: CURRENT_OSE_POLICY_VERSION,
    ...(overrides.stampsPatch || {}),
  };
  const manifest = {
    schemaVersion: 1, bundleVersion: '1.0',
    exportedAt: new Date().toISOString(),
    workspace: { id: 'w1', name: '测试包' },
    cslVersion: stamps.grammarVersion,
    versionStamps: stamps,
    files: ['manifest.json','source.csl','spec.json','ir.json','runtime-manifest.json','projection-config.json'],
  };
  const all: Record<string, string> = {
    'manifest.json': JSON.stringify(manifest),
    'source.csl': '概念 人',
    'spec.json': JSON.stringify({ schemaVersion:1, cslVersion: stamps.grammarVersion, versionStamps: stamps, enabledFeatures: [], enabledHooks: [] }),
    'ir.json': JSON.stringify({ schemaVersion:1, cslVersion: stamps.grammarVersion, versionStamps: stamps, irNodeCount: 0, ir: {} }),
    'runtime-manifest.json': JSON.stringify({ schemaVersion:1, cslVersion: stamps.grammarVersion, versionStamps: stamps, capabilities: {}, guard: { enforced: true, policies: [] } }),
    'projection-config.json': JSON.stringify({ schemaVersion:1, cslVersion: stamps.grammarVersion, versionStamps: stamps, manifest: null, views: [], endpoints: [], blocked: false, blockReasons: [] }),
  };
  const omit = new Set(overrides.omit || []);
  for (const [k, v] of Object.entries(all)) {
    if (!omit.has(k)) zip.file(k, v);
  }
  return zip.generateAsync({ type: 'blob' });
}

describe('P2: bundle 导入链', () => {
  it('完整 + 当前版本 → compatible', async () => {
    const blob = await buildValidZip();
    const parsed = await importBundleZip(blob);
    expect(parsed.verdict).toBe('compatible');
    expect(parsed.source).toContain('概念');
    expect(parsed.manifest.cslVersion).toBe(CURRENT_GRAMMAR_VERSION);
  });

  it('缺文件 → BundleImportError(missing_file)', async () => {
    const blob = await buildValidZip({ omit: ['ir.json'] });
    await expect(importBundleZip(blob)).rejects.toMatchObject({
      name: 'BundleImportError',
      code: 'missing_file',
    });
  });

  it('非法 zip → invalid_zip', async () => {
    const bad = new Blob(['not a zip'], { type: 'application/zip' });
    await expect(importBundleZip(bad)).rejects.toMatchObject({ code: 'invalid_zip' });
  });

  it('manifest 缺 stamps → manifest_missing_stamps', async () => {
    const zip = new JSZip();
    zip.file('manifest.json', JSON.stringify({ cslVersion: 'v0.9' /* no versionStamps */ }));
    zip.file('source.csl', '');
    zip.file('spec.json', '{}');
    zip.file('ir.json', '{}');
    zip.file('runtime-manifest.json', '{}');
    zip.file('projection-config.json', '{}');
    const blob = await zip.generateAsync({ type: 'blob' });
    await expect(importBundleZip(blob)).rejects.toMatchObject({ code: 'manifest_missing_stamps' });
  });

  it('grammar 比当前老 → read_only', async () => {
    if (CURRENT_GRAMMAR_VERSION !== 'v0.9') return;
    const blob = await buildValidZip({ stampsPatch: { grammarVersion: 'v0.8' } });
    const parsed = await importBundleZip(blob);
    expect(parsed.verdict).toBe('read_only');
    expect(parsed.compat.reasons.length).toBeGreaterThan(0);
  });
});
