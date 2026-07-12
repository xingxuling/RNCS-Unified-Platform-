// 版本化 lexer：v0.8 走原 tokenize；v0.9 在词法阶段把 V09_KEYWORDS 升级为 KEYWORD
// 实现策略：复用 lexer.tokenize 输出的 token 流，对 IDENTIFIER 做"按词表升级"
// 这样不动 lexer 主文件，也不在词法层做正则重写。
//
// Phase 2.3 收尾 · spec-driven dispatch v1:
//   通过 setDisabledFeatures([...]) 注入"被规格层声明为 disabled 的 feature"
//   这些 feature 对应的 v0.9 关键字会从词表中实时剔除,从而 demo 解析失败
//   → 证明 feature-map.csl 中的「状态」字段真正掌权 dispatch 行为

import { tokenize as baseTokenize } from '../lexer';
import { Parser } from '../parser';
import { buildIR } from '../ir-builder';
import {
  validate, select, infer, trace, callCSLFunction,
} from '../runtime';
import { advanceAllSubjects } from '../stage-engine';
import { V09_KEYWORDS } from '../v09/lexer-ext';
import {
  VERSION_FEATURES, type GrammarVersion, type FeatureFlag,
} from './registry';
// H3: 删除 ose/hooks 双轨,统一走 ose-bridge.runOSEOnProjection
import { runOSEOnProjection, computeBlocked, type OSEReport } from '../projection/ose-bridge';
import { annotateOSEReportWithSource } from '../projection/source-location';
import { getCapabilityProfile, type CapabilityProfile } from '../capability';
import { RuntimeGuardError, type OSEVerdict } from '../runtime/guard';
import { assertOSEVerdict } from '../runtime/ose-verdict-schema';
import type {
  Token, ProgramNode, IRContainer,
  ValidateResult, SelectResult, InferResult, TraceResult, FunctionCallResult,
} from '../types';
import type { SubjectAdvancement } from '../stage-engine';

// ---------- spec-driven dispatch v1:feature → 关键字组 映射 ----------
// 仅列出 v0.9 起新增、且能被 SpecRegistry 单独 disable 的 feature
// (v0.8 核心词如「概念/属性/规则」不在此列,无法被关闭)
const FEATURE_KEYWORDS: Record<string, string[]> = {
  functions: ['函数', '返回', '调用', '标记为'],
  conditionals: ['如果', '则', '否则', '否则如果'],
  subjects: ['主体'],
  sovereignty_stages: ['主权阶段'],
  stage_transitions: ['阶段转移', '从', '到', '触发'],
  compiler_layers: ['编译层'],
  regeneration_events: ['再生事件'],
  signals: ['信号'],
  // —— 第一梯队 —— spec-driven dispatch 试点重点
  concept_blocks: ['概念块'],
  proposition_blocks: ['命题块'],
  relation_blocks: ['关系块'],
  mapping_tables: ['映射表', '列', '行'],
  sealing: ['封口', '由'],
  colocation_chains: ['同位链', '域'],
  domain_expansion: ['域展开', '母法', '五因'],
};

let DISABLED_FEATURE_IDS: Set<string> = new Set();

/**
 * 由规格层(feature-map.csl)调用,把状态 = "disabled" 的 feature 注入 dispatch
 * 调用方:SpecsPanel 加载 SpecRegistry 后一次性写入
 */
export function setDisabledFeatures(ids: readonly string[]): void {
  DISABLED_FEATURE_IDS = new Set(ids);
}

/** 调试/UI 用:当前哪些 feature 被规格层关闭了 */
export function getDisabledFeatures(): string[] {
  return Array.from(DISABLED_FEATURE_IDS);
}

/** Phase 2.4:供 parser 查询 — 该 feature 当前是否被规格层关闭 */
export function isFeatureDisabled(featureId: string): boolean {
  return DISABLED_FEATURE_IDS.has(featureId);
}

/** Phase 2.4:parser 使用 — 顶层声明关键字 → 所属 feature 的反向映射
 *  仅列出 parser 真正需要拦截的"顶层声明类"关键字(出现在 parseTopLevel switch 中)
 *  词法层已剔除,这是双保险:即便有人在 lexer 之外构造 token,parser 也能拒绝
 */
export const TOPLEVEL_KEYWORD_TO_FEATURE: Record<string, string> = {
  '函数': 'functions',
  '主体': 'subjects',
  '主权阶段': 'sovereignty_stages',
  '阶段转移': 'stage_transitions',
  '编译层': 'compiler_layers',
  '再生事件': 'regeneration_events',
  '信号': 'signals',
  '概念块': 'concept_blocks',
  '命题块': 'proposition_blocks',
  '关系块': 'relation_blocks',
  '映射表': 'mapping_tables',
  '封口': 'sealing',
  '同位链': 'colocation_chains',
  '域展开': 'domain_expansion',
};

