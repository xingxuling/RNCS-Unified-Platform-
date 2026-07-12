// CompareShellView — P7
// Compare 壳最小落地:对象级字段差异总览。
//
// 设计要点:
//   - 不做源码逐行 diff,先稳定「对象级字段」对照
//   - 至少展示:name / bucket / version / 四元 stamps / lockState / compat / OSE / enabledModes / 可编辑/运行/导出
//   - 行级:相同 vs 不同 vs 行为相关差异 vs 元信息差异 — 用颜色区分
//   - incompatible 对象仍可在此查看详情(IncompatibilityDetailsPanel)

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Columns3, ShieldCheck, ShieldAlert, ShieldX, Lock, Equal, Diff, X, FileDown, Eye } from 'lucide-react';
import { ObjectStatusBar, type ObjectBucket, type LockKind, type OseStatus } from './ObjectStatusBar';
import { toStatusBarProps, type ObjectShellState } from '@/csl/ui/object-shell-state';
import { IncompatibilityDetailsPanel } from './IncompatibilityDetailsPanel';
import { SourceDiffPanel } from './SourceDiffPanel';
import { ShellActionBar } from './ShellActionBar';
import { L2ComparePanel } from './L2ComparePanel';
import { isLikelyL2Source } from '@/csl/lab/l2';
import { ACTIONS } from '@/csl/ui/action-labels';
import { buildCompareReport, downloadCompareReport, type CompareReportFieldRow } from '@/csl/ui/compare-report';
import { toast } from '@/hooks/use-toast';
import type { CompatCheckResult, CompatVerdict } from '@/csl/workspace/compat';
import type { VersionStamps } from '@/csl/version-stamps';
import type { GrammarVersion } from '@/csl';

/** 用于比较的统一对象描述 — 任何壳层都可以拍平成这个结构 */
export interface ComparableObject {
  id: string;
  name: string;
  bucket: ObjectBucket;
  version: GrammarVersion;
  stamps: VersionStamps;
  lockState: LockKind;
  oseStatus: OseStatus;
  compat?: CompatCheckResult;
  enabledModes: string[];
  /** 派生的行为允许 */
  canEdit: boolean;
  canRun: boolean;
  canExportBundle: boolean;
}

interface Props {
  /** 候选池,用户可在两侧下拉切换(此处用按钮列表) */
  pool: ComparableObject[];
  sourceId: string | null;
  targetId: string | null;
  onPickSource: (id: string) => void;
  onPickTarget: (id: string) => void;
  onClear: () => void;
  /** 跳转到现场试跑某对象 */
  onJumpToRun?: (id: string) => void;
  /** P8: 取对象源码,用于源码 diff / 报告导出。返回 null 时跳过相关功能 */
  getSource?: (id: string) => string | null;
  /** P8: 打开 Viewer 壳查看某对象 */
  onOpenViewer?: (id: string) => void;
}

type DiffKind = 'same' | 'behavior' | 'meta';

interface FieldRow {
  key: string;
  label: string;
  /** 此字段的差异是否影响行为(如 lockState/版本/oseStatus 影响运行) */
  behavior: boolean;
  render: (o: ComparableObject) => React.ReactNode;
  raw: (o: ComparableObject) => string;
}

const FIELDS: FieldRow[] = [
  { key: 'name',     label: '对象名',          behavior: false, raw: o => o.name,                render: o => <span className="font-mono text-[11px]">{o.name}</span> },
  { key: 'bucket',   label: '对象类型',        behavior: false, raw: o => o.bucket,              render: o => <Badge variant="outline" className="text-[10px]">{o.bucket}</Badge> },
  { key: 'version',  label: 'CSL 版本',        behavior: true,  raw: o => o.version,             render: o => <Badge variant="outline" className="text-[10px] font-mono">{o.version}</Badge> },
  { key: 'grammar',  label: 'grammarVersion',  behavior: true,  raw: o => o.stamps.grammarVersion, render: o => <span className="font-mono text-[10px]">{o.stamps.grammarVersion}</span> },
  { key: 'spec',     label: 'specVersion',     behavior: true,  raw: o => `v${o.stamps.specVersion}`, render: o => <span className="font-mono text-[10px]">v{o.stamps.specVersion}</span> },
  { key: 'compiler', label: 'compilerVersion', behavior: true,  raw: o => o.stamps.compilerVersion, render: o => <span className="font-mono text-[10px]">{o.stamps.compilerVersion}</span> },
  { key: 'ose',      label: 'osePolicyVersion',behavior: true,  raw: o => `v${o.stamps.osePolicyVersion}`, render: o => <span className="font-mono text-[10px]">v{o.stamps.osePolicyVersion}</span> },
  { key: 'lockState',label: 'lockState',       behavior: true,  raw: o => o.lockState,           render: o => <LockBadge lock={o.lockState} /> },
  { key: 'compat',   label: 'compat verdict',  behavior: true,  raw: o => o.compat?.verdict ?? '—', render: o => o.compat ? <CompatBadge v={o.compat.verdict} /> : <span className="text-muted-foreground text-[10px]">—</span> },
  { key: 'ose_status', label: 'OSE status',    behavior: true,  raw: o => o.oseStatus,           render: o => <OseBadge s={o.oseStatus} /> },
  { key: 'enabledModes', label: 'enabledModes',behavior: true,  raw: o => o.enabledModes.slice().sort().join(','), render: o => <span className="font-mono text-[10px]">{o.enabledModes.length}/8 · {o.enabledModes.slice(0,3).join(' · ')}{o.enabledModes.length>3?' …':''}</span> },
  { key: 'canEdit',  label: '允许编辑',        behavior: true,  raw: o => String(o.canEdit),     render: o => <YesNo v={o.canEdit} /> },
  { key: 'canRun',   label: '允许运行',        behavior: true,  raw: o => String(o.canRun),      render: o => <YesNo v={o.canRun} /> },
  { key: 'canExportBundle', label: '允许导出 bundle', behavior: true, raw: o => String(o.canExportBundle), render: o => <YesNo v={o.canExportBundle} /> },
];

