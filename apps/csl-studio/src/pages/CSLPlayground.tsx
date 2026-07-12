import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { WorkspacePanel } from '@/components/csl/WorkspacePanel';
import { VersionDiffPanel } from '@/components/csl/VersionDiffPanel';
import {
  getActiveWorkspace, updateWorkspaceSource, maybeAutoSnapshot,
  stampWorkspaceBuild, checkWorkspaceStampsDrift,
  type Workspace,
} from '@/csl/workspace';
import { currentStamps } from '@/csl/version-stamps';
import { runCSL, type CSLResult, type GrammarVersion, VERSION_FEATURES, FEATURE_LABELS, VERSION_LABELS } from '@/csl';
import { EXAMPLES } from '@/csl/examples';
import { loadSpecRegistry, validateSpecAgainstCode } from '@/csl/specs/loader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HighlightedEditor } from '@/components/csl/HighlightedEditor';
import { ASTTree } from '@/components/csl/ASTTree';
import { SubjectsPanel } from '@/components/csl/SubjectsPanel';
import { StageEnginePanel } from '@/components/csl/StageEnginePanel';
import { OntologyPanel } from '@/components/csl/OntologyPanel';
import { JudgmentOSPanel } from '@/components/csl/JudgmentOSPanel';
import { ConceptAIPanel } from '@/components/csl/ConceptAIPanel';
import { EngineMatrixPanel } from '@/components/csl/EngineMatrixPanel';
import { MemoryBlocksPanel } from '@/components/csl/MemoryBlocksPanel';
import { SpecsPanel } from '@/components/csl/SpecsPanel';
import { ProjectionPanel } from '@/components/csl/ProjectionPanel';
import { Play, Code2, TreePine, Database, ShieldCheck, Filter, Brain, Link2, AlertCircle, FunctionSquare, Download, User, GitBranch, Sparkles, Cpu, Bot, Layers, Blocks, BookText, Globe, AlertTriangle, GitCompare, FlaskConical } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ObjectStatusBar } from '@/components/csl/ObjectStatusBar';
import { IncompatibilityDetailsPanel } from '@/components/csl/IncompatibilityDetailsPanel';
import { ShellActionBar } from '@/components/csl/ShellActionBar';
import {
  toStatusBarProps, toShellActionContext,
  type ObjectShellState,
} from '@/csl/ui/object-shell-state';

/** v0.8 防御：只接受纯文本写入 source state，过滤掉任何 HTML 标签 */
function sanitizeSource(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/<\/?[a-zA-Z][^>]*>/g, '');
}

// Phase 2.4 示例硬对齐:registry 为正源,代码层 EXAMPLES 必须 1:1 对齐
//   - 仅在双源都登记的 id 才进入 Playground 可选列表
//   - mismatch 在顶部以红条展示,提示需修正源头
const SPEC_REGISTRY_INIT = loadSpecRegistry();
const SPEC_EX_IDS = new Set(SPEC_REGISTRY_INIT.examples.map(e => e.id));
const ALIGNED_EXAMPLES = EXAMPLES.filter(e => SPEC_EX_IDS.has(e.id));
const EXAMPLE_MISMATCHES = validateSpecAgainstCode(
  SPEC_REGISTRY_INIT,
  EXAMPLES.map(e => e.id),
  [],
).filter(m => m.category === 'examples');

/** 一个版本下"可选"的示例：v0.8 模式只允许 v0.8 示例；v0.9 模式允许 v0.8+v0.9 */
function isExampleAvailable(exampleVersion: GrammarVersion, current: GrammarVersion): boolean {
  if (current === 'v0.8') return exampleVersion === 'v0.8';
  if (current === 'v0.9') return exampleVersion === 'v0.8' || exampleVersion === 'v0.9';
  return true;
}

