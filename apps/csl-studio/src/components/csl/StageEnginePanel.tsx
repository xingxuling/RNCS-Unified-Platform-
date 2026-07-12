import { useState, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle2, XCircle, HelpCircle, GitBranch, Repeat, Flag, User, RotateCcw, StepForward, History, ShieldAlert, ShieldX, Crosshair, Lock as LockIcon, Ban } from 'lucide-react';
import type { IRContainer, SubjectSpec } from '@/csl';
import { evaluateCandidates, computeAutoPath, type TransitionStatus, type CandidateTransition, type PathStep, type SubjectAdvancement, type CandidateVerdict } from '@/csl/stage-engine';

interface Props {
  ir: IRContainer | null;
  /** P2:由 runCSL 计算后的主体推进结果(含 governance 诊断) */
  advancements?: SubjectAdvancement[];
  /** P4:点击"定位源码"时回调,演示壳负责把对应行号传给编辑器 */
  onJumpToSource?: (line: number, snippet?: string) => void;
}

const STATUS_META: Record<TransitionStatus, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  ready:   { label: '可推进',   cls: 'border-status-success/40 text-status-success bg-status-success/5', Icon: CheckCircle2 },
  open:    { label: '默认放行', cls: 'border-primary/40 text-primary bg-primary/5',                       Icon: CheckCircle2 },
  blocked: { label: '阻塞',     cls: 'border-destructive/40 text-destructive bg-destructive/5',           Icon: XCircle },
  unknown: { label: '属性缺失', cls: 'border-status-warning/40 text-status-warning bg-status-warning/5',  Icon: HelpCircle },
};

/** P4:候选转移综合裁决 — 视觉分级 */
const VERDICT_META: Record<CandidateVerdict, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  ready:                       { label: '可推进',          cls: 'border-status-success/50 text-status-success bg-status-success/5', Icon: CheckCircle2 },
  open:                        { label: '默认放行',        cls: 'border-primary/40 text-primary bg-primary/5',                      Icon: CheckCircle2 },
  blocked_by_condition:        { label: '条件未满足',      cls: 'border-status-warning/40 text-status-warning bg-status-warning/5', Icon: XCircle },
  blocked_by_runtime_guard:    { label: '运行时治理拦截',  cls: 'border-destructive/40 text-destructive bg-destructive/5',          Icon: ShieldX },
  blocked_by_ose:              { label: 'OSE 治理拦截',    cls: 'border-destructive/40 text-destructive bg-destructive/5',          Icon: ShieldX },
  blocked_by_mode_or_permission: { label: '模式/权限拦截', cls: 'border-destructive/40 text-destructive bg-destructive/5',          Icon: LockIcon },
  unknown:                     { label: '属性缺失',        cls: 'border-status-warning/40 text-status-warning bg-status-warning/5', Icon: HelpCircle },
};

type HaltReason = 'no_outgoing' | 'all_blocked' | 'fork' | 'cycle' | 'completed' | 'running';

const HALT_LABEL: Record<HaltReason, { text: string; Icon: typeof Flag }> = {
  running:     { text: '可继续推进',         Icon: StepForward },
  no_outgoing: { text: '当前阶段无后继转移', Icon: Flag },
  all_blocked: { text: '所有出边均被阻塞',   Icon: XCircle },
  fork:        { text: '路径分歧,请手动选择', Icon: GitBranch },
  cycle:       { text: '检测到回环,停止推进', Icon: Repeat },
  completed:   { text: '推进完成',           Icon: CheckCircle2 },
};

/**
 * 阶段推进引擎面板:基于「主体 + 主权阶段 + 阶段转移」自动推演下一步。
 * P4:每条候选转移显示综合 verdict 与原因;治理阻断与候选阻断都可点击定位源码。
 */
