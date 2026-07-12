import { useState, useCallback, useMemo } from 'react';
import type { IRContainer } from '@/csl/types';
import { runConceptAIV2, profileLabel, type V2Profile, type ConceptAIV2Result } from '@/csl/concept-ai-v2';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Blocks, Send, Trash2, Database, Network, FileText, Sparkles,
  Cpu, Shield, Brain, Activity, GitBranch, Workflow, AlertTriangle, Wand2,
} from 'lucide-react';
import { UpgradePatchPanel } from './UpgradePatchPanel';

const ENGINE_KIND_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; tone: string; order: number }> = {
  invariant: { label: '不变量引擎', icon: Shield, tone: 'text-status-warning border-status-warning/40 bg-status-warning/5', order: 1 },
  subject:   { label: '主体引擎',   icon: Cpu,    tone: 'text-primary border-primary/40 bg-primary/5',                   order: 2 },
  memory:    { label: '记忆引擎',   icon: Brain,  tone: 'text-accent-foreground border-accent/40 bg-accent/5',           order: 3 },
  dynamic:   { label: '动态变量引擎', icon: Activity, tone: 'text-status-success border-status-success/40 bg-status-success/5', order: 4 },
  logic:     { label: '逻辑链引擎', icon: Workflow, tone: 'text-primary border-primary/40 bg-primary/5',                 order: 5 },
  version:   { label: '版本引擎',   icon: GitBranch, tone: 'text-muted-foreground border-border bg-secondary',           order: 6 },
  unknown:   { label: '未分类引擎', icon: Cpu,    tone: 'text-muted-foreground border-border bg-secondary',              order: 99 },
};

interface ChatMessage {
  id: number;
  role: 'user' | 'ai';
  content: string;
  result?: ConceptAIV2Result;
}

const KIND_COLORS: Record<string, string> = {
  '实体': 'bg-status-success/15 text-status-success border-status-success/30',
  '原理': 'bg-primary/15 text-primary border-primary/30',
  '状态': 'bg-status-warning/15 text-status-warning border-status-warning/30',
  '目标': 'bg-accent/15 text-accent-foreground border-accent/30',
  '元概念': 'bg-secondary text-secondary-foreground border-border',
  '未分类': 'bg-muted text-muted-foreground border-border',
};

const REL_COLORS: Record<string, string> = {
  '属于': 'text-status-success',
  '对立': 'text-destructive',
  '支撑': 'text-primary',
  '派生': 'text-accent-foreground',
  '约束': 'text-status-warning',
  '相似': 'text-muted-foreground',
  '因果': 'text-primary',
  '时序': 'text-muted-foreground',
  '其他': 'text-muted-foreground',
};

interface MemoryBlocksPanelProps {
  ir: IRContainer | null;
  onAppendCode?: (snippet: string) => void;
}

