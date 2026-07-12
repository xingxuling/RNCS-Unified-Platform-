// CSL 全栈投影 — 类型定义
// Phase 1：仅 Web 投影（React + Node TS),单 view + 单 endpoint
// Phase 2.0：扩展为多视图 + 多 endpoint + 路由,旧字段全部保留作为「主视图/主 endpoint」捷径
// Phase 2.3:ProjectionResult 携带 ir 引用,以便前端实时调用 callCSLFunction

import type { IRContainer, FunctionSpec } from '../types';

export interface AppManifest {
  /** 应用名称 */
  name: string;
  /** 版本号 */
  version: string;
  /** 入口视图名(对应 ViewDecl.id 或 ViewDecl.title;未声明视图时为字面量页面名) */
  entryView: string;
  /** 目标环境：当前仅 "web" */
  target: 'web';
  /** 前端框架：当前仅 "react-ts" */
  frontendFramework: 'react-ts';
  /** 后端框架：当前仅 "node-ts" */
  backendFramework: 'node-ts';
  /** 包含的 .csl 规格名（信息性） */
  includedSpecs: string[];
  /** Phase 2.0:模块名(可选) */
  modules?: string[];
  /** Phase 2.0:从 .cslapp 解析出的视图声明(可空,空则走 Phase 1 单视图回退) */
  views?: ViewDecl[];
}

/**
 * 视图声明:从 .cslapp 中「实例 X 属于 视图」解析而来
 * 是 .cslapp → frontend/backend 投影的中间表示
 */
export interface ViewDecl {
  /** 视图编号(JS 标识符,用于路由 key) */
  id: string;
  /** 视图标题(显示用) */
  title: string;
  /** 路由路径,如 "/" 或 "/results" */
  path: string;
  /** 该视图绑定的主概念名(form/summary/stage 模式语义锚点;blocks/mapping 模式可空) */
  primaryConcept: string;
  /** 该视图对应的后端 endpoint 路径 */
  endpoint: string;
  /** HTTP 方法,默认 POST */
  method?: 'POST' | 'GET';
  /** 视图模式:form(录入页) / summary(只读) / stage(状态机) / blocks(概念块网络) / mapping(跨域映射) */
  mode?: 'form' | 'summary' | 'stage' | 'blocks' | 'mapping';
  /** stage 模式专用:绑定的主体名(对应 IR.subjects.name) */
  subjectRef?: string;
  /** blocks 模式专用:网络锚点,根概念块名(对应 ir.concept_blocks[].name) */
  rootBlock?: string;
}

// ---------- Frontend Projection Protocol v1 / v2 ----------

export type FieldKind = 'text' | 'number';

export interface FormField {
  /** 字段标识（中文允许，会被作为 state key） */
  name: string;
  /** 显示标签 */
  label: string;
  /** 控件类型 */
  kind: FieldKind;
  /** 是否必填 */
  required: boolean;
  /** 默认值 */
  defaultValue: string | number;
}

/**
 * 单视图投影:Phase 2.0 引入
 * 一个 ViewProjection ≈ 一个 React page component
 */
export interface ViewProjection {
  /** 视图编号(=ViewDecl.id) */
  id: string;
  /** 路由路径 */
  path: string;
  /** 视图模式 */
  mode: 'form' | 'summary' | 'stage' | 'blocks' | 'mapping';
  /** stage 模式:绑定的主体名 */
  subjectRef?: string;
  /** stage 模式:阶段时间线快照(投影时从 IR 抓取) */
  stageTimeline?: StageTimelineItem[];
  /** stage 模式:可注入的信号清单 */
  availableSignals?: SignalOption[];
  /** stage 模式:再生事件预览 */
  regenerationPreviews?: RegenerationPreview[];
  /** summary 模式:主体诊断快照(当 subjectRef 非空时投影自动填充) */
  subjectSummary?: SubjectSummary;
  /** React 组件名(PascalCase) */
  componentName: string;
  /** 页面标题 */
  pageTitle: string;
  /** 主概念名(form/summary/stage 模式语义锚点;blocks/mapping 视图可为空字符串) */
  primaryConcept: string;
  /** blocks 模式:网络根块名 */
  rootBlock?: string;
  /** 表单字段(form 模式必备;summary 模式可空) */
  formFields: FormField[];
  /** 与该视图对接的后端 endpoint */
  endpoint: string;
  /** HTTP 方法 */
  method: 'POST' | 'GET';
  /** Phase 2.3:概念块网络快照(blocks 模式视图使用) */
  blockNetwork?: BlockNetworkSnapshot;
  /** Phase 2.3:映射表/封口/同位链/域展开 快照(mapping 模式视图使用) */
  mappingSnapshot?: MappingViewSnapshot;
  /** Phase 2.3:函数派生字段定义(function 模式 / form 模式增强) */
  derivedFields?: DerivedFieldSpec[];
}