function LockBadge({ lock }: { lock: LockKind }) {
  const cls =
    lock === 'editable' ? 'border-status-success/40 text-status-success'
    : lock === 'incompatible' ? 'border-destructive/40 text-destructive'
    : 'border-status-warning/40 text-status-warning';
  return <Badge variant="outline" className={`text-[10px] font-mono ${cls}`}>{lock}</Badge>;
}
function CompatBadge({ v }: { v: CompatVerdict }) {
  const cls =
    v === 'compatible' ? 'border-status-success/40 text-status-success'
    : v === 'incompatible' ? 'border-destructive/40 text-destructive'
    : 'border-status-warning/40 text-status-warning';
  return <Badge variant="outline" className={`text-[10px] font-mono ${cls}`}>{v}</Badge>;
}
function OseBadge({ s }: { s: OseStatus }) {
  const I = s === 'pass' ? ShieldCheck : s === 'warn' ? ShieldAlert : s === 'block' ? ShieldX : ShieldAlert;
  const cls =
    s === 'pass' ? 'border-status-success/40 text-status-success'
    : s === 'warn' ? 'border-status-warning/40 text-status-warning'
    : s === 'block' ? 'border-destructive/40 text-destructive'
    : 'border-border text-muted-foreground';
  return <Badge variant="outline" className={`text-[10px] gap-1 ${cls}`}><I className="w-2.5 h-2.5" />{s}</Badge>;
}
function YesNo({ v }: { v: boolean }) {
  return v
    ? <Badge variant="outline" className="text-[10px] border-status-success/40 text-status-success">是</Badge>
    : <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">否</Badge>;
}

