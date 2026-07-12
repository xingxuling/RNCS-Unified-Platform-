import { Badge } from '@/components/ui/badge';
import { Cpu, Layers3, Gauge, Scale, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { IRContainer } from '@/csl';

interface Props {
  ir: IRContainer | null;
}

/**
 * 0.5 主权判断操作系统面板：单元 / 编制 / 档位 / 权衡
 */
export const JudgmentOSPanel = ({ ir }: Props) => {
  if (!ir) return <span className="text-xs text-muted-foreground">暂无数据</span>;

  const { units, establishments, profiles, tradeoffs } = ir;
  const total = units.length + establishments.length + profiles.length + tradeoffs.length;

  if (total === 0) {
    return (
      <div className="text-xs text-muted-foreground space-y-2">
        <div>当前 IR 中无主权判断 OS 原语。</div>
        <div>支持的原语：<span className="font-mono">单元 / 编制 / 档位 / 权衡</span></div>
        <div>切换到「杜衡界 v1」示例查看 135 单元的完整建模。</div>
      </div>
    );
  }

  // 按模块聚合单元
  const modules: Record<string, typeof units> = {};
  for (const u of units) {
    const key = `${u.layer}·${u.module || '未分类'}`;
    if (!modules[key]) modules[key] = [];
    modules[key].push(u);
  }

  const layerColor = (layer: string) =>
    layer === '母体' ? 'text-primary'
    : layer === '显性' ? 'text-status-success'
    : layer === '隐性' ? 'text-status-warning'
    : 'text-muted-foreground';

  const quadrantColor = (q: string) =>
    q === '高价值低代价' ? 'bg-status-success/15 text-status-success border-status-success/30'
    : q === '高价值高代价' ? 'bg-primary/15 text-primary border-primary/30'
    : q === '低价值低代价' ? 'bg-muted text-muted-foreground border-muted-foreground/20'
    : 'bg-destructive/15 text-destructive border-destructive/30';

  return (
    <div className="space-y-5">
      {/* 编制 */}
      {establishments.length > 0 && (
        <Section icon={Layers3} title="层级编制" count={establishments.length}>
          {establishments.map(est => (
            <div key={est.id} className="border rounded-md p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-medium">{est.name}</span>
                {est.total_matched ? (
                  <Badge variant="outline" className="text-[10px] border-status-success/40 text-status-success">
                    <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> 总数对齐 {est.actual_total}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">
                    <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                    声明 {est.declared_total} · 实际 {est.actual_total}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {est.layers.map(l => (
                  <div key={l.label} className={`border rounded px-2 py-1.5 ${l.matched ? 'border-status-success/30' : 'border-destructive/40'}`}>
                    <div className={`text-[10px] uppercase tracking-wide ${layerColor(l.label)}`}>{l.label}</div>
                    <div className="text-sm font-mono">
                      {l.actual} <span className="text-muted-foreground text-xs">/ {l.declared}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* 档位 */}
      {profiles.length > 0 && (
        <Section icon={Gauge} title="激活档位" count={profiles.length}>
          <div className="space-y-2">
            {profiles.map(p => {
              const max = Math.max(...profiles.map(x => x.upper));
              return (
                <div key={p.id} className="border rounded-md p-2.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-mono font-medium">{p.name}</span>
                    <Badge variant="outline" className="text-[10px]">{p.lower}–{p.upper} 单元</Badge>
                    <span className="text-[10px] text-muted-foreground ml-auto">{p.description}</span>
                  </div>
                  {/* 区间条 */}
                  <div className="relative h-2 bg-muted rounded overflow-hidden">
                    <div
                      className="absolute h-full bg-primary/40"
                      style={{
                        left: `${(p.lower / max) * 100}%`,
                        width: `${((p.upper - p.lower) / max) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    高优先激活：{p.activated_units.slice(0, 5).join('、')}
                    {p.activated_units.length > 5 && ` …等 ${p.activated_units.length} 个`}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* 权衡 */}
      {tradeoffs.length > 0 && (
        <Section icon={Scale} title="代价-价值权衡" count={tradeoffs.length}>
          <div className="space-y-2">
            {tradeoffs.map(tr => {
              const target = tr.unit_names.length === 0 ? units : units.filter(u => tr.unit_names.includes(u.name));
              return (
                <div key={tr.id} className="border rounded-md p-3 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-medium">{tr.name}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {target.length} 单元
                    </Badge>
                    {tr.value_threshold !== null && (
                      <Badge variant="outline" className="text-[10px]">价值≥{tr.value_threshold}</Badge>
                    )}
                    {tr.cost_threshold !== null && (
                      <Badge variant="outline" className="text-[10px]">代价≤{tr.cost_threshold}</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="border rounded px-2 py-1">
                      <div className="text-[10px] text-muted-foreground">总价值</div>
                      <div className="font-mono text-status-success">{tr.total_value}</div>
                    </div>
                    <div className="border rounded px-2 py-1">
                      <div className="text-[10px] text-muted-foreground">总代价</div>
                      <div className="font-mono text-destructive">{tr.total_cost}</div>
                    </div>
                  </div>
                  {tr.green_units.length > 0 && (
                    <div className="text-[11px]">
                      <span className="text-status-success font-medium">✓ 命中（{tr.green_units.length}）：</span>
                      <span className="text-muted-foreground font-mono">
                        {tr.green_units.slice(0, 8).join('、')}{tr.green_units.length > 8 && '…'}
                      </span>
                    </div>
                  )}
                  {tr.red_units.length > 0 && (
                    <div className="text-[11px]">
                      <span className="text-destructive font-medium">⚠ 红区（{tr.red_units.length}）：</span>
                      <span className="text-muted-foreground font-mono">
                        {tr.red_units.slice(0, 8).join('、')}{tr.red_units.length > 8 && '…'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* 单元详表（按模块） */}
      {units.length > 0 && (
        <Section icon={Cpu} title={`单元详表（按模块分组）`} count={units.length}>
          <div className="space-y-3">
            {Object.entries(modules).map(([modKey, mUnits]) => {
              const [layer, mod] = modKey.split('·');
              return (
                <div key={modKey} className="border rounded-md overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-panel-header border-b">
                    <Badge variant="outline" className={`text-[10px] ${layerColor(layer)} border-current/30`}>
                      {layer}
                    </Badge>
                    <span className="text-xs font-mono font-medium">{mod}</span>
                    <Badge variant="outline" className="text-[10px] ml-auto">{mUnits.length}</Badge>
                  </div>
                  <div className="divide-y">
                    {mUnits.map(u => (
                      <div key={u.id} className="px-3 py-2 hover:bg-muted/30 grid grid-cols-[1fr_auto] gap-3 items-start">
                        <div className="min-w-0">
                          <div className="text-xs font-mono font-medium truncate">{u.name}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{u.definition}</div>
                          <div className="flex items-center gap-3 mt-1 text-[10px]">
                            <span className="text-status-success">价值 {u.value}</span>
                            <span className="text-destructive">代价 {u.cost}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-muted-foreground">V</span>
                            <span className="text-xs font-mono text-status-success w-4 text-right">{u.value_score}</span>
                            <span className="text-[10px] text-muted-foreground">/</span>
                            <span className="text-[10px] text-muted-foreground">C</span>
                            <span className="text-xs font-mono text-destructive w-4 text-right">{u.cost_score}</span>
                          </div>
                          <Badge variant="outline" className={`text-[9px] px-1 py-0 ${quadrantColor(u.quadrant)}`}>
                            {u.quadrant}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
};

const Section = ({ icon: Icon, title, count, children }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  count: number;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-xs font-medium">
      <Icon className="w-3.5 h-3.5 text-primary" />
      <span>{title}</span>
      <Badge variant="outline" className="text-[10px]">{count}</Badge>
    </div>
    {children}
  </div>
);
