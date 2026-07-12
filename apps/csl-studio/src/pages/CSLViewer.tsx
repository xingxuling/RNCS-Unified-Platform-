// CSLViewer — P8
// 独立的「只读 Viewer 壳」。定位:对象的纯审阅视图。
//
// 入口:
//   /viewer?object=<showcaseDemoId>           — 查看演示壳模板/用户对象
//   /viewer?ws=<workspaceId>                  — 查看正式工作区(无视 lockState 都按只读)
//   /viewer?from=compare&object=<id>          — 从 Compare 视图打开某一侧
//   /viewer?from=recent&object=<id>           — 从 recent 恢复
//
// 行为纪律:
//   - 不允许编辑(编辑器 readOnly + 无写回入口)
//   - 不允许任何「修改对象本身」的操作(导出诊断/源码 OK,导出运行包要求 lockState=editable)
//   - 允许:跳源码、看 incompatibility 详情、转去 Compare、转回 Showcase、转入工作区(按 lockState 规则)

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Eye, Code2, ArrowLeft, ExternalLink, Cpu, Layers, Sparkles, FileDown, Save,
  ShieldCheck, ShieldAlert, ShieldX, Lock, Columns3, FlaskConical, FolderOpen,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { runCSL, type CSLResult, type GrammarVersion } from '@/csl';
import { currentStamps, type VersionStamps } from '@/csl/version-stamps';
import {
  loadWorkspace, createWorkspace, setActiveWorkspace, buildSnapshotFromResult,
  buildCSLFileText, downloadCSLFile, type Workspace,
} from '@/csl/workspace';
import type { CompatCheckResult } from '@/csl/workspace/compat';
import { STAGE_DEMO_TEMPLATES } from '@/csl/stage-demo-templates';
import { ObjectStatusBar, type LockKind, type ObjectBucket, type OseStatus } from '@/components/csl/ObjectStatusBar';
import { IncompatibilityDetailsPanel } from '@/components/csl/IncompatibilityDetailsPanel';
import { HighlightedEditor } from '@/components/csl/HighlightedEditor';
import { ACTIONS } from '@/csl/ui/action-labels';
import { ShellActionBar } from '@/components/csl/ShellActionBar';
import { saveViewerState, loadViewerState, deriveRestoreParams, makeObjectKey, type ViewerFrom } from '@/csl/ui/viewer-state';
import { toStatusBarProps, type ObjectShellState } from '@/csl/ui/object-shell-state';
import { L2SummaryPanel } from '@/components/csl/L2SummaryPanel';
import { isLikelyL2Source, type MainlineNameIndex } from '@/csl/lab/l2';

// 复用 showcase 持久化 schema(只读取,不写入)
interface UserDemoLite {
  id: string; name: string;
  bucket: 'template' | 'user_csl' | 'user_bundle' | 'user_paste';
  version: GrammarVersion;
  code: string;
  lockState: LockKind;
  origin: string;
  compat?: CompatCheckResult;
  importedStamps?: VersionStamps;
  linkedWorkspaceId?: string;
}
const STORAGE_KEY_DEMOS = 'csl:showcase:user_demos';
function loadUserDemos(): UserDemoLite[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DEMOS);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

interface ViewerObject {
  id: string;
  name: string;
  bucket: ObjectBucket;
  version: GrammarVersion;
  source: string;
  lockState: LockKind;
  origin: string;
  compat?: CompatCheckResult;
  importedStamps?: VersionStamps;
  /** 来源:用于决定"返回到哪里" */
  fromShell: 'showcase' | 'workspace' | 'compare' | 'recent' | 'direct';
  /** 若来自工作区,记录 ws id,可走 /playground */
  workspaceId?: string;
}

function deriveOseStatus(result: CSLResult | null): OseStatus {
  if (!result) return 'unknown';
  if (result.error) return 'block';
  if (result.oseVerdict?.blocked) return 'block';
  return 'pass';
}

