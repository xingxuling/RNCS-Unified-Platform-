// CSL 自举规格加载器
// 输入：5 份用 v0.8 子集编写的 .csl 规格字符串
// 输出：强类型 SpecRegistry，并把规格本身注册为可选示例
//
// 关键不变量：每份规格都必须能被 v0.8 lexer/parser/ir-builder 顺利解析
// 任何规格解析失败 = 自举链路被破坏，必须立即修复规格本身

import { runCSL } from '../versions/dispatch';
import type { IRContainer, EntityNode } from '../types';

import { GRAMMAR_REGISTRY_CSL } from './grammar-registry.csl';
import { FEATURE_MAP_CSL } from './feature-map.csl';
import { AST_SCHEMA_CSL } from './ast-schema.csl';
import { IR_SCHEMA_CSL } from './ir-schema.csl';
import { EXAMPLES_REGISTRY_CSL } from './examples-registry.csl';
import { SUFFIX_SYSTEM_CSL } from './suffix-system.csl';
import { PROJECTION_PROTOCOL_CSL } from './projection-protocol.csl';
import { OSE_PROTOCOL_CSL } from './ose-protocol.csl';

// ---------- 强类型规格记录 ----------

export interface VersionSpec {
  id: string;          // 编号
  status: string;      // stable / preview / experimental / disabled
  parent: string;
  releaseSeq: number;
  description: string;
}

export interface FeatureSpec {
  id: string;
  cnName: string;
  belongsTo: string;
  status: string;
  affects: string;
  description: string;
}

export interface ASTNodeSpec {
  nodeName: string;
  feature: string;
  fields: string;
  isTopLevel: boolean;
  description: string;
}

export interface IRTypeSpec {
  typeName: string;
  containerKey: string;
  feature: string;
  fields: string;
  description: string;
}

export interface ExampleSpec {
  id: string;
  name: string;
  belongsTo: string;
  requiredFeatures: string[];
  status: string;
  greyOut: boolean;
  description: string;
}

export interface ProjectionDemoSpec {
  id: string;
  name: string;
  belongsTo: string;
  status: string;
  description: string;
}

export interface SuffixSpec {
  id: string;          // .csl / .cslapp / ...
  cnName: string;
  layer: string;       // 源码层 / 应用本体层 / 元规格层 / 平台映射层
  phase: string;       // Phase 1..4
  status: string;      // active / drafting / planned
  parent: string;
  description: string;
}

export interface PlatformSpec {
  id: string;          // windows / android / apple / web
  cnName: string;
  nativeFormat: string;
  status: string;
  description: string;
}

export interface BuildStepSpec {
  id: string;
  command: string;
  inputSuffix: string;
  outputSuffix: string;
  status: string;
  description: string;
}

export interface OSEHookSpec {
  id: string;          // 编号(与代码侧 OSEReport 字段名对齐)
  aspect: string;      // 切面
  phase: string;       // Phase 1.5 / Phase 2
  status: string;      // active / planned / disabled
  entryPoint: string;  // 接入点(代码侧函数名)
  /** H5: 治理级别由规格层决定 — pass / warn / block / block_with_fix_hint */
  severity: 'pass' | 'warn' | 'block' | 'block_with_fix_hint';
  description: string;
}

export interface SpecRegistry {
  versions: VersionSpec[];
  features: FeatureSpec[];
  astNodes: ASTNodeSpec[];
  irTypes: IRTypeSpec[];
  examples: ExampleSpec[];
  projectionDemos: ProjectionDemoSpec[];
  suffixes: SuffixSpec[];
  platforms: PlatformSpec[];
  buildSteps: BuildStepSpec[];
  oseHooks: OSEHookSpec[];
  /** 规格自身的解析诊断 */
  diagnostics: SpecDiagnostic[];
  /** 原始规格 IR，便于在 Playground 直接显示 */
  rawIRs: Record<SpecFile, IRContainer | null>;
  /** 原始规格源码 */
  rawSources: Record<SpecFile, string>;
}

