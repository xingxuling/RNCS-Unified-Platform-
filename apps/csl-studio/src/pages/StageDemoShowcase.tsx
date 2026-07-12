// CSL P4 — 阶段流程引擎演示壳(增强版)
//
// P4 在 P3 基础上新增:
//   - 治理阻断/候选阻断 → 点击"定位源码"跳到对应行 + 高亮
//   - 候选转移逐条解释(由 StageEnginePanel 渲染)
//   - 用户自带流程现场试跑(导入 .csl / bundle / 粘贴文本,直接在壳内运行)
//   - 三 Demo 对比视图(并列卡片)
//   - 返回顶部按钮
//   - 锁定状态联动复核(read_only/incompatible 真实禁用编辑与导出)

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight, ShieldCheck, ShieldAlert, ShieldX, Lock, Code2,
  CheckCircle2, XCircle, Sparkles, Cpu, FileDown, Upload, Package,
  Layers, GitBranch, AlertTriangle, FlaskConical, BookOpen, Copy,
  ExternalLink, ArrowUpToLine, Columns3, ClipboardPaste, FileText, User,
  Trash2, Save, History, Database, FolderOpen,
} from 'lucide-react';
import { runCSL, advanceAllSubjects, type CSLResult, type GrammarVersion } from '@/csl';
import { currentStamps } from '@/csl/version-stamps';
import {
  createWorkspace, setActiveWorkspace, importBundleZip,
  importBundleAsWorkspace, pickBundleFile, pickCSLFile, parseCSLFileText,
  buildCSLFileText, downloadCSLFile, exportBundleZip,
  buildSnapshotFromResult,
  loadWorkspace, listWorkspaces, pruneRecentAgainstIndex,
  BundleImportError,
  type Workspace,
} from '@/csl/workspace';
import type { CompatCheckResult, CompatVerdict } from '@/csl/workspace/compat';
import type { VersionStamps } from '@/csl/version-stamps';
import {
  STAGE_DEMO_TEMPLATES, type StageDemoTemplate,
} from '@/csl/stage-demo-templates';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { StageEnginePanel } from '@/components/csl/StageEnginePanel';
import { HighlightedEditor } from '@/components/csl/HighlightedEditor';
import { CompatReasonsCard, CompatVerdictBadge } from '@/components/csl/CompatReasonsCard';
import { ModeUnavailableCard, ModeUnavailableBadge } from '@/components/csl/ModeUnavailableCard';
import { ObjectStatusBar } from '@/components/csl/ObjectStatusBar';
import { IncompatibilityDetailsPanel } from '@/components/csl/IncompatibilityDetailsPanel';
import { CompareShellView, type ComparableObject } from '@/components/csl/CompareShellView';
import { ShellActionBar } from '@/components/csl/ShellActionBar';
import {
  toStatusBarProps, toShellActionContext,
  type ObjectShellState,
} from '@/csl/ui/object-shell-state';

// =====================================================================
// 工具:从 CSLResult 派生 OSE 总状态
// =====================================================================

type OseStatus = 'pass' | 'warn' | 'block' | 'unknown';

interface FlatOseDiag {
  policyId: string;
  reason: string;
  fixHint?: string;
  severity: 'block' | 'warn' | 'info';
  sourceLocation?: { line: number; column?: number; snippet?: string };
}

function flattenOseReport(report: CSLResult['oseReport']): FlatOseDiag[] {
  if (!report) return [];
  const out: FlatOseDiag[] = [];
  for (const [bucket, list] of Object.entries(report) as Array<[string, unknown]>) {
    if (!Array.isArray(list)) continue;
    for (const d of list as Array<Record<string, unknown>>) {
      const sev = d.severity as string | undefined;
      const lvl = d.level as string | undefined;
      const severity: 'block' | 'warn' | 'info' =
        (sev === 'block' || sev === 'block_with_fix_hint' || (sev === undefined && lvl === 'error')) ? 'block'
        : (sev === 'warn' || (sev === undefined && lvl === 'warn')) ? 'warn'
        : 'info';
      const rawHint = d.fixHint;
      let fixHint: string | undefined;
      if (typeof rawHint === 'string') fixHint = rawHint;
      else if (rawHint && typeof rawHint === 'object') {
        const h = rawHint as { summary?: string; action?: string; target?: string };
        fixHint = h.summary || [h.action, h.target].filter(Boolean).join(' → ') || undefined;
      }
      const loc = d.sourceLocation as { line: number; column?: number; snippet?: string } | undefined;
      out.push({
        policyId: (d.policyId as string) || (d.code as string) || bucket,
        reason: (d.message as string) || (d.reason as string) || '(无说明)',
        fixHint,
        severity,
        sourceLocation: loc,
      });
    }
  }
  return out;
}

function deriveOseStatus(result: CSLResult | null): OseStatus {
  if (!result) return 'unknown';
  if (result.error) return 'block';
  if (result.oseVerdict?.blocked) return 'block';
  const hasGovBlock = (result.stageAdvancements ?? [])
    .some(a => a.halt_reason === 'governance_blocked');
  if (hasGovBlock) return 'block';
  if ((result.guardLog?.length ?? 0) > 0) return 'block';
  const flat = flattenOseReport(result.oseReport);
  if (flat.some(r => r.severity === 'warn')) return 'warn';
  return 'pass';
}

const OSE_STATUS_META: Record<OseStatus, { label: string; cls: string; Icon: typeof ShieldCheck }> = {
  pass:    { label: 'OSE pass',    cls: 'border-status-success/40 text-status-success bg-status-success/5', Icon: ShieldCheck },
  warn:    { label: 'OSE warn',    cls: 'border-status-warning/40 text-status-warning bg-status-warning/5', Icon: ShieldAlert },
  block:   { label: 'OSE block',   cls: 'border-destructive/40 text-destructive bg-destructive/5',          Icon: ShieldX },
  unknown: { label: 'OSE 未运行',  cls: 'border-border text-muted-foreground bg-muted/40',                    Icon: ShieldAlert },
};

// =====================================================================
// 用户导入对象类型 + P5:本地持久化
// =====================================================================

type DemoBucket = 'template' | 'user_csl' | 'user_bundle' | 'user_paste';

interface UserDemo {
  id: string;
  name: string;
  bucket: DemoBucket;
  version: GrammarVersion;
  code: string;
  /** 来自 bundle 的 lockState(否则可编辑) */
  lockState: 'editable' | 'read_only' | 'incompatible';
  origin: string;
  createdAt: string;
  updatedAt: string;
  /** P6: bundle 导入对象保留兼容判定全量信息(verdict / reasons / stamps),供 UI 展示 */
  compat?: CompatCheckResult;
  importedStamps?: VersionStamps;
  /** P6: 由工作区拉回演示壳时,记录原工作区 id 以支持往返 */
  linkedWorkspaceId?: string;
}

const STORAGE_KEY_DEMOS = 'csl:showcase:user_demos';
const STORAGE_KEY_RECENT = 'csl:showcase:recent_active';
const STORAGE_KEY_ACTIVE = 'csl:showcase:active_id';
const STORAGE_KEY_COMPARE = 'csl:showcase:compare';      // P7
const STORAGE_KEY_TAB = 'csl:showcase:tab';              // P7
const RECENT_MAX = 6;

function loadUserDemos(): UserDemo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DEMOS);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter(x => x && typeof x.id === 'string' && typeof x.code === 'string');
  } catch { return []; }
}
function saveUserDemos(list: UserDemo[]): void {
  try { localStorage.setItem(STORAGE_KEY_DEMOS, JSON.stringify(list)); } catch { /* quota */ }
}
// P8/P9: shell-aware recent — 旧 schema(string[])自动兼容,读不到 shellMode 时降级为 'showcase'。
// P9 新增 `from`(进入 viewer 时来源)与可选 `viewerPanel`(viewer 子状态),
// 用于「点击 recent 恢复时尽量回到上次观看视角」。
export type RecentFromKind = 'compare' | 'showcase' | 'recent' | 'workspace' | 'viewer' | 'direct';
export interface RecentEntryLite {
  id: string;
  shellMode: 'showcase' | 'workspace' | 'viewer' | 'compare';
  ts: number;
  /** P9: viewer 来源(仅 shellMode='viewer' 时有意义) */
  from?: RecentFromKind;
  /** P9: viewer 子面板(预留;当前 viewer 仅一个主面板) */
  viewerPanel?: string;
}
function loadRecentActive(): RecentEntryLite[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECENT);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    // 旧格式 string[] → 自动升级
    if (arr.length > 0 && typeof arr[0] === 'string') {
      return (arr as string[]).map(id => ({ id, shellMode: 'showcase' as const, ts: Date.now() }));
    }
    return arr.filter((x): x is RecentEntryLite => x && typeof x.id === 'string');
  } catch { return []; }
}
function saveRecentActive(list: RecentEntryLite[]): void {
  try { localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(list.slice(0, RECENT_MAX))); } catch { /* */ }
}
function loadStoredActiveId(): string | null {
  try { return localStorage.getItem(STORAGE_KEY_ACTIVE); } catch { return null; }
}
function saveStoredActiveId(id: string): void {
  try { localStorage.setItem(STORAGE_KEY_ACTIVE, id); } catch { /* */ }
}