export const StageEnginePanel = ({ ir, advancements, onJumpToSource }: Props) => {
  const [overrides, setOverrides] = useState<Record<string, { stage: string; history: PathStep[] }>>({});
  const advByName = useMemo(() => {
    const m = new Map<string, SubjectAdvancement>();
    (advancements ?? []).forEach(a => m.set(a.subject.name, a));
    return m;
  }, [advancements]);

  const reset = useCallback((subjectId: string) => {
    setOverrides(prev => {
      const next = { ...prev };
      delete next[subjectId];
      return next;
    });
  }, []);

  const advance = useCallback((subject: SubjectSpec, step: PathStep) => {
    setOverrides(prev => {
      const cur = prev[subject.id] ?? { stage: subject.current_stage ?? '', history: [] };
      return {
        ...prev,
        [subject.id]: {
          stage: step.to,
          history: [...cur.history, step],
        },
      };
    });
  }, []);

  if (!ir) return <span className="text-xs text-muted-foreground">暂无数据</span>;

  if (ir.subjects.length === 0 || ir.stages.length === 0) {
    return (
      <div className="text-xs text-muted-foreground space-y-2">
        <div>需要同时存在「主体」「主权阶段」「阶段转移」三类原语才能推进。</div>
        <div>切换到「主权轮回 v1」或「AIE 再生引擎」示例查看推进效果。</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ir.subjects.map(subject => (
        <SubjectCard
          key={subject.id}
          ir={ir}
          subject={subject}
          override={overrides[subject.id]}
          advancement={advByName.get(subject.name)}
          onAdvance={step => advance(subject, step)}
          onReset={() => reset(subject.id)}
          onJumpToSource={onJumpToSource}
        />
      ))}
    </div>
  );
};

interface SubjectCardProps {
  ir: IRContainer;
  subject: SubjectSpec;
  override?: { stage: string; history: PathStep[] };
  advancement?: SubjectAdvancement;
  onAdvance: (step: PathStep) => void;
  onReset: () => void;
  onJumpToSource?: (line: number, snippet?: string) => void;
}

