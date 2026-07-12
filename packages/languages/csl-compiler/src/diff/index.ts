// CSL Diff — dual build 入口
// MVP-2 Phase 7:同一份源码,在 v0.8 / v0.9 两个 grammar 下分别 build,展示差异

import { runCSL, type CSLResult } from '../versions/dispatch';
import { currentStamps, type VersionStamps } from '../version-stamps';
import { diffAST, type ASTDiff } from './ast-diff';
import { diffIR, type IRDiff } from './ir-diff';
import { diffOSE, type OSEDiff } from './ose-diff';
import { diffProjection, type ProjectionDiff } from './projection-diff';

export type { ASTDiff, IRDiff, OSEDiff, ProjectionDiff };

export interface DualBuildResult {
  source: string;
  left:  { version: 'v0.8'; result: CSLResult; stamps: VersionStamps };
  right: { version: 'v0.9'; result: CSLResult; stamps: VersionStamps };
  diffs: {
    ast: ASTDiff;
    ir: IRDiff;
    ose: OSEDiff;
    projection: ProjectionDiff;
  };
  generatedAt: string;
}

export function buildDual(source: string): DualBuildResult {
  let lr: CSLResult;
  let rr: CSLResult;
  try { lr = runCSL(source, 'v0.8'); }
  catch (e) { lr = { version: 'v0.8', features: [], tokens: [], ast: null, ir: null, validation: null, selection: null, inference: null, traces: [], functionResults: [], stageAdvancements: [], error: String(e) } as CSLResult; }
  try { rr = runCSL(source, 'v0.9'); }
  catch (e) { rr = { version: 'v0.9', features: [], tokens: [], ast: null, ir: null, validation: null, selection: null, inference: null, traces: [], functionResults: [], stageAdvancements: [], error: String(e) } as CSLResult; }

  return {
    source,
    left:  { version: 'v0.8', result: lr, stamps: currentStamps('v0.8') },
    right: { version: 'v0.9', result: rr, stamps: currentStamps('v0.9') },
    diffs: {
      ast: diffAST(lr.ast, rr.ast),
      ir: diffIR(lr.ir, rr.ir),
      ose: diffOSE(lr, rr),
      projection: diffProjection(),
    },
    generatedAt: new Date().toISOString(),
  };
}