// ---------- Phase 2.3:概念块网络投影 ----------

export interface BlockNodeView {
  id: string;
  name: string;
  kind: string;
  definition: string;
  scope: string;
  propositionCount: number;
  relationCount: number;
}

export interface PropositionEdgeView {
  id: string;
  name: string;
  subject: string;
  predicate: string;
  object: string;
  assertion: string;
  resolved: boolean;
}

export interface RelationEdgeView {
  id: string;
  name: string;
  source: string;
  target: string;
  kind: string;
  strength: number;
  resolved: boolean;
}

export interface BlockNetworkSnapshot {
  nodes: BlockNodeView[];
  propositions: PropositionEdgeView[];
  relations: RelationEdgeView[];
  /** OSE 派生:孤立节点名 */
  isolatedNodes: string[];
  /** OSE 派生:悬空引用名 */
  danglingRefs: string[];
}

// ---------- Phase 2.3:映射/封口/同位链/域展开投影 ----------

export interface MappingTableView {
  id: string;
  name: string;
  columns: string[];
  rows: Array<{ label: string; items: string[] }>;
  aligned: boolean;
  misalignedRows: string[];
}

export interface ClosureView {
  id: string;
  name: string;
  total: number;
  computedSum: number;
  closed: boolean;
  parts: Array<{ label: string; value: number }>;
}

export interface ChainView {
  id: string;
  name: string;
  domains: string[];
  items: string[];
  aligned: boolean;
}

export interface DomainExpansionView {
  id: string;
  name: string;
  motherLawValues: string[];
  domains: string[];
  factors: Array<{ domain: string; items: string[] }>;
  derivedConceptNames: string[];
}

export interface MappingViewSnapshot {
  tables: MappingTableView[];
  closures: ClosureView[];
  chains: ChainView[];
  expansions: DomainExpansionView[];
}

// ---------- Phase 2.3:函数派生字段 ----------

export interface DerivedFieldSpec {
  /** 派生字段显示名 */
  label: string;
  /** 调用的函数名(对应 IR.functions[].name) */
  functionName: string;
  /** 函数实参所引用的 form 字段名(按顺序) */
  argFields: string[];
}

/** stage 视图:阶段时间线项 */
export interface StageTimelineItem {
  id: string;
  name: string;
  index: number | null;
  keywords: string[];
  description: string;
  /** 是否为主体当前阶段 */
  current: boolean;
}

/** stage 视图:可注入的信号 */
export interface SignalOption {
  id: string;
  name: string;
  kind: string;
  intensity: number;
  description: string;
}

/** stage 视图:再生事件预览 */
export interface RegenerationPreview {
  id: string;
  name: string;
  failure: string;
  diagnosis: string;
  recompose: string;
  newVersion: string;
}

/** summary 视图专用:主体诊断快照(Phase 2.2 引入) */
export interface SubjectSummary {
  subjectRef: string;
  currentStage: string;
  stageCount: number;
  signalCount: number;
  transitionCount: number;
  regenerationCount: number;
  /** 最近一次的"建议演练"信号:取 ir.signals[0],仅作为占位演示 */
  latestSignal: string | null;
  /** 默认场景下首条会被命中的转移名 */
  latestTransition: string | null;
  /** 该主体绑定的首个再生事件名 */
  latestRegeneration: string | null;
  /** 阶段合法性:legal / blocked */
  stageLegality: 'legal' | 'blocked';
  /** 转移完整性:complete / incomplete */
  transitionCompleteness: 'complete' | 'incomplete';
  /** 信号有效性:valid / zombie / invalid */
  signalValidity: 'valid' | 'zombie' | 'invalid';
  /** 再生事件孤立性:linked / isolated */
  regenerationIsolation: 'linked' | 'isolated';
  /** 整体阻塞标志 */
  blocked: boolean;
  /** 阻塞原因摘要(error 级别诊断的前 N 条) */
  blockReasons: string[];
  /** OSE 概要计数 */
  oseErrorCount: number;
  oseWarnCount: number;
  /** 关键治理消息(去掉前缀的人话) */
  keyMessages: string[];
}

