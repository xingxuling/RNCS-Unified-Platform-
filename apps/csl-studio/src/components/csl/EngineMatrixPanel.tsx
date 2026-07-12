import { useState, useMemo } from 'react';
import type { IRContainer, EngineSpec, EngineKind } from '@/csl/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ShieldCheck, User, Database, Sliders, GitBranch, Brain, HelpCircle, ChevronRight,
} from 'lucide-react';

interface Props {
  ir: IRContainer | null;
}

function getMountedConcepts(ir: IRContainer | null, engineName: string) {
  if (!ir) return [];
  return ir.concept_blocks.filter(c => c.matrix_engine === engineName && c.matrix_resolved);
}

const KIND_META: Record<EngineKind, { label: string; icon: typeof ShieldCheck; tone: string; order: number }> = {
  invariant: { label: '不变量', icon: ShieldCheck, tone: 'text-status-success border-status-success/30 bg-status-success/5', order: 1 },
  subject: { label: '主体', icon: User, tone: 'text-primary border-primary/30 bg-primary/5', order: 2 },
  memory: { label: '记忆', icon: Database, tone: 'text-accent-foreground border-accent/40 bg-accent/10', order: 3 },
  dynamic: { label: '动态变量', icon: Sliders, tone: 'text-status-warning border-status-warning/30 bg-status-warning/5', order: 4 },
  logic: { label: '逻辑链', icon: Brain, tone: 'text-token-keyword border-token-keyword/30 bg-token-keyword/5', order: 5 },
  version: { label: '版本', icon: GitBranch, tone: 'text-token-string border-token-string/30 bg-token-string/5', order: 6 },
  unknown: { label: '未识别', icon: HelpCircle, tone: 'text-muted-foreground border-border bg-muted/30', order: 99 },
};