export type SpecFile =
  | 'grammar-registry'
  | 'feature-map'
  | 'ast-schema'
  | 'ir-schema'
  | 'examples-registry'
  | 'suffix-system'
  | 'projection-protocol'
  | 'ose-protocol';

export interface SpecDiagnostic {
  file: SpecFile;
  level: 'ok' | 'error';
  message: string;
  entityCount?: number;
}

// ---------- 加载器 ----------

const SPEC_SOURCES: Record<SpecFile, string> = {
  'grammar-registry': GRAMMAR_REGISTRY_CSL,
  'feature-map': FEATURE_MAP_CSL,
  'ast-schema': AST_SCHEMA_CSL,
  'ir-schema': IR_SCHEMA_CSL,
  'examples-registry': EXAMPLES_REGISTRY_CSL,
  'suffix-system': SUFFIX_SYSTEM_CSL,
  'projection-protocol': PROJECTION_PROTOCOL_CSL,
  'ose-protocol': OSE_PROTOCOL_CSL,
};

const str = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));
const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0);
const bool = (v: unknown): boolean => str(v).toLowerCase() === 'true';
const splitList = (v: unknown): string[] =>
  str(v).split(',').map(s => s.trim()).filter(Boolean);

function entitiesOfConcept(ir: IRContainer, conceptName: string): EntityNode[] {
  const concept = ir.concepts.find(c => c.name === conceptName);
  if (!concept) return [];
  return ir.entities.filter(e => e.concept_id === concept.id);
}