/** stage 视图:阶段转移规则(投影到 backend) */
export interface StageTransitionRule {
  id: string;
  name: string;
  fromStage: string;
  toStage: string;
  /** 触发条件已转 JS,引用 input.信号名 / input.信号强度 */
  jsCondition: string;
  /** 原始触发表达式(供 UI 展示) */
  rawTrigger: string;
}

/** 路由表项 */
export interface RouteEntry {
  path: string;
  componentName: string;
  viewId: string;
}

export interface FrontendProjection {
  // ---- Phase 2.0 新增 ----
  /** App 根组件名 */
  appComponentName: string;
  /** 多视图 */
  views: ViewProjection[];
  /** 路由表 */
  routes: RouteEntry[];

  // ---- Phase 1 兼容字段:全部指向第一个 view ----
  /** 生成的 React 组件名(=views[0].componentName) */
  componentName: string;
  /** 页面标题 */
  pageTitle: string;
  /** 主体概念名 */
  primaryConcept: string;
  /** 表单字段 */
  formFields: FormField[];
  /** 提交目标 endpoint */
  submitEndpoint: string;
  /** 结果区显示哪些规则名 */
  ruleResultLabels: string[];
  /** 结果区显示哪些不变量名 */
  invariantResultLabels: string[];
}

// ---------- Backend Projection Protocol v1 / v2 ----------

export interface InvariantCheck {
  /** 不变量名 */
  name: string;
  /** 已转换为 JS 表达式的条件，使用 input.* 引用字段 */
  jsExpression: string;
  /** 失败时的提示 */
  failureMessage: string;
}

export interface RuleEvaluation {
  /** 规则名 */
  name: string;
  /** 规则触发条件（已转 JS 表达式） */
  jsCondition: string;
  /** 命中时收集的标记字符串 */
  markLabel: string;
}

/** 单 endpoint 投影:Phase 2.0 引入 */
export interface EndpointProjection {
  /** handler 函数名 */
  handlerName: string;
  /** endpoint 路径 */
  endpoint: string;
  /** HTTP 方法 */
  method: 'POST' | 'GET';
  /** 关联的视图 id */
  viewId: string;
  /** 关联的主概念 */
  primaryConcept: string;
  /** 入参 schema(POST/form 用;GET/summary 通常为空) */
  inputSchema: Record<string, 'string' | 'number'>;
  /** 不变量校验列表 */
  invariantChecks: InvariantCheck[];
  /** 规则评估列表 */
  ruleEvaluations: RuleEvaluation[];
  /** stage 模式专用:阶段转移规则(纯函数式) / summary 模式:返回主体快照 */
  stageKind?: 'transition' | 'summary';
  /** stage 模式专用:绑定主体名 */
  subjectRef?: string;
  /** stage 模式专用:初始/默认阶段 */
  defaultStage?: string;
  /** stage 模式专用:转移规则集合 */
  stageTransitions?: StageTransitionRule[];
  /** stage 模式专用:可触发的再生事件名 */
  regenerationsForSubject?: string[];
  /** summary 模式专用:固化的主体快照(投影时填充) */
  summarySnapshot?: SubjectSummary;
  /** Phase 2.2:阻塞标志(true 时 runtime 拒绝执行 stage transition) */
  blocked?: boolean;
  /** Phase 2.2:阻塞原因 */
  blockReasons?: string[];
}

export interface BackendProjection {
  // ---- Phase 2.0 新增 ----
  /** 多 endpoint */
  endpoints: EndpointProjection[];

  // ---- Phase 1 兼容字段:全部指向第一个 endpoint ----
  /** handler 函数名 */
  handlerName: string;
  /** endpoint 路径 */
  endpoint: string;
  /** 入参 schema */
  inputSchema: Record<string, 'string' | 'number'>;
  /** 不变量校验列表 */
  invariantChecks: InvariantCheck[];
  /** 规则评估列表 */
  ruleEvaluations: RuleEvaluation[];
}

// ---------- 投影结果汇总 ----------