/** Phase 2.4 (此轮):parser 使用 — 内联(非顶层)关键字 → feature 反向映射
 *  覆盖函数体/规则体/分支结构内部出现的语法骨架词
 *  parser 在解析这些 token 之前必须检查 isFeatureDisabled,disabled 时直接拒绝
 */
export const INLINE_KEYWORD_TO_FEATURE: Record<string, string> = {
  // 条件分支族
  '如果': 'conditionals',
  '则': 'conditionals',
  '否则': 'conditionals',
  '否则如果': 'conditionals',
  // 函数族(返回 / 调用 / 标记为)
  '返回': 'functions',
  '调用': 'functions',
  '标记为': 'functions',
};

/** 计算当前实际生效的 v0.9 关键字集合(去除 disabled feature 对应的词) */
function computeActiveV09Keywords(): Set<string> {
  const blocked = new Set<string>();
  for (const fid of DISABLED_FEATURE_IDS) {
    const kws = FEATURE_KEYWORDS[fid];
    if (kws) for (const k of kws) blocked.add(k);
  }
  return new Set(V09_KEYWORDS.filter(k => !blocked.has(k)));
}

export interface CSLResult {
  version: GrammarVersion;
  features: FeatureFlag[];
  /** MVP-1: CapabilityProfile — 单一真源,下游 UI/codegen/export 共享 */
  profile?: CapabilityProfile;
  tokens: Token[];
  ast: ProgramNode | null;
  ir: IRContainer | null;
  validation: ValidateResult | null;
  selection: SelectResult | null;
  inference: InferResult | null;
  traces: TraceResult[];
  functionResults: FunctionCallResult[];
  stageAdvancements: SubjectAdvancement[];
  error: string | null;
  /** MVP-1: runtime 被 guard 拦截的记录(例如 functions 关闭但源码含函数调用) */
  guardLog?: Array<{ op: string; policyId: string; reason: string; fixHint?: string }>;
  /** H2: OSE 在 runtime 主路径产出的报告与裁决(供下游/UI 共享同一套结果) */
  oseReport?: OSEReport;
  oseVerdict?: OSEVerdict;
}

/**
 * 版本化分词：先走 v0.8 lexer，再按版本升级 IDENTIFIER → KEYWORD
 * v0.8：直接返回 base token 流，零修改
 * v0.9：把 V09_KEYWORDS 中的词从 IDENTIFIER 升级为 KEYWORD
 *       Phase 2.3:被规格层 disable 的 feature 对应的词不参与升级
 */
export function tokenizeForVersion(input: string, version: GrammarVersion): Token[] {
  const base = baseTokenize(input);
  if (version === 'v0.8') return base;

  const upgradeSet = computeActiveV09Keywords();

  // 第一遍:合并 "否则" + "如果" → "否则如果"
  // (仅当 conditionals 未被 disable 时才有意义,但合并本身无副作用)
  const merged: Token[] = [];
  for (let i = 0; i < base.length; i++) {
    const t = base[i];
    const next = base[i + 1];
    if (
      t.type === 'IDENTIFIER' && t.value === '否则' &&
      next && next.type === 'IDENTIFIER' && next.value === '如果'
    ) {
      merged.push({ type: 'IDENTIFIER', value: '否则如果', line: t.line, col: t.col });
      i++;
      continue;
    }
    merged.push(t);
  }

  return merged.map(t => {
    if (t.type === 'IDENTIFIER' && upgradeSet.has(t.value)) {
      return { ...t, type: 'KEYWORD' as const };
    }
    return t;
  });
}