export function loadSpecRegistry(): SpecRegistry {
  const diagnostics: SpecDiagnostic[] = [];
  const rawIRs: Record<SpecFile, IRContainer | null> = {
    'grammar-registry': null, 'feature-map': null, 'ast-schema': null,
    'ir-schema': null, 'examples-registry': null, 'suffix-system': null,
    'projection-protocol': null, 'ose-protocol': null,
  };

  const parseSpec = (file: SpecFile): IRContainer | null => {
    const result = runCSL(SPEC_SOURCES[file], 'v0.8');
    if (result.error || !result.ir) {
      diagnostics.push({ file, level: 'error', message: result.error || '解析失败：未生成 IR' });
      return null;
    }
    diagnostics.push({
      file, level: 'ok',
      message: `已加载 ${result.ir.entities.length} 条记录`,
      entityCount: result.ir.entities.length,
    });
    rawIRs[file] = result.ir;
    return result.ir;
  };

  // 1. versions
  const versions: VersionSpec[] = [];
  const grIR = parseSpec('grammar-registry');
  if (grIR) {
    for (const e of entitiesOfConcept(grIR, '版本')) {
      versions.push({
        id: str(e.values['编号']),
        status: str(e.values['状态']),
        parent: str(e.values['父版本']),
        releaseSeq: num(e.values['发布序号']),
        description: str(e.values['描述']),
      });
    }
  }

  // 2. features
  const features: FeatureSpec[] = [];
  const fmIR = parseSpec('feature-map');
  if (fmIR) {
    for (const e of entitiesOfConcept(fmIR, '特性')) {
      features.push({
        id: str(e.values['编号']),
        cnName: str(e.values['中文名']),
        belongsTo: str(e.values['所属版本']),
        status: str(e.values['状态']),
        affects: str(e.values['影响层']),
        description: str(e.values['描述']),
      });
    }
  }

  // 3. ast nodes
  const astNodes: ASTNodeSpec[] = [];
  const astIR = parseSpec('ast-schema');
  if (astIR) {
    for (const e of entitiesOfConcept(astIR, 'AST节点')) {
      astNodes.push({
        nodeName: str(e.values['节点名']),
        feature: str(e.values['所属特性']),
        fields: str(e.values['字段列表']),
        isTopLevel: bool(e.values['顶层声明']),
        description: str(e.values['描述']),
      });
    }
  }

  // 4. ir types
  const irTypes: IRTypeSpec[] = [];
  const irIR = parseSpec('ir-schema');
  if (irIR) {
    for (const e of entitiesOfConcept(irIR, 'IR类型')) {
      irTypes.push({
        typeName: str(e.values['类型名']),
        containerKey: str(e.values['容器键']),
        feature: str(e.values['所属特性']),
        fields: str(e.values['字段列表']),
        description: str(e.values['描述']),
      });
    }
  }

  // 5. examples + projection demos
  const examples: ExampleSpec[] = [];
  const projectionDemos: ProjectionDemoSpec[] = [];
  const exIR = parseSpec('examples-registry');
  if (exIR) {
    for (const e of entitiesOfConcept(exIR, '示例')) {
      examples.push({
        id: str(e.values['编号']),
        name: str(e.values['名称']),
        belongsTo: str(e.values['所属版本']),
        requiredFeatures: splitList(e.values['依赖特性']),
        status: str(e.values['状态']),
        greyOut: bool(e.values['灰显']),
        description: str(e.values['说明']),
      });
    }
    for (const e of entitiesOfConcept(exIR, '投影示例')) {
      projectionDemos.push({
        id: str(e.values['编号']),
        name: str(e.values['名称']),
        belongsTo: str(e.values['所属版本']),
        status: str(e.values['状态']),
        description: str(e.values['说明']),
      });
    }
  }

  // 6. suffix system
  const suffixes: SuffixSpec[] = [];
  const platforms: PlatformSpec[] = [];
  const buildSteps: BuildStepSpec[] = [];
  const sxIR = parseSpec('suffix-system');
  if (sxIR) {
    for (const e of entitiesOfConcept(sxIR, '后缀')) {
      suffixes.push({
        id: str(e.values['编号']),
        cnName: str(e.values['中文名']),
        layer: str(e.values['层级']),
        phase: str(e.values['阶段']),
        status: str(e.values['状态']),
        parent: str(e.values['父后缀']),
        description: str(e.values['描述']),
      });
    }
    for (const e of entitiesOfConcept(sxIR, '平台目标')) {
      platforms.push({
        id: str(e.values['编号']),
        cnName: str(e.values['中文名']),
        nativeFormat: str(e.values['原生格式']),
        status: str(e.values['状态']),
        description: str(e.values['描述']),
      });
    }
    for (const e of entitiesOfConcept(sxIR, '构建步骤')) {
      buildSteps.push({
        id: str(e.values['编号']),
        command: str(e.values['命令']),
        inputSuffix: str(e.values['输入后缀']),
        outputSuffix: str(e.values['输出后缀']),
        status: str(e.values['状态']),
        description: str(e.values['描述']),
      });
    }
  }

  // 7. ose protocol hooks
  const oseHooks: OSEHookSpec[] = [];
  const oseIR = parseSpec('ose-protocol');
  if (oseIR) {
    for (const e of entitiesOfConcept(oseIR, 'OSE治理钩子')) {
      const rawSev = str(e.values['严重性']).toLowerCase();
      const severity: OSEHookSpec['severity'] =
        rawSev === 'block' ? 'block'
        : rawSev === 'block_with_fix_hint' ? 'block_with_fix_hint'
        : rawSev === 'pass' ? 'pass'
        : 'warn';
      oseHooks.push({
        id: str(e.values['编号']),
        aspect: str(e.values['切面']),
        phase: str(e.values['阶段']),
        status: str(e.values['状态']),
        entryPoint: str(e.values['接入点']),
        severity,
        description: str(e.values['描述']),
      });
    }
  }

  return {
    versions, features, astNodes, irTypes, examples, projectionDemos,
    suffixes, platforms, buildSteps, oseHooks,
    diagnostics, rawIRs, rawSources: SPEC_SOURCES,
  };
}

// ---------- Phase 2.4:投影示例硬对齐 ----------

/**
 * 校验 ProjectionPanel 的 DEMO_REGISTRY 与规格层「投影示例」是否 1:1 对齐
 * 任一缺失即 error,提供给 ProjectionPanel 顶部红条与下拉过滤
 */