// P7: compare 上下文持久化
interface StoredCompare { source: string | null; target: string | null }
function loadCompare(): StoredCompare {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COMPARE);
    if (!raw) return { source: null, target: null };
    const o = JSON.parse(raw);
    return {
      source: typeof o?.source === 'string' ? o.source : null,
      target: typeof o?.target === 'string' ? o.target : null,
    };
  } catch { return { source: null, target: null }; }
}
function saveCompare(c: StoredCompare): void {
  try { localStorage.setItem(STORAGE_KEY_COMPARE, JSON.stringify(c)); } catch { /* */ }
}
function loadStoredTab(): 'run' | 'compare' {
  try {
    const t = localStorage.getItem(STORAGE_KEY_TAB);
    return t === 'compare' ? 'compare' : 'run';
  } catch { return 'run'; }
}
function saveStoredTab(t: 'run' | 'compare'): void {
  try { localStorage.setItem(STORAGE_KEY_TAB, t); } catch { /* */ }
}

const BUCKET_LABEL: Record<DemoBucket, string> = {
  template: '内置演示模板',
  user_csl: '用户导入 .csl',
  user_bundle: '用户导入运行包',
  user_paste: '文本粘贴对象',
};

/** P6: 统一动作文案,避免「另存 / 转入 / 打开 / 继续」语义混乱 */
const ACTION_LABELS = {
  toWorkspace: '转入正式工作区',           // 演示壳 → 工作区(可编辑/只读由 lockState 决定)
  forkAsEditable: '另存为可编辑工作区',     // 只读对象 → 新可编辑工作区
  backToShowcase: '回到演示壳查看',         // 工作区 → 演示壳(P6 新增)
  openInPlayground: '前往 Playground 继续编辑',
  reRun: '重新运行',
  importCsl: '导入 .csl',
  importBundle: '导入运行包',
  pasteSource: '粘贴文本',
  exportSource: '导出 .csl',
  exportBundle: '导出运行包',
  exportSnapshot: '导出诊断快照(JSON)',
};

// =====================================================================
// 主组件
// =====================================================================