export function MemoryBlocksPanel({ ir, onAppendCode }: MemoryBlocksPanelProps) {
  const [profile, setProfile] = useState<V2Profile>('judge');
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [activeView, setActiveView] = useState('overview');
  const [activeLibrary, setActiveLibrary] = useState<string>('当前库');

  const stats = useMemo(() => ({
    concepts: ir?.concept_blocks.length ?? 0,
    propositions: ir?.proposition_blocks.length ?? 0,
    relations: ir?.relation_blocks.length ?? 0,
    unresolved:
      (ir?.proposition_blocks.filter(p => !p.resolved).length ?? 0) +
      (ir?.relation_blocks.filter(r => !r.resolved).length ?? 0),
  }), [ir]);

  // 母体挂载分组：把概念块按所挂母体引擎归类
  const matrixMounts = useMemo(() => {
    if (!ir) return { groups: [], mounted: 0, unmounted: 0, broken: 0, unmountedBlocks: [], brokenBlocks: [] };
    const byEngine = new Map<string, typeof ir.concept_blocks>();
    const unmountedBlocks: typeof ir.concept_blocks = [];
    const brokenBlocks: typeof ir.concept_blocks = [];
    for (const c of ir.concept_blocks) {
      if (!c.matrix_engine) { unmountedBlocks.push(c); continue; }
      if (!c.matrix_resolved) { brokenBlocks.push(c); continue; }
      const list = byEngine.get(c.matrix_engine) ?? [];
      list.push(c);
      byEngine.set(c.matrix_engine, list);
    }
    const groups = ir.engines
      .map(eng => ({
        engine: eng,
        blocks: byEngine.get(eng.name) ?? [],
      }))
      .sort((a, b) => (ENGINE_KIND_META[a.engine.kind]?.order ?? 99) - (ENGINE_KIND_META[b.engine.kind]?.order ?? 99));
    return {
      groups,
      mounted: ir.concept_blocks.length - unmountedBlocks.length - brokenBlocks.length,
      unmounted: unmountedBlocks.length,
      broken: brokenBlocks.length,
      unmountedBlocks,
      brokenBlocks,
    };
  }, [ir]);

  const handleSend = useCallback(() => {
    if (!input.trim() || !ir) return;
    const q = input.trim();
    const result = runConceptAIV2(q, ir, profile);
    setHistory(h => [
      ...h,
      { id: Date.now(), role: 'user', content: q },
      { id: Date.now() + 1, role: 'ai', content: '', result },
    ]);
    setInput('');
  }, [input, ir, profile]);

  if (!ir || ir.concept_blocks.length === 0) {
    return (
      <div className="text-center py-16 text-xs text-muted-foreground border rounded-md border-dashed">
        <Blocks className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <div className="font-medium mb-1">尚未声明任何「概念块」</div>
        <div className="text-[10px]">请加载示例「本地概念级 AI v2」或自行声明 概念块/命题块/关系块</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 统计条 */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard icon={<FileText className="w-3.5 h-3.5" />} label="概念块" value={stats.concepts} tone="primary" />
        <StatCard icon={<Database className="w-3.5 h-3.5" />} label="命题块" value={stats.propositions} tone="accent" />
        <StatCard icon={<Network className="w-3.5 h-3.5" />} label="关系块" value={stats.relations} tone="success" />
        <StatCard icon={<Sparkles className="w-3.5 h-3.5" />} label="未解析引用" value={stats.unresolved} tone={stats.unresolved ? 'warn' : 'muted'} />
      </div>

      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="h-8 flex-wrap">
          <TabsTrigger value="overview" className="text-xs h-7">总览</TabsTrigger>
          <TabsTrigger value="concepts" className="text-xs h-7">概念块</TabsTrigger>
          <TabsTrigger value="propositions" className="text-xs h-7">命题块</TabsTrigger>
          <TabsTrigger value="relations" className="text-xs h-7">关系块</TabsTrigger>
          <TabsTrigger value="matrix" className="text-xs h-7">母体引擎视图</TabsTrigger>
          <TabsTrigger value="chat" className="text-xs h-7">v2 对话</TabsTrigger>
          <TabsTrigger value="upgrade" className="text-xs h-7">
            <Wand2 className="w-3 h-3 mr-1" />升级建议
          </TabsTrigger>
        </TabsList>

        {/* 总览 — 横向流水线 检索→装配→判断→输出 */}
        <TabsContent value="overview" className="mt-3 space-y-3">
          <div className="text-xs text-muted-foreground">
            概念 AI v2 把推理拆为 4 阶段，全部围绕长期记忆三块运行：
          </div>
          <div className="flex items-stretch gap-2 overflow-x-auto pb-2">
            {[
              { n: '1', k: '检索', d: '在概念块中按名称/关键词/邻接命中', c: 'border-primary/40' },
              { n: '2', k: '装配', d: '收集焦点概念上挂的命题与关系', c: 'border-accent/40' },
              { n: '3', k: '判断', d: '失效边界 / 低置信 / 未解析引用', c: 'border-status-warning/40' },
              { n: '4', k: '输出', d: '行动建议（仅 plan 档位）', c: 'border-status-success/40' },
            ].map((s, i) => (
              <div key={i} className={`flex-1 min-w-[160px] border-l-4 ${s.c} rounded-md p-3 bg-card`}>
                <div className="text-[10px] text-muted-foreground">阶段 {s.n}</div>
                <div className="text-sm font-medium mt-0.5">{s.k}</div>
                <div className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{s.d}</div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* 概念块 */}
        <TabsContent value="concepts" className="mt-3 space-y-2">
          {/* 0.8 — 知识库下拉骨架，当前仅"当前库"可用，预留跨库扩展 */}
          <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-muted-foreground">
            <Database className="w-3 h-3" />
            <span>知识库：</span>
            <Select value={activeLibrary} onValueChange={setActiveLibrary}>
              <SelectTrigger className="h-7 w-[140px] text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="当前库" className="text-[11px]">当前库</SelectItem>
              </SelectContent>
            </Select>
            <span className="ml-auto">v0.8 联邦索引层（MVP）</span>
          </div>
          {ir.concept_blocks.map(c => {
            const isImplemented = c.status === '已实施';
            return (
            <div key={c.id} className="border rounded-md p-3 bg-card">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="outline" className={`text-[10px] ${KIND_COLORS[c.kind] ?? KIND_COLORS['未分类']}`}>
                  {c.kind}
                </Badge>
                <span className="text-sm font-medium">{c.display_name}</span>
                {c.display_name !== c.name && (
                  <span className="text-[10px] text-muted-foreground font-mono">{c.name}</span>
                )}
                {/* 0.8 — 版本徽章 */}
                <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground border-dashed">
                  v{c.version}
                </Badge>
                {c.status && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      isImplemented
                        ? 'bg-status-success/15 text-status-success border-status-success/40'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {c.status}
                  </Badge>
                )}
                <span className="ml-auto text-[10px] text-muted-foreground">
                  置信 {c.confidence} · {c.proposition_count} 命题 · {c.relation_count} 关系
                </span>
              </div>
              {c.definition && <div className="text-xs text-foreground mb-1.5">{c.definition}</div>}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                {c.scope && <Field label="适用范围">{c.scope}</Field>}
                {c.failure_boundary && <Field label="失效边界" warn>{c.failure_boundary}</Field>}
                {c.core_propositions.length > 0 && (
                  <Field label="核心命题">{c.core_propositions.join(' / ')}</Field>
                )}
                {c.neighbors.length > 0 && (
                  <Field label="相邻概念">
                    {c.neighbors.map(n => (
                      <Badge key={n} variant="outline" className="text-[10px] mr-1 font-mono">{n}</Badge>
                    ))}
                  </Field>
                )}
                {c.source && <Field label="来源">{c.source}</Field>}
                {c.updated_at && <Field label="更新时间">{c.updated_at}</Field>}
                {c.history.length > 0 && (
                  <Field label="历史">
                    <span className="font-mono text-[10px]">
                      {c.history.map(h => `v${h.version}${h.note ? '·' + h.note : ''}`).join(' → ')}
                    </span>
                  </Field>
                )}
              </div>
            </div>
            );
          })}
        </TabsContent>

        {/* 命题块 */}
        <TabsContent value="propositions" className="mt-3 space-y-2">
          {ir.proposition_blocks.length === 0 && (
            <div className="text-xs text-muted-foreground py-6 text-center">无命题块</div>
          )}
          {ir.proposition_blocks.map(p => (
            <div key={p.id} className={`border rounded-md p-3 bg-card ${!p.resolved ? 'border-status-warning/50' : ''}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-mono font-medium">{p.name}</span>
                {!p.resolved && <Badge variant="outline" className="text-[10px] text-status-warning border-status-warning/40">引用未解析</Badge>}
                <span className="ml-auto text-[10px] text-muted-foreground">置信 {p.confidence}</span>
              </div>
              <div className="text-xs font-mono mb-1.5">
                <span className="text-primary">{p.subject || '?'}</span>
                <span className="mx-1.5 text-muted-foreground">— {p.predicate || '?'} —</span>
                <span className="text-accent-foreground">{p.object || '?'}</span>
              </div>
              {p.assertion && <div className="text-[11px] text-muted-foreground italic leading-relaxed">"{p.assertion}"</div>}
              {p.source && <div className="text-[10px] text-muted-foreground mt-1">来源：{p.source}</div>}
            </div>
          ))}
        </TabsContent>

        {/* 关系块 */}
        <TabsContent value="relations" className="mt-3 space-y-2">
          {ir.relation_blocks.length === 0 && (
            <div className="text-xs text-muted-foreground py-6 text-center">无关系块</div>
          )}
          {ir.relation_blocks.map(r => (
            <div key={r.id} className={`border rounded-md p-3 bg-card ${!r.resolved ? 'border-status-warning/50' : ''}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-mono font-medium">{r.name}</span>
                {!r.resolved && <Badge variant="outline" className="text-[10px] text-status-warning border-status-warning/40">引用未解析</Badge>}
                <span className="ml-auto text-[10px] text-muted-foreground">强度 {r.strength} · 置信 {r.confidence}</span>
              </div>
              <div className="text-xs font-mono">
                <span className="text-primary">{r.source || '?'}</span>
                <span className={`mx-2 ${REL_COLORS[r.kind]}`}>—[{r.kind}]→</span>
                <span className="text-accent-foreground">{r.target || '?'}</span>
              </div>
              {r.evidence_source && <div className="text-[10px] text-muted-foreground mt-1">来源：{r.evidence_source}</div>}
            </div>
          ))}
        </TabsContent>

        {/* 母体引擎视图 — 把概念块挂到 0.6 的 6 大母体引擎下 */}
        <TabsContent value="matrix" className="mt-3 space-y-3">
          {ir.engines.length === 0 ? (
            <div className="text-center py-12 text-xs text-muted-foreground border rounded-md border-dashed">
              <Cpu className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <div className="font-medium mb-1">当前知识库未声明任何「母体引擎」</div>
              <div className="text-[10px]">需要先用 0.6 的 引擎 原语声明引擎，概念块才能通过 母体 = 引擎名 挂载</div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 rounded-md border bg-card text-xs flex-wrap">
                <Workflow className="w-4 h-4 text-primary shrink-0" />
                <span className="font-medium">概念块 → 母体引擎挂载</span>
                <Badge variant="outline" className="text-[10px] bg-status-success/10 text-status-success border-status-success/30">
                  已挂载 {matrixMounts.mounted}
                </Badge>
                {matrixMounts.unmounted > 0 && (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    未挂载 {matrixMounts.unmounted}
                  </Badge>
                )}
                {matrixMounts.broken > 0 && (
                  <Badge variant="outline" className="text-[10px] text-destructive border-destructive/40">
                    引用失效 {matrixMounts.broken}
                  </Badge>
                )}
                <span className="ml-auto text-[10px] text-muted-foreground">
                  共 {ir.engines.length} 引擎 · {stats.concepts} 概念块
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {matrixMounts.groups.map(g => {
                  const meta = ENGINE_KIND_META[g.engine.kind] ?? ENGINE_KIND_META.unknown;
                  const Icon = meta.icon;
                  return (
                    <div key={g.engine.id} className={`border rounded-md p-3 ${meta.tone}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium text-foreground">{g.engine.name}</span>
                        <Badge variant="outline" className="text-[10px] ml-1">{meta.label}</Badge>
                        <span className="ml-auto text-[10px] text-muted-foreground">
                          {g.blocks.length} 概念块
                        </span>
                      </div>
                      {g.engine.position && (
                        <div className="text-[11px] text-muted-foreground mb-2 leading-relaxed">{g.engine.position}</div>
                      )}
                      {g.blocks.length === 0 ? (
                        <div className="text-[11px] text-muted-foreground italic py-2">尚无概念块挂载到该引擎</div>
                      ) : (
                        <div className="space-y-1.5">
                          {g.blocks.map(b => (
                            <div key={b.id} className="flex items-center gap-2 text-xs bg-background/60 rounded px-2 py-1.5 border border-border">
                              <Badge variant="outline" className={`text-[10px] shrink-0 ${KIND_COLORS[b.kind] ?? KIND_COLORS['未分类']}`}>
                                {b.kind}
                              </Badge>
                              <span className="font-medium truncate">{b.display_name}</span>
                              <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
                                置信 {b.confidence} · {b.proposition_count}命题/{b.relation_count}关系
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {g.engine.constraint && (
                        <div className="text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border/50">
                          <span className="font-medium">约束：</span>{g.engine.constraint}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {(matrixMounts.unmounted > 0 || matrixMounts.broken > 0) && (
                <div className="border rounded-md p-3 bg-card border-status-warning/40">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-status-warning" />
                    <span className="text-xs font-medium">需要关注</span>
                  </div>
                  {matrixMounts.unmounted > 0 && (
                    <div className="mb-2">
                      <div className="text-[11px] text-muted-foreground mb-1">未挂载到任何母体引擎（建议补充 母体 = 引擎名）：</div>
                      <div className="flex flex-wrap gap-1">
                        {matrixMounts.unmountedBlocks.map(b => (
                          <Badge key={b.id} variant="outline" className="text-[10px]">{b.display_name}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {matrixMounts.broken > 0 && (
                    <div>
                      <div className="text-[11px] text-destructive mb-1">引用了不存在的母体引擎：</div>
                      <div className="flex flex-wrap gap-1">
                        {matrixMounts.brokenBlocks.map(b => (
                          <Badge key={b.id} variant="outline" className="text-[10px] text-destructive border-destructive/40">
                            {b.display_name} → {b.matrix_engine}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="border rounded-md p-3 bg-card">
                <div className="text-xs font-medium mb-2">六大引擎如何协作运行概念级 AI</div>
                <div className="text-[11px] text-muted-foreground leading-relaxed">
                  <span className="text-status-warning font-medium">不变量引擎</span> 校验所有写入 →{' '}
                  <span className="text-primary font-medium">主体引擎</span> 接收问题与概念 → 调{' '}
                  <span className="text-accent-foreground font-medium">记忆引擎</span> 检索概念块/命题块/关系块 →{' '}
                  <span className="text-primary font-medium">逻辑链引擎</span> 推演判断 →{' '}
                  <span className="text-status-success font-medium">动态变量引擎</span> 更新置信度与活跃度 →{' '}
                  <span className="text-muted-foreground font-medium">版本引擎</span> 记录此次变更可回滚
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* v2 对话 */}
        <TabsContent value="chat" className="mt-3 space-y-3">
          <div className="flex items-center justify-between gap-3 p-3 rounded-md border bg-card">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium">概念 AI v2</span>
              <Badge variant="outline" className="text-[10px]">{stats.concepts} 概念块在库</Badge>
            </div>
            <Select value={profile} onValueChange={(v) => setProfile(v as V2Profile)}>
              <SelectTrigger className="h-8 w-[180px] text-xs">
                <SelectValue>{profileLabel(profile)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recall" className="text-xs">{profileLabel('recall')}</SelectItem>
                <SelectItem value="judge" className="text-xs">{profileLabel('judge')}</SelectItem>
                <SelectItem value="plan" className="text-xs">{profileLabel('plan')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {history.length === 0 && (
              <div className="text-center py-8 text-xs text-muted-foreground border rounded-md border-dashed">
                示例：在「本地概念级 AI v2」下问<br />
                <span className="font-mono">「概念级 AI 和 LLM 的区别是什么？」</span> 或 <span className="font-mono">「行动层有什么约束？」</span>
              </div>
            )}
            {history.map(m => (
              m.role === 'user' ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[80%] px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs">{m.content}</div>
                </div>
              ) : (
                <div key={m.id} className="space-y-2">
                  {m.result && (
                    <>
                      <div className="text-[10px] text-muted-foreground">
                        命中 {m.result.retrieved.length} 概念块 · {m.result.related_propositions.length} 命题 · {m.result.related_relations.length} 关系
                      </div>
                      {m.result.retrieved.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {m.result.retrieved.map(r => (
                            <Badge key={r.block.id} variant="outline" className={`text-[10px] ${KIND_COLORS[r.block.kind] ?? KIND_COLORS['未分类']}`}>
                              {r.block.name} · {r.score}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {m.result.stages.map((s, i) => {
                        const engineLabel = ['记忆引擎', '记忆引擎', '逻辑链 + 不变量', '主体引擎'][i] ?? '';
                        return (
                        <div key={i} className="border rounded-md p-2.5 bg-card">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge
                              variant={s.status === 'ok' ? 'default' : 'outline'}
                              className={`text-[10px] ${s.status === 'ok' ? 'bg-status-success' : s.status === 'skip' ? 'opacity-50' : ''}`}
                            >
                              {s.name}
                            </Badge>
                            {engineLabel && (
                              <Badge variant="outline" className="text-[10px] text-muted-foreground border-dashed">
                                由 {engineLabel} 执行
                              </Badge>
                            )}
                            <span className="text-[10px] text-muted-foreground">{s.summary}</span>
                            <span className="ml-auto text-[10px] text-muted-foreground">
                              {s.status === 'ok' ? '✓' : s.status === 'empty' ? '∅' : '⊘'}
                            </span>
                          </div>
                          {s.bullets.length > 0 && (
                            <div className="space-y-0.5 mt-1">
                              {s.bullets.map((b, j) => (
                                <div key={j} className="text-[11px] text-muted-foreground font-mono pl-2 border-l border-border">
                                  {b}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                      })}
                    </>
                  )}
                </div>
              )
            ))}
          </div>

          <div className="sticky bottom-0 bg-background pt-2 border-t">
            <div className="flex gap-2 items-end">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="提到知识库里的概念块名（如：概念级AI / LLM / 长期记忆）..."
                className="text-xs min-h-[56px] flex-1"
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend(); }}
              />
              <div className="flex flex-col gap-2">
                <Button onClick={handleSend} size="sm" disabled={!input.trim()} className="h-9">
                  <Send className="w-3.5 h-3.5 mr-1" />发送
                </Button>
                <Button onClick={() => setHistory([])} size="sm" variant="outline" disabled={!history.length} className="h-9">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">⌘/Ctrl + Enter 发送</div>
          </div>
        </TabsContent>

        {/* 升级建议 — 用 CSL 自举生成器产出 CSL 源码补丁 */}
        <TabsContent value="upgrade" className="mt-3">
          <UpgradePatchPanel ir={ir} onAppendCode={onAppendCode} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: 'primary' | 'accent' | 'success' | 'warn' | 'muted' }) {
  const toneClass =
    tone === 'primary' ? 'text-primary' :
    tone === 'accent' ? 'text-accent-foreground' :
    tone === 'success' ? 'text-status-success' :
    tone === 'warn' ? 'text-status-warning' :
    'text-muted-foreground';
  return (
    <div className="border rounded-md p-3 bg-card">
      <div className={`flex items-center gap-1.5 text-[10px] ${toneClass}`}>
        {icon}
        <span>{label}</span>
      </div>
      <div className={`text-xl font-semibold mt-1 ${toneClass}`}>{value}</div>
    </div>
  );
}

function Field({ label, children, warn }: { label: string; children: React.ReactNode; warn?: boolean }) {
  return (
    <div className="flex gap-1.5">
      <span className={`text-[10px] shrink-0 ${warn ? 'text-status-warning' : 'text-muted-foreground'}`}>{label}：</span>
      <span className={`text-[11px] ${warn ? 'text-status-warning' : 'text-foreground'}`}>{children}</span>
    </div>
  );
}
