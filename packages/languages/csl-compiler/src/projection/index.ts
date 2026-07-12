// CSL 全栈投影 — 统一入口
// Phase 2.2:summary 视图主体快照注入 + 阶段非法硬阻塞传播

import { runCSL } from '../versions/dispatch';
import { loadAppManifest } from './app-loader';
import { buildProjections } from './ir-to-projection';
import { generateFrontendSource, generateFrontendFiles } from './frontend';
import { generateBackendSource, generateBackendFiles, buildRuntimeHandler, buildRuntimeHandlersByView } from './backend';
import { runOSEOnProjection, flattenOSEReport, computeBlocked } from './ose-bridge';
import { getCapabilityProfile, type CapabilityProfile } from '../capability';
import type { GrammarVersion } from '../versions/registry';
import type { ProjectionResult, ProjectionDiagnostic, SubjectSummary, ViewProjection, EndpointProjection } from './types';
import type { DemoSpec } from './demo-source';
import type { IRContainer } from '../types';

export type { ProjectionResult, ProjectionDiagnostic, AppManifest, FrontendProjection, BackendProjection, ViewDecl, ViewProjection, EndpointProjection, RouteEntry, SubjectSummary } from './types';
export type { OSEReport } from './ose-bridge';
export { PROJECTION_REGISTRY, summarizeRegistry } from './registry';
export { DEMO_REGISTRY } from './demo-source';
export { buildRuntimeHandler, buildRuntimeHandlersByView };
export type { DemoSpec };

/**
 * Phase 2.2:为绑定主体的 summary 视图构造快照
 */
function buildSubjectSummary(
  ir: IRContainer,
  subjectRef: string,
  blocked: boolean,
  blockReasons: string[],
  oseErrorCount: number,
  oseWarnCount: number,
  keyMessages: string[],
  hasZombieSignal: boolean,
  hasIsolatedRegen: boolean,
  hasIncompleteTransition: boolean,
): SubjectSummary {
  const subj = ir.subjects.find(s => s.name === subjectRef);
  const stageNames = new Set(ir.stages.map(s => s.name));
  const currentStage = subj?.current_stage || '';
  const stageLegality: 'legal' | 'blocked' = blocked ? 'blocked' : 'legal';

  // 找首条从当前阶段出发的转移
  const firstTransition = ir.transitions.find(t => t.from_stage === currentStage);
  // 主体绑定的首个再生事件
  const firstRegen = ir.regenerations.find(r => !r.subject_ref || r.subject_ref === subjectRef);
  // 第一个信号(占位"最近一次注入信号")
  const firstSignal = ir.signals[0];

  return {
    subjectRef,
    currentStage,
    stageCount: ir.stages.length,
    signalCount: ir.signals.length,
    transitionCount: ir.transitions.length,
    regenerationCount: ir.regenerations.length,
    latestSignal: firstSignal?.name || null,
    latestTransition: firstTransition?.name || null,
    latestRegeneration: firstRegen?.name || null,
    stageLegality,
    transitionCompleteness: hasIncompleteTransition ? 'incomplete' : 'complete',
    signalValidity: hasZombieSignal ? 'zombie' : 'valid',
    regenerationIsolation: hasIsolatedRegen ? 'isolated' : 'linked',
    blocked,
    blockReasons,
    oseErrorCount,
    oseWarnCount,
    keyMessages,
  };
}

/**
 * 一键投影:把一份 demo(含 .csl + .cslapp 拼接源)转成完整投影结果
 */
export function projectDemo(
  demo: DemoSpec,
  options?: { profile?: CapabilityProfile; grammarVersion?: GrammarVersion },
): ProjectionResult | { error: string; diagnostics: ProjectionDiagnostic[] } {
  const diagnostics: ProjectionDiagnostic[] = [];
  const grammarVersion: GrammarVersion = options?.grammarVersion || 'v0.9';
  // P1: profile 显式传入;未传则从 capability 缓存按 grammarVersion 取(单一真源,不再借道 IR._meta)
  const profile: CapabilityProfile = options?.profile || getCapabilityProfile(grammarVersion);

  // 1. 解析(走与 profile 同版本的 dispatch,确保 IR._meta 与 profile 同源)
  const result = runCSL(demo.fullSource, profile.grammarVersion);
  if (result.error || !result.ir) {
    return {
      error: result.error || '解析失败:未生成 IR',
      diagnostics: [{ level: 'error', message: result.error || '解析失败' }],
    };
  }

  // 2. 加载应用本体(P1: 显式 profile 进入 app-loader)
  const { manifest, diagnostics: appDiags } = loadAppManifest(result.ir, profile);
  diagnostics.push(...appDiags);
  if (!manifest) return { error: '无法加载 AppManifest', diagnostics };

  // 3. 投影
  const { frontend, backend, diagnostics: projDiags } = buildProjections({ ir: result.ir, manifest });
  diagnostics.push(...projDiags);

  // 4. OSE 治理
  const oseReport = runOSEOnProjection({ ir: result.ir, manifest, frontend, backend });
  diagnostics.push(...flattenOSEReport(oseReport));

  // 5. Phase 2.2:计算 blocked + 注入 summary 快照 + 传播 blocked 到 stage endpoints
  const { blocked, reasons: blockReasons } = computeBlocked(oseReport);
  const oseErrorCount = flattenOSEReport(oseReport).filter(d => d.level === 'error').length;
  const oseWarnCount = flattenOSEReport(oseReport).filter(d => d.level === 'warn').length;
  const keyMessages = flattenOSEReport(oseReport)
    .filter(d => d.level !== 'info')
    .slice(0, 8)
    .map(d => d.message);

  const hasZombieSignal = (oseReport.signalValidity || []).some(d => d.message.includes('僵尸信号'));
  const hasIsolatedRegen = (oseReport.regenerationIsolation || []).some(d => d.level !== 'info');
  const hasIncompleteTransition = (oseReport.transitionCompleteness || []).some(d => d.level !== 'info');

  // 注入到 summary 视图 + 对应 endpoint
  for (const v of frontend.views) {
    if (v.mode === 'summary' && v.subjectRef) {
      const snap = buildSubjectSummary(
        result.ir, v.subjectRef, blocked, blockReasons,
        oseErrorCount, oseWarnCount, keyMessages,
        hasZombieSignal, hasIsolatedRegen, hasIncompleteTransition,
      );
      v.subjectSummary = snap;
      const ep = backend.endpoints.find(e => e.viewId === v.id);
      if (ep) ep.summarySnapshot = snap;
    }
  }

  // 传播 blocked 到所有 stage transition endpoints(防止迁移被执行)
  if (blocked) {
    for (const ep of backend.endpoints) {
      if (ep.stageKind === 'transition') {
        ep.blocked = true;
        ep.blockReasons = blockReasons;
      }
    }
  }

  // 6. Codegen(放在快照注入之后,生成的代码会包含快照)
  const frontendSource = generateFrontendSource(frontend);
  const backendSource = generateBackendSource(backend);
  const frontendFiles = generateFrontendFiles(frontend);
  const backendFiles = generateBackendFiles(backend);

  return {
    manifest,
    frontend,
    backend,
    frontendSource,
    backendSource,
    frontendFiles,
    backendFiles,
    diagnostics,
    oseReport,
    blocked,
    blockReasons,
    ir: result.ir,
    functions: result.ir.functions,
  };
}