const OSE_META: Record<OseStatus, { label: string; cls: string; Icon: typeof ShieldCheck }> = {
  pass:    { label: 'OSE pass',    cls: 'border-status-success/40 text-status-success bg-status-success/5', Icon: ShieldCheck },
  warn:    { label: 'OSE warn',    cls: 'border-status-warning/40 text-status-warning bg-status-warning/5', Icon: ShieldAlert },
  block:   { label: 'OSE block',   cls: 'border-destructive/40 text-destructive bg-destructive/5',          Icon: ShieldX },
  unknown: { label: 'OSE 未运行',  cls: 'border-border text-muted-foreground bg-muted/40',                    Icon: ShieldAlert },
};

export default function CSLViewer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [obj, setObj] = useState<ViewerObject | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // P12 — compat 详情面板受控开关 (与 viewer-state.compatPanelOpen 联动)
  const [compatOpen, setCompatOpen] = useState(false);
  // P12 — 标记是否需要在对象加载完成后恢复 scroll / compatPanelOpen
  const [pendingRestore, setPendingRestore] = useState<{
    scrollY?: number; compatPanelOpen?: boolean;
  } | null>(null);

  // 解析 URL → 加载对象;P12: URL 缺参数时尝试从 viewer-state 恢复
  useEffect(() => {
    const wsId = searchParams.get('ws');
    const objectId = searchParams.get('object');
    const from = (searchParams.get('from') as ViewerObject['fromShell']) ?? 'direct';

    // P12 — 没有任何对象参数 → 尝试 viewer-state 恢复
    if (!wsId && !objectId) {
      const persisted = loadViewerState();
      if (persisted) {
        const params = deriveRestoreParams(persisted);
        if (params) {
          // 记下后续要恢复的 scroll / compatPanelOpen
          setPendingRestore({
            scrollY: persisted.scrollY,
            compatPanelOpen: persisted.compatPanelOpen,
          });
          // 用 replace 避免污染浏览器历史
          const qs = new URLSearchParams(params).toString();
          navigate(`/viewer?${qs}`, { replace: true });
          return;
        }
      }
      setLoadError('未指定 object 或 ws 参数');
      return;
    }

    if (wsId) {
      const w = loadWorkspace(wsId);
      if (!w) { setLoadError(`工作区不存在或已被删除:${wsId}`); return; }
      const lock: LockKind = (w.lockState as LockKind) ?? 'editable';
      const compat: CompatCheckResult | undefined = w.origin?.compatVerdict
        ? {
            verdict: w.origin.compatVerdict,
            reasons: w.origin.compatReasons ?? [],
            primaryHint: w.origin.primaryHint ?? '',
            current: currentStamps(w.cslVersion),
            imported: (w.origin.importedStamps ?? currentStamps(w.cslVersion)) as VersionStamps,
          }
        : undefined;
      setObj({
        id: 'ws_' + w.id,
        name: w.name,
        bucket: w.origin?.kind === 'imported_bundle' ? 'user_bundle'
              : w.origin?.kind === 'imported_csl' ? 'user_csl'
              : 'workspace',
        version: w.cslVersion,
        source: w.source,
        lockState: lock,
        origin: w.origin?.sourceLabel ?? '本地工作区',
        compat,
        importedStamps: w.origin?.importedStamps,
        fromShell: from === 'direct' ? 'workspace' : from,
        workspaceId: w.id,
      });
      return;
    }

    if (objectId) {
      // 1) 内置模板
      const tpl = STAGE_DEMO_TEMPLATES.find(t => t.id === objectId);
      if (tpl) {
        setObj({
          id: tpl.id, name: tpl.name,
          bucket: 'template', version: tpl.version, source: tpl.code,
          lockState: tpl.simulateReadOnly ? 'read_only' : 'editable',
          origin: '内置演示模板',
          fromShell: from === 'direct' ? 'showcase' : from,
        });
        return;
      }
      // 2) showcase 用户对象
      const u = loadUserDemos().find(d => d.id === objectId);
      if (u) {
        setObj({
          id: u.id, name: u.name,
          bucket: u.bucket, version: u.version, source: u.code,
          lockState: u.lockState,
          origin: u.origin,
          compat: u.compat,
          importedStamps: u.importedStamps,
          fromShell: from === 'direct' ? 'showcase' : from,
          workspaceId: u.linkedWorkspaceId,
        });
        return;
      }
      setLoadError(`未找到对象:${objectId}`);
      // P12 — 安全降级:viewer-state 指向已失效对象时,清掉 pendingRestore,避免错误循环
      setPendingRestore(null);
      return;
    }
  }, [searchParams, navigate]);

  // P12 — 对象加载成功后,执行 pendingRestore (scrollY / compatPanelOpen)
  useEffect(() => {
    if (!obj || !pendingRestore) return;
    if (typeof pendingRestore.scrollY === 'number' && typeof window !== 'undefined') {
      // 等下一帧,等编辑器/面板挂上来
      requestAnimationFrame(() => window.scrollTo(0, pendingRestore.scrollY!));
    }
    if (pendingRestore.compatPanelOpen && obj.compat && obj.compat.verdict !== 'compatible') {
      setCompatOpen(true);
    }
    setPendingRestore(null);
  }, [obj, pendingRestore]);

  // P11/P12 — Viewer 状态持久化:obj / compatOpen 任一变化时刷新
  useEffect(() => {
    if (!obj) return;
    const key = obj.workspaceId
      ? makeObjectKey('ws', obj.workspaceId)
      : makeObjectKey('object', obj.id);
    saveViewerState({
      lastObjectKey: key,
      from: obj.fromShell as ViewerFrom,
      scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
      compatPanelOpen: compatOpen,
    });
  }, [obj, compatOpen]);

  // 运行结果(只读 — 不写回任何对象)
  const result = useMemo<CSLResult | null>(() => {
    if (!obj) return null;
    if (obj.lockState === 'incompatible') return null;
    return runCSL(obj.source, obj.version);
  }, [obj]);
  const oseStatus = deriveOseStatus(result);
  const oseMeta = OSE_META[oseStatus];
  const stamps = obj ? currentStamps(obj.version) : null;
  const enabledModes = result?.profile?.enabledModes ?? [];

  // P14 — L2 弱绑定:从主线 IR 抽出已知名字集合,供 L2 影子审阅引用解析
  const mainlineIndex = useMemo<MainlineNameIndex>(() => {
    const ir = result?.ir;
    const concepts = (ir?.concepts ?? []).map(c => c.name);
    const subjects = (ir?.subjects ?? []).map(s => s.name);
    const stages = (ir?.stages ?? []).map(s => s.name);
    const names = new Set<string>([...concepts, ...subjects, ...stages]);
    return { names, byCategory: { concepts, subjects, stages } };
  }, [result]);
  const showL2 = !!obj && isLikelyL2Source(obj.source);

  // 动作:转入工作区(按 lockState 规则)
  const handleConvertToWorkspace = () => {
    if (!obj) return;
    const lockForWs = obj.lockState === 'incompatible' ? 'read_only' : obj.lockState;
    const w = createWorkspace({
      name: `${obj.name} · 自 Viewer 转入`,
      cslVersion: obj.version,
      source: obj.source,
      lockState: lockForWs,
      origin: {
        kind: obj.bucket === 'user_bundle' ? 'imported_bundle'
            : obj.bucket === 'user_csl' ? 'imported_csl'
            : 'local',
        sourceLabel: `[from_viewer:${obj.id}] ${obj.origin}`,
        importedAt: new Date().toISOString(),
        compatVerdict: obj.compat?.verdict,
        compatReasons: obj.compat?.reasons,
        primaryHint: obj.compat?.primaryHint,
        importedStamps: obj.importedStamps,
      },
    });
    setActiveWorkspace(w.id);
    toast({
      title: `已${ACTIONS.convertToWorkspace}`,
      description: `${w.name}(${lockForWs}) · ${ACTIONS.openInPlayground}`,
    });
  };

  const handleExportSource = () => {
    if (!obj) return;
    if (obj.lockState === 'incompatible') {
      toast({ title: '不兼容对象不得导出', variant: 'destructive' });
      return;
    }
    const text = buildCSLFileText({
      source: obj.source, cslVersion: obj.version, workspaceName: obj.name,
    });
    downloadCSLFile(`${obj.id}.csl`, text);
    toast({ title: `已${ACTIONS.exportSource}` });
  };

  const handleExportSnapshot = () => {
    if (!obj || !result) return;
    const snap = buildSnapshotFromResult('viewer_' + obj.id, obj.source, obj.version, result, 'manual');
    const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${obj.id}-snapshot.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `已${ACTIONS.exportSnapshot}` });
  };

  if (loadError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldX className="w-4 h-4 text-destructive" />Viewer 无法加载对象
            </CardTitle>
            <CardDescription>{loadError}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" onClick={() => navigate('/')} className="gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />返回演示壳
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!obj || !stamps) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">
        正在加载…
      </div>
    );
  }

  const backHref =
    obj.fromShell === 'workspace' ? '/playground'
    : obj.fromShell === 'compare' ? '/?shell=compare'
    : '/';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 顶栏 */}
      <header className="px-6 py-3 border-b bg-card flex items-center gap-3 flex-wrap">
        <Eye className="w-5 h-5 text-status-warning" />
        <h1 className="text-base font-semibold">Viewer · 只读审阅</h1>
        <Badge variant="secondary" className="text-xs font-mono">P8</Badge>
        <Badge variant="outline" className="text-[10px] gap-1 border-status-warning/40 text-status-warning bg-status-warning/5">
          <Lock className="w-3 h-3" />严格只读 — 编辑/运行修改/直接导出运行包均被禁用
        </Badge>
        <div className="ml-auto flex items-center gap-2">
          <Link to={backHref}>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />返回{obj.fromShell === 'workspace' ? ' Playground' : obj.fromShell === 'compare' ? ' Compare' : '演示壳'}
            </Button>
          </Link>
        </div>
      </header>

      {/* 状态条 — P12: 统一走 toStatusBarProps;compat 详情面板受控,与 viewer-state 联动 */}
      <section className="px-6 py-3 border-b bg-card flex items-center gap-3 flex-wrap">
        {(() => {
          const state: ObjectShellState = {
            objectId: obj.id,
            objectName: obj.name,
            bucket: obj.bucket,
            lockState: obj.lockState,
            oseStatus,
            compat: obj.compat?.verdict,
            version: obj.version,
            shellMode: 'viewer',
            hasWorkspace: !!obj.workspaceId,
          };
          return <ObjectStatusBar {...toStatusBarProps(state)} />;
        })()}
        {obj.compat && obj.compat.verdict !== 'compatible' && (
          <IncompatibilityDetailsPanel
            objectName={obj.name}
            verdict={obj.compat.verdict}
            compat={obj.compat}
            origin="viewer"
            open={compatOpen}
            onOpenChange={setCompatOpen}
          />
        )}
      </section>

      {/* 版本身份 */}
      <section className="px-6 py-2 border-b bg-muted/20 flex items-center gap-2 flex-wrap text-[11px]">
        <span className="text-muted-foreground">版本身份:</span>
        <Badge variant="outline" className="font-mono text-[10px]">grammar={stamps.grammarVersion}</Badge>
        <Badge variant="outline" className="font-mono text-[10px]">spec=v{stamps.specVersion}</Badge>
        <Badge variant="outline" className="font-mono text-[10px]">compiler={stamps.compilerVersion}</Badge>
        <Badge variant="outline" className="font-mono text-[10px]">ose=v{stamps.osePolicyVersion}</Badge>

        <span className="text-muted-foreground ml-2">治理:</span>
        <Badge variant="outline" className={`text-[10px] flex items-center gap-1 ${oseMeta.cls}`}>
          <oseMeta.Icon className="w-3 h-3" />{oseMeta.label}
        </Badge>

        <span className="text-muted-foreground ml-2">可用 mode:</span>
        <span className="font-mono text-[10px] text-foreground">
          {enabledModes.length}/8 {enabledModes.length > 0 && `· ${enabledModes.slice(0, 4).join(' · ')}${enabledModes.length > 4 ? ' …' : ''}`}
        </span>

        <span className="text-muted-foreground ml-2">来源:</span>
        <span className="text-[10px] truncate max-w-[300px]" title={obj.origin}>{obj.origin}</span>
      </section>

      {/* 主体 */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0">
        {/* 左:只读源码 */}
        <div className="flex flex-col border-r min-h-[420px]">
          <div className="px-4 py-2 text-xs font-medium text-muted-foreground bg-panel-header border-b flex items-center gap-2">
            <Code2 className="w-3.5 h-3.5" />
            CSL 源码(只读)
            <Badge variant="outline" className="text-[9px] ml-1 gap-1 border-status-warning/40 text-status-warning">
              <Lock className="w-2.5 h-2.5" />readOnly
            </Badge>
            <span className="ml-auto text-[10px]">{obj.source.split('\n').length} 行</span>
          </div>
          <div className="flex-1 relative">
            <HighlightedEditor
              value={obj.source}
              onChange={() => { /* 严格只读 — 忽略任何回写 */ }}
              readOnly
            />
          </div>
        </div>

        {/* 右:摘要面板 */}
        <ScrollArea className="min-h-[420px]">
          <div className="p-4 space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />关键诊断摘要
                </CardTitle>
                <CardDescription className="text-[11px]">
                  Viewer 只展示已成立的事实,不重跑、不修改、不写回。
                </CardDescription>
              </CardHeader>
              <CardContent className="text-[11px] space-y-2">
                {obj.lockState === 'incompatible' ? (
                  <div className="text-destructive">
                    对象与当前系统版本不兼容 — Viewer 不会重新运行此对象,仅展示元信息与 compat 详情。
                  </div>
                ) : !result ? (
                  <div className="text-muted-foreground">尚未运行</div>
                ) : result.error ? (
                  <div className="text-destructive">解析失败:{result.error}</div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      <Stat label="主体" value={result.ir?.subjects.length ?? 0} />
                      <Stat label="主权阶段" value={result.ir?.stages.length ?? 0} />
                      <Stat label="阶段转移" value={result.ir?.transitions.length ?? 0} />
                    </div>
                    {result.oseVerdict?.blocked && (
                      <div className="rounded border border-destructive/40 bg-destructive/5 p-2 text-destructive text-[11px]">
                        OSE 治理阻断成立 — 查看 OSE 详情请去演示壳现场试跑或 Playground。
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* P14 — L2 影子审阅(仅在源码识别为 L2 时出现) */}
            {showL2 && (
              <L2SummaryPanel source={obj.source} mainlineIndex={mainlineIndex} />
            )}

            {/* 跨壳层动作 — 统一工具栏 (P10) */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />可用动作
                </CardTitle>
                <CardDescription className="text-[11px]">
                  Viewer 不允许编辑或写回。所有动作都是「带走 / 转入新位置」,不会修改当前对象。
                  灰色按钮表示该动作在当前壳层 / 锁状态 / 兼容性下不可用 — 鼠标悬停可见原因。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-[11px]">
                <ShellActionBar
                  ctx={{
                    shellMode: 'viewer',
                    lockState: obj.lockState,
                    compat: obj.compat?.verdict,
                    oseStatus,
                    hasWorkspace: !!obj.workspaceId,
                  }}
                  actions={[
                    'convertToWorkspace',
                    'openInCompareSrc',
                    'backToShowcase',
                    'openInPlayground',
                    'exportSource',
                    'exportSnapshot',
                    'exportBundle',
                  ]}
                  handlers={{
                    convertToWorkspace: handleConvertToWorkspace,
                    openInCompareSrc: () => navigate(`/?shell=compare&compareSource=${encodeURIComponent(obj.id)}`),
                    backToShowcase: () => navigate(`/?shell=run&object=${encodeURIComponent(obj.id)}`),
                    openInPlayground: obj.workspaceId ? () => navigate('/playground') : undefined,
                    exportSource: handleExportSource,
                    exportSnapshot: result ? handleExportSnapshot : undefined,
                    // exportBundle 故意不接 handler — Viewer 永远不允许
                  }}
                />
                <div className="text-[10px] text-muted-foreground border-t pt-1 mt-1 space-y-0.5">
                  <div>· 编辑源码:Viewer 内永远拒绝(<code className="font-mono">readOnly</code> 真生效)</div>
                  <div>· 导出当前版本运行包:Viewer 不提供 — 需要先转入正式工作区</div>
                  <div>· 运行修改:Viewer 内点击运行只为派生 OSE 摘要,不写回任何对象</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border p-2 bg-muted/30">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="font-mono text-base">{value}</div>
    </div>
  );
}