const SubjectCard = ({ ir, subject, override, advancement, onAdvance, onReset, onJumpToSource }: SubjectCardProps) => {
  const effectiveStage = override?.stage ?? subject.current_stage ?? '';
  const history = override?.history ?? [];
  const stageNames = useMemo(() => new Set(ir.stages.map(s => s.name)), [ir]);
  const stageDefined = !!effectiveStage && stageNames.has(effectiveStage);

  // 候选基于 effective stage 重新评估;若该 subject 有 advancement 则优先用其 verdict 标注
  const candidates = useMemo<CandidateTransition[]>(() => {
    if (!stageDefined) return [];
    const virtualSubject: SubjectSpec = { ...subject, current_stage: effectiveStage };
    const fresh = evaluateCandidates(ir, virtualSubject, effectiveStage);
    // 把 advancement 已经计算好的 verdict / blockedBy 复用过来(按 transition id 匹配)
    const advCands = advancement?.candidates ?? [];
    const advByTransId = new Map(advCands.map(c => [c.transition.id, c]));
    return fresh.map(c => {
      const fromAdv = advByTransId.get(c.transition.id);
      return fromAdv ? { ...c, verdict: fromAdv.verdict, blockedBy: fromAdv.blockedBy } : c;
    });
  }, [ir, subject, effectiveStage, stageDefined, advancement]);

  const preview = useMemo(() => {
    if (!stageDefined) return { path: [] as PathStep[], terminal: effectiveStage, halt: 'no_outgoing' as const };
    const virtualSubject: SubjectSpec = { ...subject, current_stage: effectiveStage };
    return computeAutoPath(ir, virtualSubject);
  }, [ir, subject, effectiveStage, stageDefined]);

  const advanceable = candidates.filter(c => c.status === 'ready' || c.status === 'open');
  const haltReason: HaltReason =
    candidates.length === 0 ? 'no_outgoing'
    : advanceable.length === 0 ? 'all_blocked'
    : advanceable.length > 1 ? 'fork'
    : 'running';
  const halt = HALT_LABEL[haltReason];

  const handleSingleStep = () => {
    if (advanceable.length !== 1) return;
    const c = advanceable[0];
    onAdvance({
      from: effectiveStage,
      to: c.transition.to_stage,
      via: c.transition.name,
      trigger_text: c.trigger_text,
      status: c.status,
    });
  };

  const handlePickFork = (c: CandidateTransition) => {
    onAdvance({
      from: effectiveStage,
      to: c.transition.to_stage,
      via: c.transition.name,
      trigger_text: c.trigger_text,
      status: c.status,
    });
  };

  const govBlocked = advancement?.halt_reason === 'governance_blocked';

  return (
    <div className="border rounded-md overflow-hidden">
      {/* 标题 + 操作 */}
      <div className="flex items-center gap-2 px-3 py-2 bg-panel-header border-b flex-wrap">
        <User className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-mono font-semibold">{subject.name}</span>
        <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
          当前 · {effectiveStage || '未指定'}
        </Badge>
        {override && (
          <Badge variant="outline" className="text-[10px] border-status-warning/40 text-status-warning">
            本地态 · 起点 {subject.current_stage || '—'}
          </Badge>
        )}
        {!stageDefined && effectiveStage && (
          <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">
            阶段未定义
          </Badge>
        )}
        {govBlocked && (
          <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive bg-destructive/5 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />治理阻断
          </Badge>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={handleSingleStep}
            disabled={advanceable.length !== 1 || govBlocked}
            className="flex items-center gap-1 px-2 py-1 rounded border text-[11px] hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
            title={govBlocked ? '已被 RuntimeGuard / OSE 阻断,不得推进' : (advanceable.length === 1 ? '推进到下一阶段' : '只有唯一可推进边时可用')}
          >
            <StepForward className="w-3 h-3" />
            单步推进
          </button>
          <button
            onClick={onReset}
            disabled={!override}
            className="flex items-center gap-1 px-2 py-1 rounded border text-[11px] hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
            title="重置到 IR 初始阶段"
          >
            <RotateCcw className="w-3 h-3" />
            重置
          </button>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* P2:治理阻断条 */}
        {advancement && advancement.governance.length > 0 && (
          <div className={`text-[11px] rounded border p-2 ${govBlocked ? 'border-destructive/40 bg-destructive/5 text-destructive' : 'border-status-warning/40 bg-status-warning/5 text-status-warning'}`}>
            <div className="font-semibold flex items-center gap-1 mb-1">
              <ShieldAlert className="w-3 h-3" />
              {govBlocked ? 'RuntimeGuard 拦截推进' : '治理提示'}
            </div>
            <ul className="space-y-1 font-mono">
              {advancement.governance.map((g, i) => (
                <li key={i} className="flex items-start gap-1.5 flex-wrap">
                  <span>· [{g.policyId}] {g.reason}</span>
                  {g.fixHint && <span className="opacity-70">💡 {g.fixHint}</span>}
                  {g.sourceLocation && onJumpToSource && (
                    <button
                      onClick={() => onJumpToSource(g.sourceLocation!.line, g.sourceLocation!.snippet)}
                      className="inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded border border-current/40 hover:bg-current/10 text-[10px]"
                      title={g.sourceLocation.snippet || '跳转到源码行'}
                    >
                      <Crosshair className="w-2.5 h-2.5" />
                      L{g.sourceLocation.line}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* 主体属性 */}
        {Object.keys(subject.attributes).length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] font-mono text-muted-foreground">
            {Object.entries(subject.attributes).map(([k, v]) => (
              <span key={k}>{k}=<span className="text-token-number">{String(v)}</span></span>
            ))}
          </div>
        )}

        {/* 候选转移 */}
        <div>
          <div className="text-[11px] font-medium text-muted-foreground mb-1.5">
            候选转移 ({candidates.length})
            {haltReason === 'fork' && (
              <span className="ml-2 text-status-warning">· 路径分歧,点击下方任一可推进边手动选择</span>
            )}
          </div>
          {candidates.length === 0 ? (
            <div className="text-xs text-muted-foreground">当前阶段没有任何出边。</div>
          ) : (
            <div className="space-y-1.5">
              {candidates.map((c, i) => {
                const meta = STATUS_META[c.status];
                const verdict = c.verdict ?? (c.status as CandidateVerdict);
                const vmeta = VERDICT_META[verdict] ?? VERDICT_META.unknown;
                const VIcon = vmeta.Icon;
                const clickable = !govBlocked && (c.status === 'ready' || c.status === 'open');
                const isOseBlocked = verdict === 'blocked_by_ose';
                const isRuntimeBlocked = verdict === 'blocked_by_runtime_guard';
                return (
                  <div
                    key={i}
                    className={`border rounded p-2 text-xs ${vmeta.cls}`}
                  >
                    {/* 第一行:transition 名 + 状态 + 操作 */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <VIcon className="w-3 h-3" />
                      <span className="font-mono font-medium">{c.transition.name}</span>
                      <Badge variant="outline" className="text-[10px] bg-background">{effectiveStage}</Badge>
                      <ArrowRight className="w-3 h-3 opacity-60" />
                      <Badge variant="outline" className="text-[10px] bg-background">{c.transition.to_stage}</Badge>
                      <Badge variant="outline" className={`text-[10px] ml-auto ${vmeta.cls}`}>{vmeta.label}</Badge>
                      {clickable && (
                        <button
                          type="button"
                          onClick={() => handlePickFork(c)}
                          className="px-1.5 py-0.5 rounded border border-current/40 hover:bg-current/10 text-[10px] flex items-center gap-1"
                          title="选择此分支推进"
                        >
                          <StepForward className="w-2.5 h-2.5" />走这条
                        </button>
                      )}
                    </div>
                    {/* 第二行:逐条解释 */}
                    <div className="mt-1.5 ml-5 space-y-0.5 font-mono text-[10px] opacity-90">
                      {c.trigger_text ? (
                        <div>· 触发条件:<span className="opacity-80">{c.trigger_text}</span>{c.current_value !== undefined && <span className="ml-1 opacity-60">(当前值={String(c.current_value)})</span>}</div>
                      ) : (
                        <div>· 无触发条件,默认放行</div>
                      )}
                      {c.blockedBy && (
                        <>
                          <div>· 拦截策略:<span className="font-semibold">{c.blockedBy.policyId}</span></div>
                          <div>· 原因:{c.blockedBy.reason}</div>
                          {c.blockedBy.fixHint && <div>· 💡 {c.blockedBy.fixHint}</div>}
                          {c.blockedBy.sourceLocation && onJumpToSource && (
                            <div className="mt-1">
                              <button
                                onClick={() => onJumpToSource(c.blockedBy!.sourceLocation!.line, c.blockedBy!.sourceLocation!.snippet)}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-current/40 hover:bg-current/10"
                              >
                                <Crosshair className="w-2.5 h-2.5" />
                                定位源码 L{c.blockedBy.sourceLocation.line}
                                {c.blockedBy.sourceLocation.snippet && (
                                  <span className="opacity-60 ml-1 truncate max-w-[200px]">「{c.blockedBy.sourceLocation.snippet}」</span>
                                )}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                      {!c.blockedBy && verdict === 'ready' && (
                        <div className="text-status-success">· ✓ 条件已满足,且无治理拦截</div>
                      )}
                      {(isOseBlocked || isRuntimeBlocked) && (
                        <div className="mt-1 inline-flex items-center gap-1 text-[9px] opacity-70">
                          <Ban className="w-2.5 h-2.5" />本条不会被自动推进选中
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 历史路径 */}
        {history.length > 0 && (
          <div>
            <div className="text-[11px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <History className="w-3 h-3" />
              已走路径 ({history.length} 步)
            </div>
            <div className="flex items-center flex-wrap gap-1 text-xs">
              <Badge variant="outline" className="text-[10px]">
                {subject.current_stage || '—'}
              </Badge>
              {history.map((step, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="text-muted-foreground font-mono text-[10px]" title={step.trigger_text ?? '默认放行'}>
                    ──{step.via}──▶
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${i === history.length - 1 ? 'border-primary/50 text-primary bg-primary/5' : ''}`}
                  >
                    {step.to}
                  </Badge>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 自动预演路径 */}
        <div>
          <div className="text-[11px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <GitBranch className="w-3 h-3" />
            自动预演(从当前阶段贪心推演)
          </div>
          {preview.path.length === 0 ? (
            <div className="text-xs text-muted-foreground italic">无可继续推进路径。</div>
          ) : (
            <div className="flex items-center flex-wrap gap-1 text-xs">
              <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                {effectiveStage}
              </Badge>
              {preview.path.map((step, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="text-muted-foreground font-mono text-[10px]" title={step.trigger_text ?? '默认放行'}>
                    ──{step.via}──▶
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${i === preview.path.length - 1 ? 'border-status-success/50 text-status-success bg-status-success/5' : ''}`}
                  >
                    {step.to}
                  </Badge>
                </span>
              ))}
            </div>
          )}
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <halt.Icon className="w-3 h-3" />
            <span>状态:</span>
            <span>{halt.text}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