export function runCSL(input: string, version: GrammarVersion = 'v0.8'): CSLResult {
  const features = VERSION_FEATURES[version];
  const profile = getCapabilityProfile(version);
  const guardLog: Array<{ op: string; policyId: string; reason: string; fixHint?: string }> = [];
  const result: CSLResult = {
    version, features, profile,
    tokens: [], ast: null, ir: null,
    validation: null, selection: null, inference: null,
    traces: [], functionResults: [], stageAdvancements: [], error: null,
    guardLog,
  };

  try {
    result.tokens = tokenizeForVersion(input, version);
    const tokensForParser = [...result.tokens];
    result.ast = new Parser(tokensForParser).parse();
    result.ir = buildIR(result.ast, profile);
    result.validation = validate(result.ir, profile);
    result.selection = select(result.ir, undefined, profile);
    result.inference = infer(result.ir, profile);

    for (const entity of result.ir.entities) {
      const t = trace(result.ir, entity.name, profile);
      if (t.evidence_chain.length > 0) result.traces.push(t);
    }

    // H2 + H3: 在 runtime 主路径执行真 OSE(IR-only 子集),并构造裁决
    //   - manifest/frontend/backend 在此阶段尚不可用,传 null;ose-bridge 内部已处理
    //   - 该裁决会回灌到 callCSLFunction → RuntimeGuard.enforce
    //   - 同一份 oseReport 也输出给 UI / projection / export 共享
    const oseReportRaw = runOSEOnProjection({
      ir: result.ir, manifest: null, frontend: null, backend: null,
    });
    // P4:对每条诊断做 AST 反查,注入 sourceLocation,供 UI 跳转源码行
    const oseReport = annotateOSEReportWithSource(oseReportRaw, result.ast, input);
    const verdictRaw = computeBlocked(oseReport);
    const oseVerdict: OSEVerdict = {
      blocked: verdictRaw.blocked,
      reasons: verdictRaw.reasons,
      primaryFixHint: verdictRaw.reasons[0],
    };
    // P1: schema 硬校验 — 防止 OSEVerdict 形状漂移污染下游
    assertOSEVerdict(oseVerdict);
    result.oseReport = oseReport;
    result.oseVerdict = oseVerdict;

    // 函数执行链:profile + oseVerdict 同时回灌
    if (profile.runtimePermissions.allowFunctionCall) {
      for (const func of result.ir.functions) {
        for (const entity of result.ir.entities) {
          try {
            const callResult = callCSLFunction(result.ir, func.name, entity.values, profile, oseVerdict);
            callResult.args = { ...callResult.args, _entity: entity.name };
            result.functionResults.push(callResult);
          } catch (e) {
            if (e instanceof RuntimeGuardError) {
              guardLog.push({ op: 'callFunction', policyId: e.policyId, reason: e.message, fixHint: e.fixHint });
            } else {
              throw e;
            }
          }
        }
      }
    } else if (result.ir.functions.length > 0) {
      guardLog.push({
        op: 'callFunction',
        policyId: 'runtime.functions.disabled',
        reason: `函数调用被规格层关闭:IR 中含 ${result.ir.functions.length} 个函数定义,但 runtime 拒绝执行`,
        fixHint: '切换到 v0.9 语法版本,或在 feature-map.csl 中启用 F_FUNCTIONS',
      });
    }

    // P2: 阶段推进接 enforce —— profile + oseVerdict 同时回灌
    // P4: 构建 transition → OSE 诊断索引,用于 candidate.verdict 标注
    const transitionDiagIdx = new Map<string, { policyId: string; reason: string; fixHint?: string; sourceLocation?: { line: number; column?: number; snippet?: string } }>();
    for (const list of Object.values(oseReport)) {
      if (!Array.isArray(list)) continue;
      for (const d of list) {
        const ref = d.nodeRef;
        if (!ref) continue;
        const isStageRelated = d.policyId?.startsWith('ose.stageReachability') || d.policyId?.startsWith('ose.stageLegality') || d.policyId?.startsWith('ose.transitionCompleteness');
        if (!isStageRelated) continue;
        if (transitionDiagIdx.has(ref)) continue;
        const fixHintText = typeof d.fixHint === 'string' ? d.fixHint : d.fixHint?.summary;
        transitionDiagIdx.set(ref, {
          policyId: d.policyId || 'ose.unknown',
          reason: d.message,
          fixHint: fixHintText,
          sourceLocation: d.sourceLocation && {
            line: d.sourceLocation.line,
            column: d.sourceLocation.column,
            snippet: d.sourceLocation.snippet,
          },
        });
      }
    }
    const oseLookup = (transitionName: string) => transitionDiagIdx.get(transitionName) ?? null;
    result.stageAdvancements = advanceAllSubjects(result.ir, profile, oseVerdict, oseLookup);
    // P4: 把治理诊断的 sourceLocation 也补上(从 oseReport 主体名反查)
    for (const adv of result.stageAdvancements) {
      for (const g of adv.governance) {
        if (g.target && !g.sourceLocation) {
          const hit = transitionDiagIdx.get(g.target);
          if (hit?.sourceLocation) g.sourceLocation = hit.sourceLocation;
        }
      }
    }
  } catch (e) {
    result.error = e instanceof Error ? e.message : String(e);
  }

  return result;
}