export interface ProjectionResult {
  manifest: AppManifest;
  frontend: FrontendProjection;
  backend: BackendProjection;
  /** 生成的前端 .tsx 源码字符串(主视图,Phase 2.0 后另含 frontendFiles) */
  frontendSource: string;
  /** 生成的后端 .ts 源码字符串(主 endpoint handler) */
  backendSource: string;
  /** Phase 2.0:多文件前端产物(routes.tsx + 各 view + App.tsx) */
  frontendFiles?: Record<string, string>;
  /** Phase 2.0:多文件后端产物(handlers.ts + route.ts) */
  backendFiles?: Record<string, string>;
  /** 投影过程中的诊断(含 OSE 治理诊断) */
  diagnostics: ProjectionDiagnostic[];
  /** Phase 2.2:阶段非法等硬阻塞标志(true 时 stage handler 不应执行) */
  blocked?: boolean;
  /** Phase 2.2:阻塞原因(error 级 OSE 诊断聚合) */
  blockReasons?: string[];
  /** OSE 治理报告 */
  oseReport?: {
    problemDefinition: ProjectionDiagnostic[];
    structuralConsistency: ProjectionDiagnostic[];
    risks: ProjectionDiagnostic[];
    assumptions: ProjectionDiagnostic[];
    /** Phase 2.0 新增 hooks(全部用 ProjectionDiagnostic[] 承载) */
    routeConsistency?: ProjectionDiagnostic[];
    multiConceptCoverage?: ProjectionDiagnostic[];
    deadRouteDetection?: ProjectionDiagnostic[];
    /** Phase 2.1/2.2 hooks */
    stageLegality?: ProjectionDiagnostic[];
    transitionCompleteness?: ProjectionDiagnostic[];
    signalValidity?: ProjectionDiagnostic[];
    regenerationIsolation?: ProjectionDiagnostic[];
    /** Phase 2.3 hooks */
    functionRisk?: ProjectionDiagnostic[];
    blockIntegrity?: ProjectionDiagnostic[];
    boundaryIntegrity?: ProjectionDiagnostic[];
  };
  /** Phase 2.3:携带 IR 引用,前端可直接 callCSLFunction(ir, ...) 计算派生字段 */
  ir?: IRContainer;
  /** Phase 2.3:函数清单(冗余,便于 UI 列出可调用函数) */
  functions?: FunctionSpec[];
}

/**
 * OSE 裁决级别(Phase 2.5 引入)
 * - pass:通过(一般不产出诊断)
 * - warn:有问题但不阻断
 * - block:硬阻断,不可执行/投影/导出
 * - block_with_fix_hint:硬阻断但附带修复建议
 */
export type OSESeverity = 'pass' | 'warn' | 'block' | 'block_with_fix_hint';

/**
 * OSE 修复建议(仅 block_with_fix_hint 携带)
 * action 限定 4 种,保持克制;target 为操作对象的名字(概念/阶段/成员等)
 */
export interface OSEFixHint {
  /** ≤40 字中文祈使句,对象名必须用「」引 */
  summary: string;
  action: 'remove_node' | 'add_declaration' | 'fix_ref' | 'complete_field';
  target?: string;
}

/** P4:源码定位信息 — 让治理阻断可点击跳转到源码行 */
export interface SourceLocation {
  /** 1-based 行号 */
  line: number;
  /** 1-based 列号(可选) */
  column?: number;
  /** 行结束(用于多行节点) */
  lineEnd?: number;
  /** 该行/节点的源码片段(≤80 字,用于 UI 提示) */
  snippet?: string;
}

export interface ProjectionDiagnostic {
  /** 兼容字段:info / warn / error(历史语义,继续写) */
  level: 'info' | 'warn' | 'error';
  message: string;
  /** Phase 2.5:OSE 裁决级别(可选,旧诊断不强制补) */
  severity?: OSESeverity;
  /** Phase 2.5:稳定策略 id,如 'ose.blockIntegrity.dangling_ref' */
  policyId?: string;
  /** Phase 2.5:修复建议,仅 severity='block_with_fix_hint' 时必填 */
  fixHint?: OSEFixHint;
  /** Phase 2.5:触发节点 id(供 UI 定位) */
  nodeRef?: string;
  /** P4:源码定位 — 让 UI 能跳到对应源码行(由 dispatch 层根据 nodeRef 反查 AST 注入) */
  sourceLocation?: SourceLocation;
}