export function validateProjectionDemosAgainstCode(
  registry: SpecRegistry,
  codeDemoIds: string[],
): SpecCodeMismatch[] {
  const out: SpecCodeMismatch[] = [];
  const specIds = new Set(registry.projectionDemos.map(d => d.id));
  const codeSet = new Set(codeDemoIds);
  for (const id of codeSet) {
    if (!specIds.has(id)) {
      out.push({
        level: 'error', category: 'examples',
        message: `代码层投影 demo "${id}" 未在 examples-registry.csl(投影示例) 中声明 (BLOCK)`,
      });
    }
  }
  for (const id of specIds) {
    if (!codeSet.has(id)) {
      out.push({
        level: 'error', category: 'examples',
        message: `规格层投影示例 "${id}" 在 DEMO_REGISTRY 中不存在 (BLOCK)`,
      });
    }
  }
  return out;
}

// ---------- 一致性校验：规格 vs 代码 ----------

export interface SpecCodeMismatch {
  level: 'warn' | 'error';
  category: 'examples' | 'features' | 'ose-hooks';
  message: string;
}

/**
 * Phase 2.4:示例双源硬对齐
 * - examples 类:任一缺失即 error(规格层 = 真源,代码层必须 1:1 对齐)
 * - features / ose-hooks 类:仍保持 warn(待后续阶段升级)
 */
export function validateSpecAgainstCode(
  registry: SpecRegistry,
  codeExampleIds: string[],
  codeFeatureIds: string[],
): SpecCodeMismatch[] {
  const out: SpecCodeMismatch[] = [];

  const specExIds = new Set(registry.examples.map(e => e.id));
  const codeExSet = new Set(codeExampleIds);

  for (const id of codeExSet) {
    if (!specExIds.has(id)) {
      out.push({
        level: 'error', category: 'examples',
        message: `代码层示例 "${id}" 未在 examples-registry.csl 中声明 (BLOCK)`,
      });
    }
  }
  for (const id of specExIds) {
    if (!codeExSet.has(id)) {
      out.push({
        level: 'error', category: 'examples',
        message: `规格层示例 "${id}" 在代码层 EXAMPLES 中不存在 (BLOCK)`,
      });
    }
  }

  const specFeatIds = new Set(registry.features.map(f => f.id));
  const codeFeatSet = new Set(codeFeatureIds);

  for (const id of codeFeatSet) {
    if (!specFeatIds.has(id)) {
      out.push({
        level: 'warn', category: 'features',
        message: `代码层 feature "${id}" 未在 feature-map.csl 中声明`,
      });
    }
  }
  for (const id of specFeatIds) {
    if (!codeFeatSet.has(id)) {
      out.push({
        level: 'warn', category: 'features',
        message: `规格层 feature "${id}" 在代码层 ALL_FLAGS 中不存在`,
      });
    }
  }

  return out;
}

/**
 * 校验 OSE 协议层(ose-protocol.csl)与代码侧实际接入的 hook 列表是否对齐
 * 软对齐:任一侧缺失只产 warn,不阻断构建
 *
 * - 规格侧:仅取 状态 = "active" 的钩子参与对齐(planned 视为占位)
 * - 代码侧:由 OSE_HOOK_IDS 提供(ose-bridge.ts 真实接入的 hook 编号)
 */
export function validateOSESpecAgainstCode(
  registry: SpecRegistry,
  codeHookIds: readonly string[],
): SpecCodeMismatch[] {
  const out: SpecCodeMismatch[] = [];

  const specActiveIds = new Set(
    registry.oseHooks.filter(h => h.status === 'active').map(h => h.id),
  );
  const codeSet = new Set(codeHookIds);

  for (const id of codeSet) {
    if (!specActiveIds.has(id)) {
      out.push({
        level: 'warn', category: 'ose-hooks',
        message: `代码侧已接入 hook "${id}" 未在 ose-protocol.csl 中声明为 active(可能漏写规格或状态错为 planned)`,
      });
    }
  }
  for (const id of specActiveIds) {
    if (!codeSet.has(id)) {
      out.push({
        level: 'warn', category: 'ose-hooks',
        message: `规格层 active hook "${id}" 在代码侧 OSE_HOOK_IDS 中不存在(协议已声明但未接入实现)`,
      });
    }
  }

  return out;
}
