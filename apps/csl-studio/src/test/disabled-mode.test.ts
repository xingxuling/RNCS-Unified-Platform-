// P1: disabled-mode 快照测试
// 当 spec 把 stage / blocks / mapping 模式所依赖 feature 关闭时,
// projection 必须丢弃对应视图,不得偷偷继续产出。
import { describe, it, expect } from 'vitest';
import { compileCapabilityProfile } from '@/csl/capability/profile';
import { loadAppManifest } from '@/csl/projection/app-loader';
import type { SpecRegistry } from '@/csl/specs/loader';
import type { IRContainer } from '@/csl/types';

/** 构造最小 spec,允许指定哪些 feature 强制 disabled */
function makeSpec(disabledFeatureIds: string[]): SpecRegistry {
  return {
    versions: [], features: disabledFeatureIds.map(id => ({
      id, cnName: id, belongsTo: 'v0.9', status: 'disabled', affects: '', description: '',
    })),
    astNodes: [], irTypes: [], examples: [], projectionDemos: [],
    suffixes: [], platforms: [], buildSteps: [],
    oseHooks: [],
    diagnostics: [], rawIRs: {} as any, rawSources: {} as any,
  };
}

/** 构造一份只含「应用」+「视图」实例的最小 IR */
function makeIRWithViews(views: Array<{ id: string; mode: string; primaryConcept?: string; subjectRef?: string }>): IRContainer {
  const appConcept = { id: 'C_APP', name: '应用' } as any;
  const viewConcept = { id: 'C_VIEW', name: '视图' } as any;
  const entities: any[] = [{
    id: 'E_APP', concept_id: 'C_APP', name: 'App1',
    values: { 名称: 'TestApp', 版本: '0.1', 入口视图: views[0]?.id || 'main' },
  }];
  views.forEach((v, i) => {
    entities.push({
      id: `E_V_${i}`, concept_id: 'C_VIEW', name: v.id,
      values: {
        编号: v.id, 标题: v.id, 路径: `/${v.id}`,
        模式: v.mode, 主概念: v.primaryConcept || 'X', 端点: `/api/${v.id}`,
        ...(v.subjectRef ? { 绑定主体: v.subjectRef } : {}),
        ...(v.mode === 'blocks' ? { 根块: 'B1' } : {}),
      },
    });
  });
  return {
    concepts: [appConcept, viewConcept],
    entities,
    attributes: [], relations: [], invariants: [], rules: [], evidences: [],
    functions: [], templates: [],
    subjects: [], stages: [], transitions: [],
    compiler_layers: [], regenerations: [], signals: [],
    mapping_tables: [], closures: [], correspondence_chains: [], domain_expansions: [],
    units: [], establishments: [], profiles: [], tradeoffs: [],
    engines: [], engine_modules: [], engine_actions: [], engine_axes: [],
    concept_blocks: [{ id: 'cb1', name: 'B1' }] as any,
    proposition_blocks: [], relation_blocks: [],
    motherhoods: [], histories: [], states: [],
  } as unknown as IRContainer;
}

describe('Disabled-mode snapshot (P1)', () => {
  it('stage 模式被 spec 关闭 → stage 视图被丢弃 + 产出 H4 错误诊断', () => {
    const profile = compileCapabilityProfile('v0.9', makeSpec(['subjects', 'sovereignty_stages']));
    expect(profile.enabledModes.includes('stage')).toBe(false);

    const ir = makeIRWithViews([
      { id: 'V_form', mode: 'form' },
      { id: 'V_stage', mode: 'stage', subjectRef: 'S' },
    ]);
    const { manifest, diagnostics } = loadAppManifest(ir, profile);
    expect(manifest).toBeTruthy();
    const ids = (manifest!.views || []).map(v => v.id);
    expect(ids).toContain('V_form');
    expect(ids).not.toContain('V_stage');
    expect(diagnostics.some(d => d.level === 'error' && d.message.includes('V_stage') && d.message.includes('H4'))).toBe(true);
  });

  it('blocks 模式被关闭 → blocks 视图被丢弃', () => {
    const profile = compileCapabilityProfile('v0.9', makeSpec(['concept_blocks']));
    expect(profile.enabledModes.includes('blocks')).toBe(false);

    const ir = makeIRWithViews([
      { id: 'V_form', mode: 'form' },
      { id: 'V_blocks', mode: 'blocks' },
    ]);
    const { manifest, diagnostics } = loadAppManifest(ir, profile);
    expect((manifest!.views || []).map(v => v.id)).not.toContain('V_blocks');
    expect(diagnostics.some(d => d.level === 'error' && d.message.includes('V_blocks'))).toBe(true);
  });

  it('mapping 模式被关闭 → mapping 视图被丢弃', () => {
    const profile = compileCapabilityProfile('v0.9', makeSpec(['mapping_tables']));
    expect(profile.enabledModes.includes('mapping')).toBe(false);

    const ir = makeIRWithViews([
      { id: 'V_form', mode: 'form' },
      { id: 'V_mapping', mode: 'mapping' },
    ]);
    const { manifest } = loadAppManifest(ir, profile);
    expect((manifest!.views || []).map(v => v.id)).not.toContain('V_mapping');
  });

  it('full profile (无 disabled) → 三种 mode 都保留', () => {
    const profile = compileCapabilityProfile('v0.9', makeSpec([]));
    const ir = makeIRWithViews([
      { id: 'V_form', mode: 'form' },
      { id: 'V_stage', mode: 'stage', subjectRef: 'S' },
      { id: 'V_blocks', mode: 'blocks' },
      { id: 'V_mapping', mode: 'mapping' },
    ]);
    const { manifest } = loadAppManifest(ir, profile);
    const ids = (manifest!.views || []).map(v => v.id).sort();
    expect(ids).toEqual(['V_blocks', 'V_form', 'V_mapping', 'V_stage']);
  });
});