export default function StageDemoShowcase() {
  // ---------- 模板与用户对象(P5:本地持久化) ----------
  const [userDemos, setUserDemos] = useState<UserDemo[]>(() => loadUserDemos());
  const [recentIds, setRecentIds] = useState<RecentEntryLite[]>(() => loadRecentActive());
  const persistedIdSet = useMemo(() => new Set(userDemos.map(u => u.id)), [userDemos]);

  // 任何 userDemos 变化都立刻落 localStorage
  useEffect(() => { saveUserDemos(userDemos); }, [userDemos]);

  const allDemos = useMemo(() => {
    const now = new Date().toISOString();
    const tpls: Array<UserDemo & { template: StageDemoTemplate }> = STAGE_DEMO_TEMPLATES.map(t => ({
      id: t.id,
      name: t.name,
      bucket: 'template',
      version: t.version,
      code: t.code,
      lockState: t.simulateReadOnly ? 'read_only' : 'editable',
      origin: '内置演示模板',
      createdAt: now,
      updatedAt: now,
      template: t,
    }));
    return [...tpls, ...userDemos.map(u => ({ ...u, template: undefined as StageDemoTemplate | undefined }))];
  }, [userDemos]);

  // 初始 active:优先 localStorage 中保存的(且仍存在),否则首个模板
  const [activeId, setActiveId] = useState<string>(() => {
    const stored = loadStoredActiveId();
    const restored = loadUserDemos();
    const all = [...STAGE_DEMO_TEMPLATES.map(t => t.id), ...restored.map(u => u.id)];
    return (stored && all.includes(stored)) ? stored : STAGE_DEMO_TEMPLATES[0].id;
  });
  const active = useMemo(
    () => allDemos.find(d => d.id === activeId) ?? allDemos[0],
    [allDemos, activeId],
  );

  // P8: active 变化 → recent 记录 shellMode + ts(基于当前 tab,启动时默认 'showcase')
  useEffect(() => {
    saveStoredActiveId(activeId);
    setRecentIds(prev => {
      const shellMode = (loadStoredTab?.() === 'compare') ? 'compare' as const : 'showcase' as const;
      const entry: RecentEntryLite = { id: activeId, shellMode, ts: Date.now() };
      const next = [entry, ...prev.filter(x => x.id !== activeId)].slice(0, RECENT_MAX);
      saveRecentActive(next);
      return next;
    });
  }, [activeId]);

  // P6: 双向同步 — 工作区→演示壳。?from=workspace&ws=<id> 时把工作区拉回成临时 demo 对象。
  // 保留 source / version / lockState / origin / sourceLabel,实现"重新进入状态一致"。
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const from = searchParams.get('from');
    const wsId = searchParams.get('ws');
    if (from !== 'workspace' || !wsId) return;
    const w = loadWorkspace(wsId);
    if (!w) {
      toast({ title: '工作区不存在或已被删除', variant: 'destructive' });
      // 清理 URL,避免循环
      const sp = new URLSearchParams(searchParams);
      sp.delete('from'); sp.delete('ws');
      setSearchParams(sp, { replace: true });
      return;
    }
    const demoId = `from_ws_${w.id}`;
    const lock: UserDemo['lockState'] = (w.lockState ?? 'editable');
    const originLabel =
      w.origin?.sourceLabel
        ? `自工作区「${w.name}」回演示壳 · 原始来源:${w.origin.sourceLabel}`
        : `自工作区「${w.name}」回演示壳`;
    const bucket: DemoBucket =
      w.origin?.kind === 'imported_bundle' ? 'user_bundle'
      : w.origin?.kind === 'imported_csl' ? 'user_csl'
      : 'user_csl';
    // P7: 若工作区携带 compat 信息(来自 imported_bundle),恢复成 demo.compat 让 IncompatibilityDetailsPanel 可用
    const restoredCompat: CompatCheckResult | undefined =
      w.origin?.compatVerdict
        ? {
            verdict: w.origin.compatVerdict,
            reasons: w.origin.compatReasons ?? [],
            primaryHint: w.origin.primaryHint ?? '',
            current: currentStamps(w.cslVersion),
            imported: (w.origin.importedStamps ?? currentStamps(w.cslVersion)) as VersionStamps,
          }
        : undefined;
    setUserDemos(prev => {
      const next = prev.filter(u => u.id !== demoId);
      next.push({
        id: demoId,
        name: w.name,
        bucket,
        version: w.cslVersion,
        code: w.source,
        lockState: lock,
        origin: originLabel,
        createdAt: w.createdAt,
        updatedAt: new Date().toISOString(),
        linkedWorkspaceId: w.id,
        compat: restoredCompat,
        importedStamps: w.origin?.importedStamps,
      });
      return next;
    });
    setActiveId(demoId);
    toast({
      title: '已从工作区回到演示壳',
      description: `${w.name} · 状态已保留(${lock})`,
    });
    const sp = new URLSearchParams(searchParams);
    sp.delete('from'); sp.delete('ws');
    setSearchParams(sp, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // P7: shell tab + compare 上下文(localStorage 持久化)
  const [shellTab, setShellTab] = useState<'run' | 'compare'>(() => loadStoredTab());
  const [compareSourceId, setCompareSourceId] = useState<string | null>(() => loadCompare().source);
  const [compareTargetId, setCompareTargetId] = useState<string | null>(() => loadCompare().target);
  useEffect(() => { saveStoredTab(shellTab); }, [shellTab]);
  useEffect(() => { saveCompare({ source: compareSourceId, target: compareTargetId }); }, [compareSourceId, compareTargetId]);

  // P7: mode-specific deep links — shell / object / compareSource / compareTarget / mode
  // 行为:参数齐全则切换 tab + 设置对象;非法参数提示后忽略;读完即清理 URL,避免循环。
  // 为不与上面的 ?from=workspace 冲突,这里只在没有 from 时处理。
  useEffect(() => {
    if (searchParams.get('from')) return; // 让上面的工作区回流先处理
    const shell = searchParams.get('shell');
    const objId = searchParams.get('object');
    const cs = searchParams.get('compareSource');
    const ct = searchParams.get('compareTarget');
    const mode = searchParams.get('mode'); // 预留:viewer 等
    if (!shell && !objId && !cs && !ct && !mode) return;

    const knownIds = new Set<string>([
      ...STAGE_DEMO_TEMPLATES.map(t => t.id),
      ...loadUserDemos().map(u => u.id),
    ]);

    let invalid: string[] = [];

    if (shell === 'compare') setShellTab('compare');
    else if (shell === 'run' || shell === 'showcase') setShellTab('run');
    else if (shell) invalid.push(`shell=${shell}`);

    if (objId) {
      if (knownIds.has(objId)) setActiveId(objId);
      else invalid.push(`object=${objId}`);
    }
    if (cs) {
      if (knownIds.has(cs)) setCompareSourceId(cs);
      else invalid.push(`compareSource=${cs}`);
    }
    if (ct) {
      if (knownIds.has(ct)) setCompareTargetId(ct);
      else invalid.push(`compareTarget=${ct}`);
    }
    if (mode && mode !== 'viewer' && mode !== 'run' && mode !== 'compare') {
      invalid.push(`mode=${mode}`);
    }

    if (invalid.length > 0) {
      toast({
        title: '部分深链参数无效,已忽略',
        description: invalid.join(' · '),
        variant: 'destructive',
      });
    }

    const sp = new URLSearchParams(searchParams);
    ['shell', 'object', 'compareSource', 'compareTarget', 'mode'].forEach(k => sp.delete(k));
    setSearchParams(sp, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const [code, setCode] = useState<string>(active.code);
  const [version, setVersion] = useState<GrammarVersion>(active.version);
  const [lockState, setLockState] = useState<UserDemo['lockState']>(active.lockState);
  const [result, setResult] = useState<CSLResult | null>(null);
  const isReadOnly = lockState !== 'editable';
  const isIncompatible = lockState === 'incompatible';

  // 切对象时:重置编辑器/版本/锁/重跑
  useEffect(() => {
    setCode(active.code);
    setVersion(active.version);
    setLockState(active.lockState);
    setResult(runCSL(active.code, active.version));
    setHighlightLine(null);
  }, [active.id, active.code, active.version, active.lockState]);

  // P5-2:lockState 变化时,以真实 stage-engine 重新计算 advancements 注入 mode/permission 阻断
  const advancements = useMemo(() => {
    if (!result?.ir || !result.profile) return result?.stageAdvancements ?? [];
    if (lockState === 'editable') return result.stageAdvancements ?? [];
    // 只读 / 不兼容 → 重新跑一次,带 enforcement.lockState
    return advanceAllSubjects(result.ir, result.profile, result.oseVerdict, undefined, { lockState });
  }, [result, lockState]);


  const oseStatus = useMemo(() => deriveOseStatus(result), [result]);
  const oseMeta = OSE_STATUS_META[oseStatus];
  const stamps = useMemo(() => currentStamps(version), [version]);

  // ---------- 跳转源码 ----------
  const [highlightLine, setHighlightLine] = useState<number | null>(null);
  const [highlightTick, setHighlightTick] = useState<number>(0);
  const editorScrollRef = useRef<HTMLDivElement>(null);

  const handleJumpToSource = useCallback((line: number, snippet?: string) => {
    setHighlightLine(line);
    setHighlightTick(t => t + 1);
    // 滚回页面左侧编辑器
    editorScrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (snippet) {
      toast({ title: `已定位到第 ${line} 行`, description: snippet });
    } else {
      toast({ title: `已定位到第 ${line} 行` });
    }
  }, []);

  // ---------- 操作 ----------
  const handleRun = useCallback(() => {
    if (isIncompatible) {
      toast({ title: '不兼容对象,无法运行', variant: 'destructive' });
      return;
    }
    setResult(runCSL(code, version));
  }, [code, version, isIncompatible]);

  const handleCodeChange = useCallback((next: string) => {
    if (isReadOnly) return;
    setCode(next);
  }, [isReadOnly]);

  // ---------- 用户导入 ----------
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteVersion, setPasteVersion] = useState<GrammarVersion>('v0.9');

  const handleImportCSLLocal = useCallback(async () => {
    const file = await pickCSLFile();
    if (!file) return;
    try {
      const parsed = parseCSLFileText(file.text);
      const v: GrammarVersion = (parsed.header.cslVersion as GrammarVersion) ?? version;
      const id = `user_csl_${Date.now()}`;
      const now = new Date().toISOString();
      const demo: UserDemo = {
        id,
        name: parsed.header.workspaceName || file.filename.replace(/\.csl$/i, ''),
        bucket: 'user_csl',
        version: v,
        code: parsed.source,
        lockState: 'editable',
        origin: `导入自 ${file.filename}`,
        createdAt: now,
        updatedAt: now,
      };
      setUserDemos(prev => [...prev, demo]);
      setActiveId(id);
      toast({ title: '已在演示壳内试跑(已自动保留)', description: `${demo.name} · 刷新后仍可继续试用` });
    } catch (e) {
      toast({ title: '导入失败', description: String(e), variant: 'destructive' });
    }
  }, [version]);

  const handleImportBundleLocal = useCallback(async () => {
    const file = await pickBundleFile();
    if (!file) return;
    try {
      const parsed = await importBundleZip(file);
      const id = `user_bundle_${Date.now()}`;
      const lock: UserDemo['lockState'] =
        parsed.verdict === 'compatible' ? 'editable'
        : parsed.verdict === 'read_only' ? 'read_only'
        : 'incompatible';
      const now = new Date().toISOString();
      const demo: UserDemo = {
        id,
        name: parsed.manifest.workspace.name,
        bucket: 'user_bundle',
        version: parsed.manifest.cslVersion,
        code: parsed.source,
        lockState: lock,
        origin: `导入运行包 · ${parsed.compat.primaryHint || parsed.verdict}`,
        createdAt: now,
        updatedAt: now,
        compat: parsed.compat,
        importedStamps: parsed.manifest.versionStamps,
      };
      setUserDemos(prev => [...prev, demo]);
      setActiveId(id);
      toast({
        title: lock === 'editable' ? '运行包已导入并试跑' : `运行包已导入(${lock === 'read_only' ? '只读' : '不兼容'})`,
        description: parsed.compat.primaryHint,
      });
    } catch (e) {
      if (e instanceof BundleImportError) {
        // P6: incompatible 时 BundleImportError 内挂了 parsed,创建 incompatible 临时对象供 UI 解释
        const parsedAttached = (e as unknown as { parsed?: import('@/csl/workspace').ParsedBundle }).parsed;
        if (e.code === 'incompatible_version' && parsedAttached) {
          const id = `user_bundle_${Date.now()}`;
          const now = new Date().toISOString();
          const demo: UserDemo = {
            id,
            name: parsedAttached.manifest.workspace.name + '(不兼容)',
            bucket: 'user_bundle',
            version: parsedAttached.manifest.cslVersion,
            code: parsedAttached.source,
            lockState: 'incompatible',
            origin: `导入运行包(不兼容) · ${parsedAttached.compat.primaryHint}`,
            createdAt: now,
            updatedAt: now,
            compat: parsedAttached.compat,
            importedStamps: parsedAttached.manifest.versionStamps,
          };
          setUserDemos(prev => [...prev, demo]);
          setActiveId(id);
          toast({
            title: '运行包不兼容,已作为只看元信息对象载入',
            description: e.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: '运行包导入失败',
            description: e.message + (e.details.length ? '\n' + e.details.join('\n') : ''),
            variant: 'destructive',
          });
        }
      } else {
        toast({ title: '运行包导入失败', description: String(e), variant: 'destructive' });
      }
    }
  }, []);

  const handlePasteSubmit = useCallback(() => {
    const text = pasteText.trim();
    if (!text) {
      toast({ title: '请粘贴 CSL 源码', variant: 'destructive' });
      return;
    }
    const id = `user_paste_${Date.now()}`;
    const now = new Date().toISOString();
    const demo: UserDemo = {
      id,
      name: `临时粘贴对象 #${userDemos.filter(u => u.bucket === 'user_paste').length + 1}`,
      bucket: 'user_paste',
      version: pasteVersion,
      code: text,
      lockState: 'editable',
      origin: '从文本粘贴',
      createdAt: now,
      updatedAt: now,
    };
    setUserDemos(prev => [...prev, demo]);
    setActiveId(id);
    setPasteOpen(false);
    setPasteText('');
    toast({ title: '已在演示壳内试跑(已自动保留)', description: '刷新后此对象仍在演示壳列表中' });
  }, [pasteText, pasteVersion, userDemos]);

  const handleRemoveUserDemo = useCallback((id: string) => {
    setUserDemos(prev => prev.filter(u => u.id !== id));
    if (activeId === id) setActiveId(STAGE_DEMO_TEMPLATES[0].id);
    // P7/P8: recent / compare 同步清理孤儿引用 (RecentEntryLite[])
    setRecentIds(prev => {
      const next = prev.filter(x => x.id !== id);
      saveRecentActive(next);
      return next;
    });
    if (compareSourceId === id) setCompareSourceId(null);
    if (compareTargetId === id) setCompareTargetId(null);
    toast({ title: '已删除用户对象' });
  }, [activeId, compareSourceId, compareTargetId]);

  // P5:清空所有用户对象(保留内置模板) — P7:同步清理 recent / compare
  const handleClearUserDemos = useCallback(() => {
    setUserDemos([]);
    setActiveId(STAGE_DEMO_TEMPLATES[0].id);
    const tplIds = new Set(STAGE_DEMO_TEMPLATES.map(t => t.id));
    setRecentIds(prev => {
      const filtered = prev.filter(x => tplIds.has(x.id));
      saveRecentActive(filtered);
      return filtered;
    });
    if (compareSourceId && !tplIds.has(compareSourceId)) setCompareSourceId(null);
    if (compareTargetId && !tplIds.has(compareTargetId)) setCompareTargetId(null);
    toast({ title: '已清空所有用户对象', description: '内置演示模板未受影响,compare/recent 已同步清理' });
  }, [compareSourceId, compareTargetId]);

  // ---------- 另存 / 导出 / 转入工作区 ----------
  // P5-3 / P6:把当前演示对象转入正式工作区(根据 lockState 决定可编辑/只读)
  // P6 强化:在 origin.sourceLabel 中保留演示壳标识,Playground 可凭此提供「回演示壳查看」按钮。
  const handleConvertToWorkspace = useCallback(() => {
    try {
      const isUser = active.bucket !== 'template';
      const lockForWs = lockState === 'incompatible' ? 'read_only' : lockState; // 不允许把不兼容直接放入可编辑
      const showcaseTag = `[from_showcase:${active.id}]`;
      const w = createWorkspace({
        name: isUser ? active.name : `${active.name} · 演示副本`,
        cslVersion: version,
        source: code,
        lockState: lockForWs,
        origin: {
          kind: active.bucket === 'user_bundle' ? 'imported_bundle'
              : active.bucket === 'user_csl' ? 'imported_csl'
              : 'local',
          sourceLabel: `${showcaseTag} ${active.origin || `从演示对象「${active.name}」转入`}`,
          importedAt: new Date().toISOString(),
          // 透传兼容判定(若有),让 Playground 端也能解释来源
          compatVerdict: active.compat?.verdict,
          compatReasons: active.compat?.reasons,
          primaryHint: active.compat?.primaryHint,
          importedStamps: active.importedStamps,
        },
      });
      setActiveWorkspace(w.id);
      pruneRecentAgainstIndex();
      const note = lockForWs === 'editable' ? '可编辑' : '只读(不兼容已降级为只读保留)';
      toast({
        title: `已${ACTION_LABELS.toWorkspace}`,
        description: `${w.name} · ${note} · ${ACTION_LABELS.openInPlayground}`,
      });
    } catch (e) {
      toast({ title: '转入失败', description: String(e), variant: 'destructive' });
    }
  }, [active, version, code, lockState]);

  // 旧入口:另存为可编辑副本(只读对象专用)
  const handleForkToWorkspace = useCallback(() => {
    try {
      const w = createWorkspace({
        name: `${active.name} · 演示副本`,
        cslVersion: version,
        source: code,
        lockState: 'editable',
        origin: {
          kind: 'local',
          sourceLabel: `[from_showcase:${active.id}] 从演示对象「${active.name}」另存`,
          importedAt: new Date().toISOString(),
        },
      });
      setActiveWorkspace(w.id);
      pruneRecentAgainstIndex();
      toast({ title: `已${ACTION_LABELS.forkAsEditable}`, description: `${w.name}(${ACTION_LABELS.openInPlayground})` });
    } catch (e) {
      toast({ title: '另存失败', description: String(e), variant: 'destructive' });
    }
  }, [active, version, code]);

  const handleExportSource = useCallback(() => {
    if (isIncompatible) {
      toast({ title: '不兼容对象不得导出', variant: 'destructive' });
      return;
    }
    const text = buildCSLFileText({
      source: code,
      cslVersion: version,
      workspaceName: active.name,
    });
    downloadCSLFile(`${active.id}.csl`, text);
    toast({ title: '已导出 .csl' });
  }, [code, version, active, isIncompatible]);

  const handleExportBundle = useCallback(async () => {
    if (isReadOnly) {
      toast({
        title: '只读对象不得导出当前版本运行包',
        description: '请先「另存为可编辑工作区」,再到 Playground 中导出',
        variant: 'destructive',
      });
      return;
    }
    if (!result) {
      toast({ title: '请先运行', variant: 'destructive' });
      return;
    }
    try {
      const ws: Workspace = {
        schemaVersion: 2,
        id: 'demo_' + active.id,
        name: active.name,
        cslVersion: version,
        source: code,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        snapshotIds: [],
        lockState: 'editable',
        origin: { kind: 'local' },
      };
      await exportBundleZip(ws, result);
      toast({ title: '已导出 .cslbundle.zip' });
    } catch (e) {
      toast({ title: '导出失败', description: String(e), variant: 'destructive' });
    }
  }, [isReadOnly, result, active, version, code]);

  const handleExportSnapshot = useCallback(() => {
    if (!result) {
      toast({ title: '请先运行', variant: 'destructive' });
      return;
    }
    const snap = buildSnapshotFromResult('demo_' + active.id, code, version, result, 'manual');
    const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${active.id}-snapshot.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: '已导出诊断快照' });
  }, [result, active, code, version]);

  // ---------- 派生数据 ----------
  const ir = result?.ir ?? null;
  const stageCount = ir?.stages.length ?? 0;
  const transitionCount = ir?.transitions.length ?? 0;
  const subjectCount = ir?.subjects.length ?? 0;
  // advancements 已在上方根据 lockState 重新计算(P5-2)
  const blockingHooks = result?.profile?.osePolicies.blockingHooks ?? [];
  const enabledModes = result?.profile?.enabledModes ?? [];
  const flatOse = flattenOseReport(result?.oseReport);
  const oseBlockResults = flatOse.filter(r => r.severity === 'block');
  const oseWarnResults  = flatOse.filter(r => r.severity === 'warn');
  const runnable = !result?.error && !!ir && oseStatus !== 'block' && !isIncompatible;

  // P7: compare 候选池 — 把 allDemos 拍平成 ComparableObject。每个对象走一次 runCSL 派生 oseStatus / enabledModes。
  // 数量很小(模板 + 用户对象,通常 ≤ 10),memo 后重算成本可控。
  const comparePool = useMemo<ComparableObject[]>(() => {
    return allDemos.map(d => {
      const r = runCSL(d.code, d.version);
      const ose = deriveOseStatus(r);
      const enabledModesD = r.profile?.enabledModes ?? [];
      const runnableD = !r.error && !!r.ir && ose !== 'block' && d.lockState !== 'incompatible';
      return {
        id: d.id,
        name: d.name,
        bucket: d.bucket,
        version: d.version,
        stamps: currentStamps(d.version),
        lockState: d.lockState,
        oseStatus: ose,
        compat: d.compat,
        enabledModes: [...enabledModesD],
        canEdit: d.lockState === 'editable',
        canRun: runnableD,
        canExportBundle: d.lockState === 'editable' && runnableD,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDemos]);

  // P9: viewer 打开 helper — 统一带 from,并写入 recent (shellMode='viewer', from=...)
  const openViewerFor = useCallback((id: string, from: RecentFromKind) => {
    setRecentIds(prev => {
      const entry: RecentEntryLite = { id, shellMode: 'viewer', ts: Date.now(), from };
      const next = [entry, ...prev.filter(x => !(x.id === id && x.shellMode === 'viewer'))].slice(0, RECENT_MAX);
      saveRecentActive(next);
      return next;
    });
    window.open(`/viewer?object=${encodeURIComponent(id)}&from=${encodeURIComponent(from)}`, '_blank');
  }, []);

  // P9: Compare 候选池排序 — 优先级:active → recent (按 ts) → 同版本 → 同来源 bucket → 其他
  // 数量小,直接 stable sort 即可。
  const sortedComparePool = useMemo<ComparableObject[]>(() => {
    const recentRank = new Map<string, number>();
    recentIds.forEach((r, idx) => {
      if (!recentRank.has(r.id)) recentRank.set(r.id, idx);
    });
    const activeBucket = active?.bucket;
    const activeVersion = active?.version;
    const score = (o: ComparableObject): number => {
      if (o.id === activeId) return -1000;
      const r = recentRank.get(o.id);
      let s = r !== undefined ? r : 100;
      if (o.version === activeVersion) s -= 20;
      if (o.bucket === activeBucket) s -= 5;
      return s;
    };
    return [...comparePool].sort((a, b) => score(a) - score(b));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comparePool, recentIds, activeId, active?.bucket, active?.version]);

  // ---------- 返回顶部 ----------
  const [showBackTop, setShowBackTop] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 200);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const backToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // ---------- 渲染 ----------
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ============== 顶栏 ============== */}
      <header className="px-6 py-3 border-b bg-card flex items-center gap-3 flex-wrap">
        <Sparkles className="w-5 h-5 text-primary" />
        <h1 className="text-base font-semibold">阶段流程引擎 · 演示壳</h1>
        <Badge variant="secondary" className="text-xs font-mono">P6 Showcase</Badge>
        <span className="text-xs text-muted-foreground hidden md:inline">
          可现场试用 · 可现场解释 · 可现场对比
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/playground">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Code2 className="w-3.5 h-3.5" />
              进入 Playground
              <ExternalLink className="w-3 h-3 opacity-60" />
            </Button>
          </Link>
        </div>
      </header>

      <Tabs value={shellTab} onValueChange={(v) => setShellTab(v as 'run' | 'compare')} className="flex-1 flex flex-col">
        <div className="px-6 pt-3 border-b bg-muted/10">
          <TabsList>
            <TabsTrigger value="run" className="gap-1.5"><Cpu className="w-3.5 h-3.5" />现场试跑</TabsTrigger>
            <TabsTrigger value="compare" className="gap-1.5"><Columns3 className="w-3.5 h-3.5" />Compare 壳 / 三 Demo 对比</TabsTrigger>
          </TabsList>
        </div>

        {/* ============== Tab 1:现场试跑 ============== */}
        <TabsContent value="run" className="flex-1 flex flex-col m-0">
          {/* 第一行:对象选择 */}
          <section className="px-6 py-3 border-b bg-muted/20">
            <div className="text-[11px] text-muted-foreground mb-2 flex items-center gap-1.5 flex-wrap">
              <FlaskConical className="w-3 h-3" />
              <span>演示对象 — 内置三个典型场景,或</span>
              <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={handleImportCSLLocal}>
                <Upload className="w-3 h-3" />导入 .csl
              </Button>
              <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={handleImportBundleLocal}>
                <Package className="w-3 h-3" />导入运行包
              </Button>
              <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={() => setPasteOpen(true)}>
                <ClipboardPaste className="w-3 h-3" />粘贴文本
              </Button>
              <span className="text-muted-foreground/70">— 导入/粘贴的对象会自动保留,刷新后仍在</span>
              {userDemos.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-destructive hover:text-destructive ml-auto">
                      <Trash2 className="w-3 h-3" />清空用户对象({userDemos.length})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>清空所有用户对象?</AlertDialogTitle>
                      <AlertDialogDescription>
                        将删除你导入和粘贴的全部 {userDemos.length} 个对象,并重置到内置演示模板。内置模板不受影响,此操作不可撤销。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearUserDemos}>确认清空</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {/* P6:最近试用对象 — 升级为可识别条目(name + bucket + version + lockState) */}
            {recentIds.length > 1 && (
              <div className="text-[10px] text-muted-foreground mb-2 flex items-start gap-1.5 flex-wrap">
                <History className="w-3 h-3 mt-1" />
                <span className="mt-1">最近:</span>
                {recentIds.slice(0, RECENT_MAX).map(entry => {
                  const d = allDemos.find(x => x.id === entry.id);
                  if (!d) return null;
                  const bucketShort =
                    d.bucket === 'template' ? '模板'
                    : d.bucket === 'user_csl' ? '.csl'
                    : d.bucket === 'user_bundle' ? '运行包'
                    : '粘贴';
                  const lockCls =
                    d.lockState === 'editable' ? 'border-status-success/40 text-status-success'
                    : d.lockState === 'incompatible' ? 'border-destructive/40 text-destructive'
                    : 'border-status-warning/40 text-status-warning';
                  const shellShort =
                    entry.shellMode === 'compare' ? '对比'
                    : entry.shellMode === 'viewer' ? '审阅'
                    : entry.shellMode === 'workspace' ? '工作区'
                    : '试跑';
                  return (
                    <button
                      key={entry.id + '_' + entry.shellMode}
                      onClick={() => {
                        setActiveId(entry.id);
                        if (entry.shellMode === 'compare') setShellTab('compare');
                        else if (entry.shellMode === 'viewer') {
                          const from = entry.from ?? 'recent';
                          openViewerFor(entry.id, from);
                        }
                      }}
                      className={`px-1.5 py-0.5 rounded border text-[10px] hover:bg-muted flex items-center gap-1 ${entry.id === activeId ? 'border-primary text-primary' : 'border-border'}`}
                      title={`${d.name} · ${BUCKET_LABEL[d.bucket]} · ${d.version} · ${d.lockState} · 上次:${shellShort}${entry.from ? ` · 自 ${entry.from}` : ''}`}
                    >
                      <span className="truncate max-w-[80px]">{d.name}</span>
                      <span className="opacity-60 font-mono">{bucketShort}</span>
                      <span className="opacity-60 font-mono">{d.version}</span>
                      <span className={`font-mono ${lockCls}`}>{d.lockState === 'editable' ? '可编' : d.lockState === 'read_only' ? '只读' : '不兼'}</span>
                      <span className="opacity-50 font-mono">{shellShort}</span>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {allDemos.map(d => {
                const tpl = (d as { template?: StageDemoTemplate }).template;
                const isUser = d.bucket !== 'template';
                const HighlightIcon = tpl?.highlight === 'normal_advance' ? CheckCircle2
                  : tpl?.highlight === 'governance_blocked' ? ShieldX
                  : tpl?.highlight === 'read_only_legacy' ? Lock
                  : d.bucket === 'user_csl' ? FileText
                  : d.bucket === 'user_bundle' ? Package
                  : User;
                const iconCls = tpl?.highlight === 'normal_advance' ? 'text-status-success'
                  : tpl?.highlight === 'governance_blocked' ? 'text-destructive'
                  : tpl?.highlight === 'read_only_legacy' ? 'text-status-warning'
                  : 'text-primary';
                const isActive = d.id === activeId;
                return (
                  <button
                    key={d.id}
                    onClick={() => setActiveId(d.id)}
                    className={`text-left rounded-md border p-3 transition-colors relative ${
                      isActive
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <HighlightIcon className={`w-3.5 h-3.5 ${iconCls}`} />
                      <span className="text-sm font-semibold truncate">{d.name}</span>
                      <Badge variant="outline" className="text-[10px] font-mono ml-auto">{d.version}</Badge>
                      {isUser && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveUserDemo(d.id); }}
                          className="text-muted-foreground hover:text-destructive ml-1"
                          title="移除"
                        >
                          <XCircle className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-snug">
                      {tpl?.tagline || d.origin}
                    </div>
                    {d.lockState !== 'editable' && (
                      <Badge variant="outline" className={`text-[9px] mt-1 ${d.lockState === 'incompatible' ? 'border-destructive/40 text-destructive' : 'border-status-warning/40 text-status-warning'}`}>
                        {d.lockState === 'incompatible' ? '不兼容' : '只读'}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 第二行:总览 */}
          <section className="px-6 py-3 border-b bg-card flex items-center gap-3 flex-wrap text-xs">
            <span className="font-medium text-muted-foreground">流程总览</span>
            <Badge variant="outline" className="font-mono text-[10px]">{active.name}</Badge>

            <span className="text-muted-foreground ml-2">版本身份:</span>
            <Badge variant="outline" className="font-mono text-[10px]">grammar={stamps.grammarVersion}</Badge>
            <Badge variant="outline" className="font-mono text-[10px]">spec=v{stamps.specVersion}</Badge>
            <Badge variant="outline" className="font-mono text-[10px]">compiler={stamps.compilerVersion}</Badge>
            <Badge variant="outline" className="font-mono text-[10px]">ose=v{stamps.osePolicyVersion}</Badge>

            <span className="text-muted-foreground ml-2">锁定:</span>
            {lockState === 'editable' ? (
              <Badge variant="outline" className="text-[10px] border-status-success/40 text-status-success bg-status-success/5">editable</Badge>
            ) : lockState === 'read_only' ? (
              <Badge variant="outline" className="text-[10px] border-status-warning/40 text-status-warning bg-status-warning/5 flex items-center gap-1">
                <Lock className="w-3 h-3" />read_only
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive bg-destructive/5 flex items-center gap-1">
                <Lock className="w-3 h-3" />incompatible
              </Badge>
            )}

            <span className="text-muted-foreground ml-2">治理:</span>
            <Badge variant="outline" className={`text-[10px] flex items-center gap-1 ${oseMeta.cls}`}>
              <oseMeta.Icon className="w-3 h-3" />{oseMeta.label}
            </Badge>

            <span className="text-muted-foreground ml-2">可运行:</span>
            {runnable ? (
              <Badge variant="outline" className="text-[10px] border-status-success/40 text-status-success bg-status-success/5">是</Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive bg-destructive/5">
                否 · {result?.error ? '解析失败' : isIncompatible ? '不兼容' : oseStatus === 'block' ? '治理阻断' : '未编译'}
              </Badge>
            )}

            <div className="ml-auto flex items-center gap-1.5">
              <Button size="sm" variant="default" onClick={handleRun} disabled={isIncompatible} className="h-7 text-xs gap-1">
                <Cpu className="w-3 h-3" />重新运行
              </Button>
            </div>
          </section>

          {/* 期望事实(仅模板有) */}
          {(active as { template?: StageDemoTemplate }).template && (
            <section className="px-6 py-2 border-b bg-primary/5 text-[11px] flex items-start gap-2 flex-wrap">
              <BookOpen className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold text-primary">这个 demo 应该让你看到:</span>
                <ul className="mt-1 space-y-0.5 text-muted-foreground">
                  {(active as { template?: StageDemoTemplate }).template!.expectations.map((e, i) => (
                    <li key={i}>· {e}</li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* 主体区 */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0">
            {/* 左:CSL 源码 */}
            <div ref={editorScrollRef} className="flex flex-col border-r min-h-[420px]">
              <div className="px-4 py-2 text-xs font-medium text-muted-foreground bg-panel-header border-b flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5" />
                CSL 源码
                {isReadOnly && (
                  <Badge variant="outline" className={`text-[9px] ml-1 gap-1 ${isIncompatible ? 'border-destructive/40 text-destructive' : 'border-status-warning/40 text-status-warning'}`}>
                    <Lock className="w-2.5 h-2.5" />{isIncompatible ? '不兼容' : '只读'}
                  </Badge>
                )}
                {highlightLine && (
                  <Badge variant="outline" className="text-[9px] border-primary/40 text-primary ml-1">
                    已定位 L{highlightLine}
                  </Badge>
                )}
                <span className="ml-auto text-[10px]">{code.split('\n').length} 行</span>
              </div>
              <div className="flex-1 relative">
                <HighlightedEditor
                  value={code}
                  onChange={handleCodeChange}
                  readOnly={isReadOnly}
                  highlightLine={highlightLine}
                  highlightToken={highlightTick}
                />
              </div>
              {result?.error && (
                <div className="px-4 py-2 text-xs bg-destructive/10 text-destructive border-t flex items-center gap-2">
                  <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {result.error}
                </div>
              )}
            </div>

            {/* 右:面板 */}
            <ScrollArea className="min-h-[420px]">
              <div className="p-4 space-y-4">
                {/* 主体阶段 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-primary" />
                      主体阶段推进
                      {result?.profile && !result.profile.enabledModes.includes('stage') && (
                        <ModeUnavailableBadge mode="stage" />
                      )}
                    </CardTitle>
                    <CardDescription className="text-[11px]">
                      每条候选转移逐条解释:为什么能走 / 为什么被拦 / 谁拦的 / 修哪
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {result?.profile && !result.profile.enabledModes.includes('stage') ? (
                      <ModeUnavailableCard mode="stage" profile={result.profile} modeLabel="阶段流程视图" />
                    ) : ir && subjectCount > 0 ? (
                      <StageEnginePanel
                        ir={ir}
                        advancements={advancements}
                        onJumpToSource={handleJumpToSource}
                      />
                    ) : (
                      <div className="text-xs text-muted-foreground py-4 text-center">
                        当前 IR 不含主体 / 阶段,无可推进对象
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 结构与治理 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      结构与治理摘要
                    </CardTitle>
                    <CardDescription className="text-[11px]">
                      能不能跑 / 为什么不能跑 — 结构事实 + 治理事实并列
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="rounded border p-2 bg-muted/30">
                        <div className="text-[10px] text-muted-foreground">主体</div>
                        <div className="font-mono text-base">{subjectCount}</div>
                      </div>
                      <div className="rounded border p-2 bg-muted/30">
                        <div className="text-[10px] text-muted-foreground">主权阶段</div>
                        <div className="font-mono text-base">{stageCount}</div>
                      </div>
                      <div className="rounded border p-2 bg-muted/30">
                        <div className="text-[10px] text-muted-foreground">阶段转移</div>
                        <div className="font-mono text-base">{transitionCount}</div>
                      </div>
                      <Button
                        variant="default" size="sm" className="text-xs gap-1.5 col-span-2"
                        onClick={handleConvertToWorkspace}
                      >
                        <Save className="w-3 h-3" />
                        {ACTION_LABELS.toWorkspace}({lockState === 'editable' ? '可编辑' : lockState === 'read_only' ? '只读' : '只读·降级'})
                      </Button>
                    </div>

                    {/* P12: 统一对象状态条 + 统一动作条 (showcase 壳) */}
                    {(() => {
                      const state: ObjectShellState = {
                        objectId: active.id,
                        objectName: active.name,
                        bucket: active.bucket,
                        lockState,
                        oseStatus,
                        compat: active.compat?.verdict,
                        version,
                        shellMode: 'showcase',
                        hasWorkspace: !!active.linkedWorkspaceId,
                      };
                      return (
                        <div className="space-y-2">
                          <ObjectStatusBar {...toStatusBarProps(state)} />
                          <ShellActionBar
                            ctx={toShellActionContext(state)}
                            actions={[
                              'openInViewer',
                              'openInCompareSrc',
                              'convertToWorkspace',
                              'forkAsEditable',
                              'exportSource',
                              'exportSnapshot',
                              'openInPlayground',
                              'backToShowcase',
                            ]}
                            handlers={{
                              openInViewer: () => openViewerFor(active.id, 'showcase'),
                              openInCompareSrc: () =>
                                window.open(`/?shell=compare&compareSource=${encodeURIComponent(active.id)}`, '_self'),
                              convertToWorkspace: handleConvertToWorkspace,
                              forkAsEditable: handleForkToWorkspace,
                              exportSource: handleExportSource,
                              exportSnapshot: handleExportSnapshot,
                              openInPlayground: active.linkedWorkspaceId
                                ? () => window.open('/playground', '_self')
                                : undefined,
                              // backToShowcase 故意不接 handler — 当前已在演示壳,capability 会自动禁用并解释
                            }}
                          />
                        </div>
                      );
                    })()}
                    {/* P5/P6:对象信息卡 */}
                    <div className="text-[10px] border rounded p-2 bg-muted/30 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Database className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">类型:</span>
                        <Badge variant="outline" className="text-[9px]">{BUCKET_LABEL[active.bucket]}</Badge>
                        <span className="text-muted-foreground ml-2">持久化:</span>
                        {active.bucket === 'template' ? (
                          <Badge variant="outline" className="text-[9px]">内置(无需保存)</Badge>
                        ) : persistedIdSet.has(active.id) ? (
                          <Badge variant="outline" className="text-[9px] border-status-success/40 text-status-success">已保留 · 刷新可恢复</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] border-muted-foreground/40">未保留</Badge>
                        )}
                        {active.compat && <CompatVerdictBadge verdict={active.compat.verdict} />}
                      </div>
                      {active.bucket !== 'template' && (
                        <div className="text-muted-foreground/80">来源:{active.origin}</div>
                      )}
                      {active.linkedWorkspaceId && (
                        <div className="pt-1 mt-1 border-t border-border/40 flex items-center gap-1.5 flex-wrap">
                          <FolderOpen className="w-3 h-3 text-primary" />
                          <span className="text-muted-foreground">此对象由工作区</span>
                          <span className="font-mono text-foreground">{active.linkedWorkspaceId.slice(0, 8)}…</span>
                          <span className="text-muted-foreground">回链而来</span>
                          <Link to="/playground" className="ml-auto">
                            <Badge variant="outline" className="text-[9px] border-primary/40 text-primary cursor-pointer hover:bg-primary/10">
                              <ExternalLink className="w-2.5 h-2.5 mr-0.5" />
                              {ACTION_LABELS.openInPlayground}
                            </Badge>
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* P6/P7: bundle 导入对象 → 完整 compat reasons 卡 + 详情面板入口 */}
                    {active.bucket === 'user_bundle' && active.compat && (
                      <div className="space-y-2">
                        <CompatReasonsCard verdict={active.compat.verdict} compat={active.compat} />
                        <div className="flex items-center gap-2 flex-wrap">
                          <IncompatibilityDetailsPanel
                            objectName={active.name}
                            verdict={active.compat.verdict}
                            compat={active.compat}
                            origin="showcase"
                          />
                        </div>
                      </div>
                    )}

                    {/* P6: stage 模式被关闭时的专门提示 — 不与治理阻断混淆 */}
                    {result?.profile && !result.profile.enabledModes.includes('stage') && (
                      <ModeUnavailableCard mode="stage" profile={result.profile} modeLabel="阶段流程视图" />
                    )}

                    {oseBlockResults.length > 0 && (
                      <div className="rounded border border-destructive/40 bg-destructive/5 p-2">
                        <div className="text-[11px] font-semibold text-destructive flex items-center gap-1 mb-1">
                          <ShieldX className="w-3 h-3" />OSE block ({oseBlockResults.length})
                        </div>
                        <ul className="text-[10px] font-mono space-y-1 text-destructive/90">
                          {oseBlockResults.slice(0, 5).map((r, i) => (
                            <li key={i} className="flex items-start gap-1.5 flex-wrap">
                              <span>· [{r.policyId}] {r.reason}</span>
                              {r.fixHint && <span className="opacity-70">💡 {r.fixHint}</span>}
                              {r.sourceLocation && (
                                <button
                                  onClick={() => handleJumpToSource(r.sourceLocation!.line, r.sourceLocation!.snippet)}
                                  className="inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded border border-current/40 hover:bg-current/10 text-[10px]"
                                >
                                  L{r.sourceLocation.line}
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {oseWarnResults.length > 0 && (
                      <div className="rounded border border-status-warning/40 bg-status-warning/5 p-2">
                        <div className="text-[11px] font-semibold text-status-warning flex items-center gap-1 mb-1">
                          <ShieldAlert className="w-3 h-3" />OSE warn ({oseWarnResults.length})
                        </div>
                        <ul className="text-[10px] font-mono space-y-0.5 text-status-warning/90">
                          {oseWarnResults.slice(0, 3).map((r, i) => (
                            <li key={i} className="flex items-start gap-1.5 flex-wrap">
                              <span>· [{r.policyId}] {r.reason}</span>
                              {r.sourceLocation && (
                                <button
                                  onClick={() => handleJumpToSource(r.sourceLocation!.line, r.sourceLocation!.snippet)}
                                  className="inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded border border-current/40 hover:bg-current/10 text-[10px]"
                                >
                                  L{r.sourceLocation.line}
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {oseStatus === 'pass' && (
                      <div className="rounded border border-status-success/40 bg-status-success/5 p-2 text-[11px] text-status-success flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />治理层无阻断,无警告
                      </div>
                    )}

                    {blockingHooks.length > 0 && (
                      <div className="text-[10px] text-muted-foreground">
                        <span className="font-medium">spec 当前已启用阻断钩子({blockingHooks.length}):</span>{' '}
                        <span className="font-mono">{blockingHooks.slice(0, 4).join(' · ')}{blockingHooks.length > 4 ? ' …' : ''}</span>
                      </div>
                    )}

                    {enabledModes.length > 0 && (
                      <div className="text-[10px] text-muted-foreground">
                        <span className="font-medium">可用视图模式({enabledModes.length}/8):</span>{' '}
                        <span className="font-mono">{enabledModes.join(' · ')}</span>
                      </div>
                    )}

                    <div className="text-[11px] border-t pt-2">
                      <span className="font-medium">直接结论:</span>{' '}
                      {runnable ? (
                        <span className="text-status-success">流程结构成立、治理放行,可正常运行与展示。</span>
                      ) : result?.error ? (
                        <span className="text-destructive">解析失败 — {result.error}</span>
                      ) : isIncompatible ? (
                        <span className="text-destructive">对象与当前系统版本不兼容,已锁定。</span>
                      ) : oseStatus === 'block' ? (
                        <span className="text-destructive">治理层主动阻断 — 这正是这套系统与普通流程图工具的差异。</span>
                      ) : (
                        <span className="text-muted-foreground">尚未运行,请点击「重新运行」。</span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 导入导出 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      导入 / 导出 / 锁定操作
                    </CardTitle>
                    <CardDescription className="text-[11px]">
                      完整闭环:导入 → 锁定判定 → 运行 → 解释 → 导出
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={handleImportCSLLocal}>
                        <Upload className="w-3 h-3" />导入 .csl
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={handleImportBundleLocal}>
                        <Package className="w-3 h-3" />导入运行包
                      </Button>
                      <Button
                        variant="outline" size="sm" className="text-xs gap-1.5"
                        onClick={handleExportSource}
                        disabled={isIncompatible}
                        title={isIncompatible ? '不兼容对象不得导出' : ''}
                      >
                        <FileDown className="w-3 h-3" />导出 .csl
                      </Button>
                      <Button
                        variant="outline" size="sm" className="text-xs gap-1.5"
                        onClick={handleExportBundle}
                        disabled={isReadOnly || !runnable}
                        title={
                          isIncompatible ? '不兼容对象不得导出'
                          : isReadOnly ? '只读对象不得直接导出当前版本运行包,请先「另存为可编辑」'
                          : !runnable ? '当前流程未通过治理或解析,无法导出' : ''
                        }
                      >
                        <Package className="w-3 h-3" />导出运行包
                      </Button>
                      <Button
                        variant="outline" size="sm" className="text-xs gap-1.5 col-span-2"
                        onClick={handleExportSnapshot}
                        disabled={!result}
                      >
                        <FileDown className="w-3 h-3" />导出诊断快照(JSON)
                      </Button>
                      {isReadOnly && (
                        <Button
                          variant="default" size="sm" className="text-xs gap-1.5 col-span-2"
                          onClick={handleForkToWorkspace}
                          disabled={isIncompatible}
                        >
                          <Copy className="w-3 h-3" />
                          另存为可编辑工作区
                        </Button>
                      )}
                    </div>
                    {isReadOnly && (
                      <div className={`text-[10px] border rounded p-2 flex items-start gap-1.5 ${isIncompatible ? 'text-destructive bg-destructive/5 border-destructive/30' : 'text-status-warning bg-status-warning/5 border-status-warning/30'}`}>
                        <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>
                          {isIncompatible
                            ? '此对象与当前系统版本不兼容。系统真实禁用了源码编辑、运行、运行包/源码导出 — 不是 UI 装饰,而是 lockState=incompatible 在底层强制生效。'
                            : '此对象被标记为只读(模拟从旧版本运行包导入)。系统真实禁用了源码编辑与当前版本运行包导出 — lockState=read_only 在底层强制生效。'}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 差异点 */}
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-primary">
                      <Sparkles className="w-4 h-4" />
                      与普通流程图工具的差异
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 text-[11px] space-y-1.5 text-foreground/80">
                    <div>· 不只看「能不能走」,更展示「为什么能走 / 为什么被拦」并能点击定位源码行</div>
                    <div>· 不只画图,而是绑定 grammar / spec / compiler / ose 四元版本身份</div>
                    <div>· 治理阻断必须可解释:policyId、reason、fixHint、源码定位 — 一应俱全</div>
                    <div>· 锁定真实生效 — read_only / incompatible 对象不能编辑、不能直接出当前版本产物</div>
                    <div>· 用户可现场导入自己的 .csl / 运行包 / 粘贴源码,直接在演示壳内试跑</div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        {/* ============== Tab 2:Compare 壳(任意 1v1) + 三 Demo 对比(预设场景) ============== */}
        <TabsContent value="compare" className="flex-1 m-0 p-0 overflow-auto">
          <CompareShellView
            pool={sortedComparePool}
            sourceId={compareSourceId}
            targetId={compareTargetId}
            onPickSource={setCompareSourceId}
            onPickTarget={setCompareTargetId}
            onClear={() => { setCompareSourceId(null); setCompareTargetId(null); }}
            onJumpToRun={(id) => { setActiveId(id); setShellTab('run'); }}
            getSource={(id) => allDemos.find(d => d.id === id)?.code ?? null}
            onOpenViewer={(id) => openViewerFor(id, 'compare')}
          />
          <div className="border-t mt-2">
            <DemoCompareView onPickRun={(id) => { setActiveId(id); setShellTab('run'); }} />
          </div>
        </TabsContent>
      </Tabs>

      {/* 页脚 */}
      <footer className="px-6 py-2 border-t bg-card text-[10px] text-muted-foreground flex items-center gap-3 flex-wrap">
        <span>CSL + OSE · Phase P6 · 阶段流程引擎演示壳 · 与工作区并轨</span>
        <span>·</span>
        <span>当前系统:grammar {stamps.grammarVersion} / spec v{stamps.specVersion} / compiler {stamps.compilerVersion} / ose v{stamps.osePolicyVersion}</span>
      </footer>

      {/* 返回顶部 */}
      {showBackTop && (
        <button
          onClick={backToTop}
          className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all"
          title="返回顶部"
        >
          <ArrowUpToLine className="w-4 h-4" />
        </button>
      )}

      {/* 粘贴源码对话框 */}
      <Dialog open={pasteOpen} onOpenChange={setPasteOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>粘贴 CSL 源码现场试跑</DialogTitle>
            <DialogDescription className="text-xs">
              直接粘贴一段最小 CSL,演示壳会创建临时对象并立即运行,不写入工作区。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">语法版本:</span>
              <Button variant={pasteVersion === 'v0.8' ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => setPasteVersion('v0.8')}>v0.8</Button>
              <Button variant={pasteVersion === 'v0.9' ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => setPasteVersion('v0.9')}>v0.9</Button>
            </div>
            <Textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={`// 例:\n主权阶段 借权 { 序号 = 2 }\n主权阶段 摄权 { 序号 = 6 }\n阶段转移 借到摄 { 从 借权 到 摄权 触发 边界感 > 50 }\n主体 试跑主体 { 当前阶段 = 借权, 边界感 = 80 }`}
              className="font-mono text-xs min-h-[200px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasteOpen(false)}>取消</Button>
            <Button onClick={handlePasteSubmit}>试跑</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =====================================================================
// 三 Demo 对比视图
// =====================================================================

interface CompareRow {
  template: StageDemoTemplate;
  result: CSLResult;
  oseStatus: OseStatus;
}

function DemoCompareView({ onPickRun }: { onPickRun: (id: string) => void }) {
  const rows = useMemo<CompareRow[]>(() => {
    return STAGE_DEMO_TEMPLATES.map(t => {
      const result = runCSL(t.code, t.version);
      return { template: t, result, oseStatus: deriveOseStatus(result) };
    });
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Columns3 className="w-4 h-4 text-primary" />
        <h2 className="text-base font-semibold">三 Demo 对比 — 一眼看清差异</h2>
        <Badge variant="secondary" className="text-[10px] font-mono">P4</Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        三种典型场景并列。所有字段都来自真实 runCSL 输出,而非静态文案。
      </p>

      {/* 三列卡片 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {rows.map(({ template, result, oseStatus }) => {
          const meta = OSE_STATUS_META[oseStatus];
          const adv = result.stageAdvancements ?? [];
          const govBlocked = adv.some(a => a.halt_reason === 'governance_blocked');
          const haltReasons = adv.map(a => a.halt_reason);
          const candidatesTotal = adv.reduce((n, a) => n + a.candidates.length, 0);
          const readyCount = adv.reduce((n, a) => n + a.candidates.filter(c => c.verdict === 'ready' || c.verdict === 'open').length, 0);
          const blockedCount = candidatesTotal - readyCount;
          const lock = template.simulateReadOnly ? 'read_only' : 'editable';
          const runnable = !result.error && !!result.ir && oseStatus !== 'block';
          const canExportBundle = lock === 'editable' && runnable;
          return (
            <Card key={template.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm">{template.name}</CardTitle>
                  <Badge variant="outline" className="text-[10px] font-mono">{template.version}</Badge>
                </div>
                <CardDescription className="text-[11px]">{template.tagline}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs flex-1">
                <CompareRowItem label="OSE 总状态" >
                  <Badge variant="outline" className={`text-[10px] flex items-center gap-1 ${meta.cls}`}>
                    <meta.Icon className="w-3 h-3" />{meta.label}
                  </Badge>
                </CompareRowItem>
                <CompareRowItem label="可运行">
                  {runnable ? (
                    <Badge variant="outline" className="text-[10px] border-status-success/40 text-status-success bg-status-success/5">是</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive bg-destructive/5">否</Badge>
                  )}
                </CompareRowItem>
                <CompareRowItem label="lockState">
                  {lock === 'editable' ? (
                    <Badge variant="outline" className="text-[10px] border-status-success/40 text-status-success">editable</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] border-status-warning/40 text-status-warning flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />{lock}
                    </Badge>
                  )}
                </CompareRowItem>
                <CompareRowItem label="halt_reason">
                  <span className="font-mono text-[10px]">
                    {haltReasons.length === 0 ? '—' : haltReasons.join(' / ')}
                  </span>
                </CompareRowItem>
                <CompareRowItem label="候选转移">
                  <span className="font-mono text-[10px]">
                    {candidatesTotal} 总 · <span className="text-status-success">{readyCount} 可推</span> · <span className="text-destructive">{blockedCount} 阻</span>
                  </span>
                </CompareRowItem>
                <CompareRowItem label="治理阻断">
                  {govBlocked ? (
                    <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive flex items-center gap-1">
                      <ShieldX className="w-2.5 h-2.5" />存在
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] border-status-success/40 text-status-success">无</Badge>
                  )}
                </CompareRowItem>
                <CompareRowItem label="允许编辑">
                  {lock === 'editable' ? (
                    <Badge variant="outline" className="text-[10px] border-status-success/40 text-status-success">是</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] border-status-warning/40 text-status-warning">否</Badge>
                  )}
                </CompareRowItem>
                <CompareRowItem label="允许导出 bundle">
                  {canExportBundle ? (
                    <Badge variant="outline" className="text-[10px] border-status-success/40 text-status-success">是</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">否</Badge>
                  )}
                </CompareRowItem>

                <div className="border-t pt-2 mt-2">
                  <div className="text-[10px] text-muted-foreground mb-1">主要 OSE 阻断:</div>
                  {(() => {
                    const blocks = flattenOseReport(result.oseReport).filter(r => r.severity === 'block');
                    if (blocks.length === 0) return <div className="text-[10px] text-muted-foreground italic">无</div>;
                    return (
                      <ul className="text-[10px] font-mono space-y-0.5 text-destructive">
                        {blocks.slice(0, 2).map((b, i) => (
                          <li key={i}>· [{b.policyId}]</li>
                        ))}
                      </ul>
                    );
                  })()}
                </div>
              </CardContent>
              <div className="px-6 pb-4">
                <Button variant="outline" size="sm" className="w-full text-xs gap-1.5" onClick={() => onPickRun(template.id)}>
                  <ArrowRight className="w-3 h-3" />到「现场试跑」查看详情
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 总结表 */}
      <Card className="bg-muted/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">外部用户该看到的差异</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-1 text-muted-foreground">
          <div>· <span className="text-foreground font-medium">A</span>:结构成立 · 治理放行 · 可推进 · 可导出 — 普通流程工具也能做</div>
          <div>· <span className="text-foreground font-medium">B</span>:结构表面成立 · 治理拒绝 · 阻断带 policyId/reason/fixHint/源码行 — 普通流程工具不会拒绝你</div>
          <div>· <span className="text-foreground font-medium">C</span>:可看可解释 · 不可改不可重出 — 版本指纹强制生效,普通流程工具没有这个机制</div>
        </CardContent>
      </Card>
    </div>
  );
}

function CompareRowItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1 border-b border-border/40 last:border-b-0">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <div>{children}</div>
    </div>
  );
}