export function EngineMatrixPanel({ ir }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const engines = useMemo(() => {
    if (!ir) return [];
    return [...ir.engines].sort(
      (a, b) => (KIND_META[a.kind].order - KIND_META[b.kind].order),
    );
  }, [ir]);

  if (!ir || engines.length === 0) {
    return (
      <div className="text-xs text-muted-foreground">
        当前 IR 中未声明任何「引擎」。请加载示例「数字文明母体 v1」体验 0.6 原语。
      </div>
    );
  }

  const active = engines.find(e => e.id === activeId) ?? engines[0];
  const modules = ir.engine_modules.filter(m => m.engine_ref === active.name);
  const actions = ir.engine_actions.filter(a => a.engine_ref === active.name);
  const axes = ir.engine_axes.filter(x => x.engine_ref === active.name).sort((a, b) => a.index - b.index);

  return (
    <div className="space-y-4">
      {/* 顶部统计 */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>共 <strong className="text-foreground">{engines.length}</strong> 个引擎</span>
        <span>·</span>
        <span>{ir.engine_modules.length} 模块</span>
        <span>·</span>
        <span>{ir.engine_actions.length} 动作</span>
        <span>·</span>
        <span>{ir.engine_axes.length} 轴</span>
      </div>

      {/* 引擎卡片网格 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {engines.map(eng => {
          const meta = KIND_META[eng.kind];
          const Icon = meta.icon;
          const isActive = eng.id === active.id;
          return (
            <Card
              key={eng.id}
              onClick={() => setActiveId(eng.id)}
              className={`cursor-pointer transition-all border ${meta.tone} ${
                isActive ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-sm'
              }`}
            >
              <CardHeader className="p-3 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <CardTitle className="text-sm font-medium truncate">{eng.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-[10px] flex-shrink-0">{meta.label}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-1.5">
                {eng.position && (
                  <div className="text-[11px] text-muted-foreground line-clamp-2">{eng.position}</div>
                )}
                <div className="flex items-center gap-3 text-[11px] font-mono pt-1">
                  <span>模块 {eng.module_count}</span>
                  <span>动作 {eng.action_count}</span>
                  <span>轴 {eng.axis_count}</span>
                </div>
                {(() => {
                  const mounted = getMountedConcepts(ir, eng.name);
                  if (mounted.length === 0) return null;
                  return (
                    <div className="pt-1.5 border-t border-border/50 mt-1.5">
                      <div className="text-[10px] text-muted-foreground mb-1">
                        挂载概念块：{mounted.length}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {mounted.slice(0, 3).map(c => (
                          <Badge key={c.id} variant="outline" className="text-[10px] font-mono">
                            {c.display_name}
                          </Badge>
                        ))}
                        {mounted.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{mounted.length - 3}</span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 引擎依赖流水线 */}
      <DependencyPipeline engines={engines} activeId={active.id} onClick={setActiveId} />

      {/* 详情面板 */}
      <Card>
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-primary" />
            {active.name} <span className="text-xs font-normal text-muted-foreground">详情</span>
          </CardTitle>
          {active.constraint && (
            <div className="text-[11px] text-muted-foreground pt-1">约束：{active.constraint}</div>
          )}
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-4">
          {/* 模块表 */}
          <Section title={`模块 (${modules.length})`}>
            {modules.length === 0 ? (
              <EmptyHint>暂未声明模块</EmptyHint>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-8 text-[11px]">名称</TableHead>
                    <TableHead className="h-8 text-[11px]">职责</TableHead>
                    <TableHead className="h-8 text-[11px]">输入 → 输出</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="py-2 text-xs font-mono">{m.name}</TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground">{m.responsibility || '—'}</TableCell>
                      <TableCell className="py-2 text-[11px] font-mono text-muted-foreground">
                        {(m.inputs.join(', ') || '—')} → {(m.outputs.join(', ') || '—')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Section>

          {/* 动作表 */}
          <Section title={`动作 (${actions.length})`}>
            {actions.length === 0 ? (
              <EmptyHint>暂未声明动作</EmptyHint>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-8 text-[11px]">名称</TableHead>
                    <TableHead className="h-8 text-[11px]">触发</TableHead>
                    <TableHead className="h-8 text-[11px]">前置 / 后置</TableHead>
                    <TableHead className="h-8 text-[11px] w-16 text-right">代价</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actions.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="py-2 text-xs font-mono">{a.name}</TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground">{a.trigger || '—'}</TableCell>
                      <TableCell className="py-2 text-[11px] text-muted-foreground">
                        {a.pre || '—'}
                        <br />
                        <span className="text-foreground/70">→ {a.post || '—'}</span>
                      </TableCell>
                      <TableCell className="py-2 text-xs font-mono text-right">
                        <Badge variant="outline" className="text-[10px]">{a.cost}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Section>

          {/* 轴表 */}
          <Section title={`轴 (${axes.length})`}>
            {axes.length === 0 ? (
              <EmptyHint>该引擎未声明 N 轴坐标</EmptyHint>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-8 text-[11px] w-12">序号</TableHead>
                    <TableHead className="h-8 text-[11px]">名称</TableHead>
                    <TableHead className="h-8 text-[11px]">含义</TableHead>
                    <TableHead className="h-8 text-[11px]">作用</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {axes.map(x => (
                    <TableRow key={x.id}>
                      <TableCell className="py-2 text-xs font-mono">{x.index || '—'}</TableCell>
                      <TableCell className="py-2 text-xs font-mono">{x.name}</TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground">{x.meaning || '—'}</TableCell>
                      <TableCell className="py-2 text-[11px] text-muted-foreground">{x.effect || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Section>
        </CardContent>
      </Card>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{title}</div>
      {children}
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-muted-foreground italic px-1">{children}</div>;
}

function DependencyPipeline({
  engines, activeId, onClick,
}: { engines: EngineSpec[]; activeId: string; onClick: (id: string) => void }) {
  if (engines.length === 0) return null;
  return (
    <Card>
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          引擎依赖流水线（搭建顺序）
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {engines.map((eng, i) => {
            const meta = KIND_META[eng.kind];
            const Icon = meta.icon;
            const isActive = eng.id === activeId;
            return (
              <div key={eng.id} className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => onClick(eng.id)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-md border transition-all ${
                    isActive ? 'bg-primary text-primary-foreground border-primary' : `${meta.tone} hover:shadow-sm`
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] font-medium whitespace-nowrap">{eng.name}</span>
                </button>
                {i < engines.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