export function CompareShellView({
  pool, sourceId, targetId, onPickSource, onPickTarget, onClear, onJumpToRun, getSource, onOpenViewer,
}: Props) {
  const source = useMemo(() => pool.find(o => o.id === sourceId) ?? null, [pool, sourceId]);
  const target = useMemo(() => pool.find(o => o.id === targetId) ?? null, [pool, targetId]);

  const rows = useMemo(() => {
    if (!source || !target) return [];
    return FIELDS.map(f => {
      const a = f.raw(source);
      const b = f.raw(target);
      const same = a === b;
      const kind: DiffKind = same ? 'same' : (f.behavior ? 'behavior' : 'meta');
      return { f, kind };
    });
  }, [source, target]);

  const counts = useMemo(() => {
    let same = 0, behavior = 0, meta = 0;
    for (const r of rows) {
      if (r.kind === 'same') same++;
      else if (r.kind === 'behavior') behavior++;
      else meta++;
    }
    return { same, behavior, meta };
  }, [rows]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Columns3 className="w-4 h-4 text-primary" />
        <h2 className="text-base font-semibold">Compare 壳 — 对象级字段差异总览</h2>
        <Badge variant="secondary" className="text-[10px] font-mono">P11</Badge>
        <Button variant="ghost" size="sm" onClick={onClear} className="ml-auto h-7 text-xs gap-1">
          <X className="w-3 h-3" />清除对比
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        从候选池中选择两个对象,系统会逐字段对照。
        <span className="text-status-success ml-1">绿:相同</span> ·
        <span className="text-destructive ml-1">红:行为相关差异</span> ·
        <span className="text-status-warning ml-1">黄:仅元信息差异</span>。
        Compare 视图本身不运行任何对象,只读不写。
      </p>

      {/* P11 — 壳层统一动作行 (compare 壳整体可用动作)
          在选定 source/target 之前,只暴露"返回演示壳"等不依赖选定对象的动作。
          exportCompareJSON 仅在两侧均已选时启用 — 通过 lockState 不区分,在表格区另有按钮。 */}
      <ShellActionBar
        ctx={{
          shellMode: 'compare',
          lockState: 'editable',
          compat: 'compatible',
          hasWorkspace: false,
        }}
        actions={['backToShowcase']}
        handlers={{ backToShowcase: onClear }}
      />

      {/* 双栏选择器 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <PickerColumn title="对比源 (source)" tag="A" pool={pool} pickedId={sourceId} otherId={targetId} onPick={onPickSource} />
        <PickerColumn title="对比目标 (target)" tag="B" pool={pool} pickedId={targetId} otherId={sourceId} onPick={onPickTarget} />
      </div>

      {/* 差异表 */}
      {!source || !target ? (
        <Card>
          <CardContent className="py-10 text-center text-xs text-muted-foreground">
            请在上方各选择一个对象以开始对比 — 至少需要 source 与 target 两个对象。
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
              <Diff className="w-4 h-4 text-primary" />
              字段对照
              <Badge variant="outline" className="text-[10px] border-status-success/40 text-status-success">{counts.same} 相同</Badge>
              <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">{counts.behavior} 行为差异</Badge>
              <Badge variant="outline" className="text-[10px] border-status-warning/40 text-status-warning">{counts.meta} 元信息差异</Badge>
            </CardTitle>
            <CardDescription className="text-[11px]">
              所有字段均派生自真实 runCSL / compat 输出,Compare 视图不修改对象。
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 mb-3 grid grid-cols-2 gap-2">
              {(() => {
                const sState: ObjectShellState = {
                  objectId: source.id, objectName: `A · ${source.name}`,
                  bucket: source.bucket, lockState: source.lockState,
                  oseStatus: source.oseStatus, compat: source.compat?.verdict,
                  version: source.version, shellMode: 'compare',
                };
                const tState: ObjectShellState = {
                  objectId: target.id, objectName: `B · ${target.name}`,
                  bucket: target.bucket, lockState: target.lockState,
                  oseStatus: target.oseStatus, compat: target.compat?.verdict,
                  version: target.version, shellMode: 'compare',
                };
                return (
                  <>
                    <ObjectStatusBar {...toStatusBarProps(sState)} />
                    <ObjectStatusBar {...toStatusBarProps(tState)} />
                  </>
                );
              })()}
            </div>

            <div className="grid grid-cols-[140px_1fr_1fr_60px] gap-x-2 gap-y-0 text-xs">
              <div className="font-semibold text-[10px] text-muted-foreground py-1.5 border-b">字段</div>
              <div className="font-semibold text-[10px] text-muted-foreground py-1.5 border-b">A · {source.name}</div>
              <div className="font-semibold text-[10px] text-muted-foreground py-1.5 border-b">B · {target.name}</div>
              <div className="font-semibold text-[10px] text-muted-foreground py-1.5 border-b text-center">差异</div>

              {rows.map(({ f, kind }) => {
                const rowCls =
                  kind === 'same' ? ''
                  : kind === 'behavior' ? 'bg-destructive/5'
                  : 'bg-status-warning/5';
                return (
                  <div key={f.key} className="contents">
                    <div className={`py-1.5 border-b border-border/40 text-[10px] text-muted-foreground ${rowCls}`}>{f.label}</div>
                    <div className={`py-1.5 border-b border-border/40 ${rowCls}`}>{f.render(source)}</div>
                    <div className={`py-1.5 border-b border-border/40 ${rowCls}`}>{f.render(target)}</div>
                    <div className={`py-1.5 border-b border-border/40 text-center ${rowCls}`}>
                      {kind === 'same' ? (
                        <Equal className="w-3 h-3 inline text-status-success" />
                      ) : kind === 'behavior' ? (
                        <span className="text-[9px] font-mono text-destructive">行为</span>
                      ) : (
                        <span className="text-[9px] font-mono text-status-warning">元信息</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 不兼容详情 / Viewer / 跳转 / 导出报告 */}
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              {source.compat && source.compat.verdict !== 'compatible' && (
                <IncompatibilityDetailsPanel
                  objectName={`A · ${source.name}`}
                  verdict={source.compat.verdict}
                  compat={source.compat}
                  origin="compare"
                />
              )}
              {target.compat && target.compat.verdict !== 'compatible' && (
                <IncompatibilityDetailsPanel
                  objectName={`B · ${target.name}`}
                  verdict={target.compat.verdict}
                  compat={target.compat}
                  origin="compare"
                />
              )}
              {onOpenViewer && (
                <>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => onOpenViewer(source.id)}>
                    <Eye className="w-3 h-3" />Viewer A
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => onOpenViewer(target.id)}>
                    <Eye className="w-3 h-3" />Viewer B
                  </Button>
                </>
              )}
              {onJumpToRun && (
                <>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => onJumpToRun(source.id)}>
                    <ArrowRight className="w-3 h-3" />到现场试跑 A
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => onJumpToRun(target.id)}>
                    <ArrowRight className="w-3 h-3" />到现场试跑 B
                  </Button>
                </>
              )}
              <Button
                variant="default" size="sm" className="h-7 text-xs gap-1 ml-auto"
                onClick={() => {
                  const srcCode = getSource?.(source.id) ?? '';
                  const tgtCode = getSource?.(target.id) ?? '';
                  const reportFields: CompareReportFieldRow[] = rows.map(({ f, kind }) => ({
                    key: f.key,
                    label: f.label,
                    source: f.raw(source),
                    target: f.raw(target),
                    same: kind === 'same',
                    category: kind,
                  }));
                  const report = buildCompareReport({
                    source, target, sourceCode: srcCode, targetCode: tgtCode, fields: reportFields,
                  });
                  downloadCompareReport(report);
                  toast({ title: '已导出对照报告', description: 'csl-compare__A__vs__B.json' });
                }}
                title={ACTIONS.exportCompareJSON}
              >
                <FileDown className="w-3 h-3" />{ACTIONS.exportCompareJSON}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* P8: 源码级 diff(折叠,默认收起) */}
      {source && target && getSource && (
        <SourceDiffPanel
          sourceName={source.name}
          targetName={target.name}
          sourceCode={getSource(source.id) ?? ''}
          targetCode={getSource(target.id) ?? ''}
        />
      )}

      {/* P14: L2 影子对比 — 任一侧识别为 L2 才显示 */}
      {source && target && getSource && (() => {
        const sc = getSource(source.id) ?? '';
        const tc = getSource(target.id) ?? '';
        if (!isLikelyL2Source(sc) && !isLikelyL2Source(tc)) return null;
        return (
          <L2ComparePanel
            sourceName={source.name} targetName={target.name}
            sourceCode={sc} targetCode={tc}
          />
        );
      })()}
    </div>
  );
}

function PickerColumn({
  title, tag, pool, pickedId, otherId, onPick,
}: {
  title: string; tag: 'A' | 'B';
  pool: ComparableObject[]; pickedId: string | null; otherId: string | null;
  onPick: (id: string) => void;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] font-mono">{tag}</Badge>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {/* P9: 候选池保护 — 大集合时限制高度并提示总数,排序由调用方决定(active/recent 优先) */}
        <div className="flex items-center justify-between mb-1.5 text-[10px] text-muted-foreground">
          <span>候选 {pool.length} 个 · 已按 active/recent/同版本优先排序</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[240px] overflow-auto pr-1">
          {pool.map(o => {
            const isSelf = o.id === pickedId;
            const isOther = o.id === otherId;
            const lockCls =
              o.lockState === 'editable' ? 'text-status-success'
              : o.lockState === 'incompatible' ? 'text-destructive'
              : 'text-status-warning';
            const oseCls =
              o.oseStatus === 'pass' ? 'text-status-success'
              : o.oseStatus === 'block' ? 'text-destructive'
              : o.oseStatus === 'warn' ? 'text-status-warning'
              : 'text-muted-foreground';
            return (
              <button
                key={o.id}
                onClick={() => onPick(o.id)}
                disabled={isOther}
                className={`text-left rounded border px-2 py-1 text-[10px] transition-colors flex flex-col gap-0.5 ${
                  isSelf ? 'border-primary bg-primary/5'
                  : isOther ? 'border-muted bg-muted/30 opacity-50 cursor-not-allowed'
                  : 'border-border hover:border-primary/40 hover:bg-muted/30'
                }`}
                title={isOther ? '该对象已被另一侧选中' : `${o.name} · ${o.bucket} · ${o.version} · ${o.lockState} · ${o.oseStatus}`}
              >
                <span className="font-medium truncate">{o.name}</span>
                <span className="font-mono opacity-70 flex items-center gap-1 flex-wrap">
                  <span>{o.bucket}</span>
                  <span>· {o.version}</span>
                  <span className={`· ${lockCls}`}>· {o.lockState}</span>
                  <span className={oseCls}>· {o.oseStatus}</span>
                </span>
              </button>
            );
          })}
          {pool.length === 0 && (
            <div className="col-span-2 text-[10px] text-muted-foreground py-3 text-center">
              候选池为空 — 请先在「现场试跑」选择或导入对象
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