const CSLPlayground = () => {
  const [version, setVersion] = useState<GrammarVersion>('v0.8');
  const navigate = useNavigate();
  const initialCode = sanitizeSource(ALIGNED_EXAMPLES[0]?.code ?? '');
  const [exampleId, setExampleId] = useState(ALIGNED_EXAMPLES[0]?.id ?? '');
  const [code, setCodeRaw] = useState(initialCode);
  const [result, setResult] = useState<CSLResult | null>(null);
  const [activeTab, setActiveTab] = useState('tokens');
  // MVP-2 Phase 6:活动工作区 id
  const [activeWsId, setActiveWsId] = useState<string | null>(null);
  const autoSaveTimerRef = useRef<number | null>(null);

  const setCode = useCallback((next: string | ((prev: string) => string)) => {
    setCodeRaw(prev => {
      const raw = typeof next === 'function' ? next(prev) : next;
      return sanitizeSource(raw);
    });
  }, []);

  const [diffOpen, setDiffOpen] = useState(false);

  const handleRun = useCallback(() => {
    const r = runCSL(code, version);
    setResult(r);
    if (activeWsId) {
      maybeAutoSnapshot(activeWsId, code, version, r);
      // MVP-2 Phase 7:成功 build 后写回 lastBuildStamps
      if (r.ir) stampWorkspaceBuild(activeWsId, currentStamps(version));
    }
  }, [code, version, activeWsId]);

  // MVP-2 Phase 7:工作区版本指纹漂移提示
  const stampsDrift = useMemo(() => {
    if (!activeWsId) return null;
    const w = getActiveWorkspace();
    if (!w || w.id !== activeWsId) return null;
    return checkWorkspaceStampsDrift(version, w.lastBuildStamps);
  }, [version, activeWsId, result]);

  // 启动时恢复活动工作区
  useEffect(() => {
    const w = getActiveWorkspace();
    if (w) {
      setActiveWsId(w.id);
      if (w.source) {
        setCodeRaw(sanitizeSource(w.source));
        setVersion(w.cslVersion);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 自动保存(2s 节流)
  useEffect(() => {
    if (!activeWsId) return;
    if (autoSaveTimerRef.current) window.clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = window.setTimeout(() => {
      try {
        updateWorkspaceSource(activeWsId, code, version);
      } catch {
        /* storage 异常由 panel 提示,这里静默 */
      }
    }, 2000);
    return () => {
      if (autoSaveTimerRef.current) window.clearTimeout(autoSaveTimerRef.current);
    };
  }, [code, version, activeWsId]);

  const handleLoadWorkspace = useCallback((w: Workspace) => {
    setActiveWsId(w.id);
    setCodeRaw(sanitizeSource(w.source));
    setVersion(w.cslVersion);
    setResult(runCSL(w.source, w.cslVersion));
  }, []);

  const handleExampleChange = useCallback((id: string) => {
    // Phase 2.4:仅允许已通过 registry 对齐的 id
    if (!SPEC_EX_IDS.has(id)) return;
    const ex = ALIGNED_EXAMPLES.find(e => e.id === id);
    if (!ex || ex.disabled) return;
    if (!isExampleAvailable(ex.version, version)) return;
    const nextCode = sanitizeSource(ex.code);
    setExampleId(id);
    setCodeRaw(nextCode);
    setResult(runCSL(nextCode, version));
  }, [version]);

  const handleVersionChange = useCallback((v: GrammarVersion) => {
    setVersion(v);
    const firstEx = ALIGNED_EXAMPLES.find(e => !e.disabled && isExampleAvailable(e.version, v));
    if (firstEx) {
      const nextCode = sanitizeSource(firstEx.code);
      setExampleId(firstEx.id);
      setCodeRaw(nextCode);
      setResult(runCSL(nextCode, v));
    } else {
      setResult(runCSL(code, v));
    }
  }, [code]);

  const handleExportIR = useCallback(() => {
    if (!result?.ir) return;
    const blob = new Blob([JSON.stringify(result.ir, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `csl-ir-${exampleId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result, exampleId]);

  // Auto-run on mount
  useMemo(() => {
    setResult(runCSL(initialCode, 'v0.8'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enabledFeatureLabels = VERSION_FEATURES[version].map(f => FEATURE_LABELS[f]);


  const tokenColorClass = (type: string) => {
    switch (type) {
      case 'KEYWORD': return 'text-token-keyword';
      case 'STRING': return 'text-token-string';
      case 'NUMBER': return 'text-token-number';
      case 'OPERATOR': return 'text-token-operator';
      case 'IDENTIFIER': return 'text-token-identifier';
      default: return 'text-token-punctuation';
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b bg-card flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Code2 className="w-5 h-5 text-primary" />
          <h1 className="text-base font-semibold text-card-foreground">CSL Playground</h1>
          <Badge variant="secondary" className="text-xs font-mono">{version}</Badge>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* 版本切换 */}
          <div className="flex rounded-md border overflow-hidden h-8">
            {(['v0.8', 'v0.9'] as GrammarVersion[]).map(v => (
              <button
                key={v}
                onClick={() => handleVersionChange(v)}
                className={`px-3 text-xs font-mono transition-colors ${
                  version === v
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:bg-muted'
                }`}
                title={VERSION_LABELS[v]}
              >
                {VERSION_LABELS[v]}
              </button>
            ))}
          </div>

          <Select value={exampleId} onValueChange={handleExampleChange}>
            <SelectTrigger className="w-[200px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALIGNED_EXAMPLES.map(ex => {
                const available = !ex.disabled && isExampleAvailable(ex.version, version);
                const reason = ex.disabled
                  ? '[experimental]'
                  : !isExampleAvailable(ex.version, version)
                    ? `[需要 ${ex.version}]`
                    : '';
                return (
                  <SelectItem
                    key={ex.id}
                    value={ex.id}
                    disabled={!available}
                    className="text-xs"
                  >
                    <span className="font-medium">{ex.name}</span>
                    <span className="text-muted-foreground ml-2">{ex.description}</span>
                    {reason && (
                      <span className="ml-2 text-[10px] text-status-warning">{reason}</span>
                    )}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <WorkspacePanel
            currentSource={code}
            currentVersion={version}
            currentResult={result}
            activeWorkspaceId={activeWsId}
            onLoadWorkspace={handleLoadWorkspace}
          />
          {/* P6:工作区 → 演示壳的回链。带上 ws=<id>,演示壳挂载时识别并把对象拉回成临时 demo */}
          {activeWsId && (
            <Link
              to={`/?from=workspace&ws=${activeWsId}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm hover:bg-muted"
              title="把当前工作区对象带回演示壳查看(保留 source / version / lockState / origin)"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              回演示壳查看
            </Link>
          )}
          <button
            onClick={handleExportIR}
            disabled={!result?.ir}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm hover:bg-muted disabled:opacity-50"
            title="导出当前 IR 为 JSON"
          >
            <Download className="w-3.5 h-3.5" />
            导出 IR
          </button>
          <button
            onClick={() => setDiffOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm hover:bg-muted"
            title="并行编译 v0.8 与 v0.9 并展示差异"
          >
            <GitCompare className="w-3.5 h-3.5" />
            对比版本
          </button>
          <button
            onClick={handleRun}
            className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Play className="w-3.5 h-3.5" />
            运行
          </button>
        </div>
      </header>

      {/* MVP-2 Phase 7:版本指纹漂移提示 */}
      {stampsDrift?.drifted && stampsDrift.hint && (
        <div className="px-5 py-1.5 border-b bg-status-warning/10 text-[11px] text-status-warning flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{stampsDrift.hint}</span>
        </div>
      )}

      <VersionDiffPanel open={diffOpen} source={code} onOpenChange={setDiffOpen} />

      {/* P12: 跨壳层统一对象状态条 + 统一动作条 (workspace 壳) */}
      {(() => {
        const w = activeWsId ? getActiveWorkspace() : null;
        const lock = (w?.lockState ?? 'editable') as 'editable' | 'read_only' | 'incompatible';
        const oseSt: 'pass' | 'warn' | 'block' | 'unknown' =
          !result ? 'unknown'
          : result.error ? 'block'
          : result.oseVerdict?.blocked ? 'block'
          : 'pass';
        const compatV = w?.origin?.compatVerdict;
        const objName = w?.name ?? '(未命名工作区)';
        const bucket = w?.origin?.kind === 'imported_bundle' ? 'user_bundle'
                     : w?.origin?.kind === 'imported_csl' ? 'user_csl'
                     : 'workspace';
        const state: ObjectShellState = {
          objectId: activeWsId ?? 'unsaved',
          objectName: objName,
          bucket,
          lockState: lock,
          oseStatus: oseSt,
          compat: compatV,
          version,
          shellMode: 'workspace',
          hasWorkspace: !!activeWsId,
        };
        return (
          <div className="px-5 py-1.5 border-b bg-card flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <ObjectStatusBar {...toStatusBarProps(state)} />
              {compatV && compatV !== 'compatible' && (
                <IncompatibilityDetailsPanel
                  objectName={objName}
                  verdict={compatV}
                  primaryHint={w?.origin?.primaryHint}
                  reasons={w?.origin?.compatReasons}
                  imported={w?.origin?.importedStamps}
                  current={currentStamps(version)}
                  origin="workspace"
                />
              )}
            </div>
            <ShellActionBar
              ctx={toShellActionContext(state)}
              actions={[
                'openInViewer',
                'openInCompareSrc',
                'backToShowcase',
                'exportSource',
                'exportSnapshot',
                'openInPlayground',
                'convertToWorkspace',
              ]}
              handlers={{
                openInViewer: activeWsId
                  ? () => window.open(`/viewer?ws=${encodeURIComponent(activeWsId)}&from=workspace`, '_blank')
                  : undefined,
                openInCompareSrc: activeWsId
                  ? () => navigate(`/?shell=compare&compareSource=${encodeURIComponent('from_ws_' + activeWsId)}`)
                  : undefined,
                backToShowcase: activeWsId
                  ? () => navigate(`/?from=workspace&ws=${activeWsId}`)
                  : () => navigate('/'),
                // exportSource / exportSnapshot 由 WorkspacePanel 提供入口 — 这里不重复接线,capability 保持启用,
                //   缺 handler 时 ShellActionBar 会显式禁用并解释"此壳层未提供该动作 — 请用工作区面板"
                openInPlayground: undefined, // 当前已在 playground;capability 会因 hasWorkspace=true 启用,但缺 handler → 禁用
                // convertToWorkspace 在 workspace 壳由 capability matrix 直接禁用并解释"对象已在工作区"
              }}
            />
          </div>
        );
      })()}

      {/* Feature info bar */}
      <div className="px-5 py-1.5 border-b bg-muted/30 text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap">
        <span className="font-medium">当前版本：</span>
        <Badge variant="outline" className="font-mono text-[10px]">{version}</Badge>
        <span className="ml-2 font-medium">已启用能力：</span>
        {enabledFeatureLabels.length === 0 ? (
          <span className="italic">仅基础语法（概念/实例/属性/不变量/规则/证据）</span>
        ) : (
          enabledFeatureLabels.map(l => (
            <Badge key={l} variant="outline" className="text-[10px] font-mono">{l}</Badge>
          ))
        )}
      </div>

      {/* MVP-1:CapabilityProfile 实时状态条 */}
      {result?.profile && (
        <div className="px-5 py-1.5 border-b bg-primary/5 text-[11px] flex items-center gap-2 flex-wrap">
          <span className="font-medium text-primary">规格主权 CP:</span>
          <Badge variant="outline" className="font-mono text-[10px]">{result.profile.id.split('|').slice(0, 2).join(' · ')}</Badge>
          <span className="text-muted-foreground">可用视图模式</span>
          <span className="font-mono text-foreground">{result.profile.enabledModes.length}/8</span>
          <span className="text-muted-foreground">· 函数调用</span>
          <Badge
            variant="outline"
            className={`text-[10px] font-mono ${result.profile.runtimePermissions.allowFunctionCall ? 'text-status-success border-status-success/40' : 'text-destructive border-destructive/40'}`}
          >
            {result.profile.runtimePermissions.allowFunctionCall ? '允许' : '拒绝'}
          </Badge>
          <span className="text-muted-foreground">· 阶段转移</span>
          <Badge
            variant="outline"
            className={`text-[10px] font-mono ${result.profile.runtimePermissions.allowStageTransition ? 'text-status-success border-status-success/40' : 'text-muted-foreground'}`}
          >
            {result.profile.runtimePermissions.allowStageTransition ? '允许' : '拒绝'}
          </Badge>
          {result.ir?._meta && (() => {
            const log = result.ir._meta.buildLog || [];
            const disabled = log.filter(e => e.decision === 'disabled').length;
            const illegal = log.filter(e => e.decision === 'illegal').length;
            const accepted = log.filter(e => e.decision === 'accepted').length;
            const hasIssue = disabled + illegal > 0;
            return (
              <>
                <span className="text-muted-foreground">· IR 快照</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-mono ${hasIssue ? 'text-amber-600 border-amber-500/40' : 'text-status-success border-status-success/40'}`}
                  title={`profileId: ${result.ir._meta.profileId}\nsourceSpecId: ${result.ir._meta.sourceSpecId}\n构建时间: ${result.ir._meta.builtAt}\nbuildLog: accepted=${accepted} disabled=${disabled} illegal=${illegal}`}
                >
                  已冻结 · {accepted} 接受{disabled > 0 ? ` · ${disabled} 降级` : ''}{illegal > 0 ? ` · ${illegal} 非法` : ''}
                </Badge>
              </>
            );
          })()}
        </div>
      )}

      {/* MVP-1:RuntimeGuard 拦截日志 */}
      {result?.guardLog && result.guardLog.length > 0 && (
        <div className="px-5 py-1.5 border-b bg-destructive/10 text-[11px] text-destructive flex items-start gap-2 flex-wrap">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">RuntimeGuard 拦截 ({result.guardLog.length}):</span>
            <ul className="mt-1 space-y-0.5 font-mono">
              {result.guardLog.slice(0, 5).map((g, i) => (
                <li key={i}>
                  · <span className="text-foreground/80">[{g.policyId}]</span> {g.reason}
                  {g.fixHint && <span className="ml-2 text-muted-foreground">💡 {g.fixHint}</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Phase 2.4:示例双源硬对齐 — mismatch 红条 */}
      {EXAMPLE_MISMATCHES.length > 0 && (
        <div className="px-5 py-1.5 border-b bg-destructive/10 text-[11px] text-destructive flex items-start gap-2 flex-wrap">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">示例硬对齐失败 ({EXAMPLE_MISMATCHES.length}):</span>
            <span className="ml-2">不一致项已从下拉菜单剔除,请同步修正 examples-registry.csl 与 src/csl/examples.ts</span>
            <ul className="mt-1 space-y-0.5 font-mono">
              {EXAMPLE_MISMATCHES.slice(0, 3).map((m, i) => (
                <li key={i}>· {m.message}</li>
              ))}
              {EXAMPLE_MISMATCHES.length > 3 && (
                <li>· … 共 {EXAMPLE_MISMATCHES.length} 项,详见「自举规格」面板</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex min-h-0">
        {/* Editor Panel */}
        <div className="w-1/2 flex flex-col border-r">
          <div className="px-4 py-2 text-xs font-medium text-muted-foreground bg-panel-header border-b flex items-center gap-2">
            <Code2 className="w-3.5 h-3.5" />
            CSL 源代码
            <span className="ml-auto text-[10px]">语法高亮 · {code.split('\n').length} 行</span>
          </div>
          <div className="flex-1 relative">
            <HighlightedEditor value={code} onChange={setCode} readOnly={!!activeWsId && (() => { const w = getActiveWorkspace(); return !!w && (w.lockState ?? 'editable') !== 'editable'; })()} />
          </div>
          {result?.error && (
            <div className="px-4 py-2 text-xs bg-destructive/10 text-destructive border-t flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {result.error}
            </div>
          )}
        </div>

        {/* Result Panel */}
        <div className="w-1/2 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start rounded-none border-b bg-panel-header px-2 h-auto py-0 gap-0 overflow-x-auto flex-nowrap whitespace-nowrap">
              {[
                { val: 'tokens', icon: Code2, label: 'Tokens' },
                { val: 'ast', icon: TreePine, label: 'AST' },
                { val: 'ir', icon: Database, label: 'IR' },
                { val: 'subjects', icon: User, label: '主体' },
                { val: 'advance', icon: GitBranch, label: '阶段推进' },
                { val: 'ontology', icon: Sparkles, label: '本体' },
                { val: 'judgment', icon: Cpu, label: '判断 OS' },
                { val: 'conceptai', icon: Bot, label: '概念 AI' },
                { val: 'engines', icon: Layers, label: '母体引擎' },
                { val: 'memblocks', icon: Blocks, label: '记忆块' },
                { val: 'validate', icon: ShieldCheck, label: '校验' },
                { val: 'select', icon: Filter, label: '筛选' },
                { val: 'infer', icon: Brain, label: '推理' },
                { val: 'functions', icon: FunctionSquare, label: '函数' },
                { val: 'trace', icon: Link2, label: '回链' },
                { val: 'specs', icon: BookText, label: '自举规格' },
                { val: 'projection', icon: Globe, label: '全栈投影' },
              ].map(tab => (
                <TabsTrigger
                  key={tab.val}
                  value={tab.val}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs px-3 py-2.5 gap-1.5"
                >
                  <tab.icon className="w-3 h-3" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex-1 overflow-auto">
              <TabsContent value="tokens" className="m-0 p-4 animate-fade-in">
                {result?.tokens && (
                  <div className="space-y-0.5">
                    <div className="grid grid-cols-[80px_120px_1fr_60px] gap-2 text-xs font-medium text-muted-foreground pb-2 border-b mb-2">
                      <span>类型</span><span>值</span><span>位置</span><span></span>
                    </div>
                    {result.tokens.filter(t => t.type !== 'EOF').map((t, i) => (
                      <div key={i} className="grid grid-cols-[80px_120px_1fr_60px] gap-2 text-xs font-mono py-1 hover:bg-muted/50 rounded px-1">
                        <Badge variant="outline" className={`text-[10px] w-fit ${tokenColorClass(t.type)}`}>{t.type}</Badge>
                        <span className={tokenColorClass(t.type)}>{t.value || '""'}</span>
                        <span className="text-muted-foreground">行 {t.line}, 列 {t.col}</span>
                        <span></span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="ast" className="m-0 p-4 animate-fade-in">
                {result?.ast ? (
                  <ASTTree data={result.ast} defaultOpen />
                ) : (
                  <span className="text-xs text-muted-foreground">暂无数据</span>
                )}
              </TabsContent>

              <TabsContent value="ir" className="m-0 p-4 animate-fade-in">
                <pre className="text-xs font-mono leading-5 text-foreground whitespace-pre-wrap">
                  {result?.ir ? JSON.stringify(result.ir, null, 2) : '暂无数据'}
                </pre>
              </TabsContent>

              <TabsContent value="subjects" className="m-0 p-4 animate-fade-in">
                <SubjectsPanel ir={result?.ir ?? null} />
              </TabsContent>

              <TabsContent value="advance" className="m-0 p-4 animate-fade-in">
                <StageEnginePanel ir={result?.ir ?? null} advancements={result?.stageAdvancements} />
              </TabsContent>

              <TabsContent value="ontology" className="m-0 p-4 animate-fade-in">
                <OntologyPanel ir={result?.ir ?? null} />
              </TabsContent>

              <TabsContent value="judgment" className="m-0 p-4 animate-fade-in">
                <JudgmentOSPanel ir={result?.ir ?? null} />
              </TabsContent>

              <TabsContent value="conceptai" className="m-0 p-4 animate-fade-in">
                <ConceptAIPanel ir={result?.ir ?? null} />
              </TabsContent>

              <TabsContent value="engines" className="m-0 p-4 animate-fade-in">
                <EngineMatrixPanel ir={result?.ir ?? null} />
              </TabsContent>

              <TabsContent value="memblocks" className="m-0 p-4 animate-fade-in">
                <MemoryBlocksPanel
                  ir={result?.ir ?? null}
                  onAppendCode={(snippet) => setCode(prev => prev + snippet)}
                />
              </TabsContent>

              <TabsContent value="validate" className="m-0 p-4 animate-fade-in">
                {result?.validation && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant={result.validation.valid ? 'default' : 'destructive'} className={result.validation.valid ? 'bg-status-success' : ''}>
                        {result.validation.valid ? '✓ 通过' : '✗ 未通过'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {result.validation.errors.length} 错误, {result.validation.warnings.length} 警告
                      </span>
                    </div>
                    {result.validation.errors.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-destructive">错误</div>
                        {result.validation.errors.map((e, i) => (
                          <div key={i} className="text-xs px-3 py-2 rounded bg-destructive/10 text-destructive font-mono">{e}</div>
                        ))}
                      </div>
                    )}
                    {result.validation.warnings.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-status-warning">警告</div>
                        {result.validation.warnings.map((w, i) => (
                          <div key={i} className="text-xs px-3 py-2 rounded bg-status-warning/10 text-status-warning font-mono">{w}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="select" className="m-0 p-4 animate-fade-in">
                {result?.selection && (
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-medium text-status-success mb-2">✓ 合格 ({result.selection.result.length})</div>
                      <div className="flex flex-wrap gap-2">
                        {result.selection.result.map(r => (
                          <Badge key={r} variant="outline" className="text-status-success border-status-success/30">{r}</Badge>
                        ))}
                        {result.selection.result.length === 0 && <span className="text-xs text-muted-foreground">无</span>}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-destructive mb-2">✗ 排除 ({result.selection.excluded.length})</div>
                      {result.selection.excluded.map(e => (
                        <div key={e} className="mb-2">
                          <Badge variant="outline" className="text-destructive border-destructive/30 mb-1">{e}</Badge>
                          <div className="pl-3 space-y-0.5">
                            {result.selection.reasons[e]?.map((r, i) => (
                              <div key={i} className="text-xs text-muted-foreground font-mono">• {r}</div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="infer" className="m-0 p-4 animate-fade-in">
                {result?.inference && (
                  <div className="space-y-4">
                    {Object.keys(result.inference.labels).length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-primary mb-2">标签</div>
                        {Object.entries(result.inference.labels).map(([name, labels]) => (
                          <div key={name} className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono">{name}</span>
                            {labels.map((l, i) => (
                              <Badge key={i} className="bg-status-warning/20 text-status-warning text-[10px]">{l}</Badge>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                    {result.inference.excluded.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-destructive mb-2">排除</div>
                        {result.inference.excluded.map(e => (
                          <Badge key={e} variant="outline" className="text-destructive mr-2">{e}</Badge>
                        ))}
                      </div>
                    )}
                    {result.inference.returns.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-status-success mb-2">返回</div>
                        {result.inference.returns.map(r => (
                          <Badge key={r} variant="outline" className="text-status-success mr-2">{r}</Badge>
                        ))}
                      </div>
                    )}
                    {Object.keys(result.inference.labels).length === 0 && result.inference.excluded.length === 0 && result.inference.returns.length === 0 && (
                      <span className="text-xs text-muted-foreground">无推理结果</span>
                    )}
                    {/* 0.8 — 规则证据链回指 */}
                    {result.inference.evidence_chains && Object.keys(result.inference.evidence_chains).length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-2 mt-2">证据链（v0.8）</div>
                        <div className="space-y-2">
                          {Object.entries(result.inference.evidence_chains).map(([entityName, links]) => (
                            <details key={entityName} className="border rounded-md p-2 bg-card">
                              <summary className="text-xs font-mono cursor-pointer">
                                {entityName} <span className="text-muted-foreground">· {links.length} 条规则触发</span>
                              </summary>
                              <div className="mt-2 space-y-2 pl-2">
                                {links.map((lk, i) => (
                                  <div key={i} className="text-[11px] border-l-2 border-primary/30 pl-2">
                                    <div className="font-mono text-primary">规则 {lk.rule_name}</div>
                                    <div className="text-muted-foreground mt-0.5">条件：{lk.matched_conditions.join(' 且 ') || '—'}</div>
                                    <div className="text-muted-foreground">动作：{lk.action_summary || '—'}</div>
                                    {lk.evidence_refs.length > 0 && (
                                      <div className="mt-1 flex flex-wrap gap-1">
                                        {lk.evidence_refs.map(r => (
                                          <Badge key={r} variant="outline" className="text-[10px] font-mono">{r}</Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </details>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="functions" className="m-0 p-4 animate-fade-in">
                {result?.functionResults && result.functionResults.length > 0 ? (
                  <div className="space-y-3">
                    {result.functionResults.map((fr, i) => (
                      <div key={i} className="border rounded-md p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <FunctionSquare className="w-3 h-3 text-primary" />
                          <span className="text-xs font-mono font-medium">{fr.function_name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            ({fr.args._entity as string})
                          </span>
                          {fr.result !== null && (
                            <Badge className="bg-accent text-accent-foreground text-[10px] ml-auto">
                              → {String(fr.result)}
                            </Badge>
                          )}
                        </div>
                        <div className="ml-4 space-y-0.5">
                          {fr.trace.map((t, j) => (
                            <div key={j} className="text-[11px] text-muted-foreground font-mono">▸ {t}</div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">无函数定义或执行结果</span>
                )}
              </TabsContent>

              <TabsContent value="trace" className="m-0 p-4 animate-fade-in">
                {result?.traces && result.traces.length > 0 ? (
                  <div className="space-y-4">
                    {result.traces.map((t, i) => (
                      <div key={i} className="border rounded-md p-3">
                        <div className="text-xs font-medium mb-2 flex items-center gap-2">
                          <Link2 className="w-3 h-3 text-primary" />
                          {t.target}
                        </div>
                        {t.evidence_chain.map((ev, j) => (
                          <div key={j} className="ml-4 border-l-2 border-primary/20 pl-3 mb-2">
                            <div className="text-xs font-mono text-primary">{ev.source}</div>
                            <div className="text-xs text-muted-foreground mt-0.5 italic">"{ev.snippet}"</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">支持: {ev.supports.join(', ')}</div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">无证据回链</span>
                )}
              </TabsContent>

              <TabsContent value="specs" className="m-0 p-4 animate-fade-in">
                <SpecsPanel onOpenInEditor={(source, label) => {
                  setCode(source);
                  setExampleId(label);
                  setResult(runCSL(source, 'v0.8'));
                }} />
              </TabsContent>

              <TabsContent value="projection" className="m-0 p-4 animate-fade-in">
                <ProjectionPanel />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-5 py-1.5 border-t bg-card text-[10px] text-muted-foreground flex items-center justify-between">
        <span>CSL 编译器与运行时 · 版本骨架 v0.9 · v0.8 纯净闭环 + v0.9 函数/主体/阶段/编译层第一批</span>
        {result && !result.error && (
          <span>
            {result.version} · {result.tokens.length - 1} tokens · {result.ast?.body.length || 0} 声明 · {result.ir ? (result.ir.concepts.length + result.ir.entities.length) : 0} IR 节点
          </span>
        )}
      </footer>
    </div>
  );
};

export default CSLPlayground;
