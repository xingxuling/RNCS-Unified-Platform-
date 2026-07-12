import { Badge } from '@/components/ui/badge';
import { Table2, Lock, Link2, GitFork, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { IRContainer } from '@/csl';

interface Props {
  ir: IRContainer | null;
}

/**
 * 0.4 东方本体论原语面板：映射表 / 封口 / 同位链 / 域展开
 * 表达「母法 → 五分 → 域 → 递归」的结构
 */
export const OntologyPanel = ({ ir }: Props) => {
  if (!ir) return <span className="text-xs text-muted-foreground">暂无数据</span>;

  const { mapping_tables, closures, correspondence_chains, domain_expansions } = ir;
  const total = mapping_tables.length + closures.length + correspondence_chains.length + domain_expansions.length;

  if (total === 0) {
    return (
      <div className="text-xs text-muted-foreground space-y-2">
        <div>当前 IR 中无东方本体论原语。</div>
        <div>支持的原语：<span className="font-mono">映射表 / 封口 / 同位链 / 域展开</span></div>
        <div>切换到「太一道法经 v1」示例查看完整用例。</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 映射表 */}
      {mapping_tables.length > 0 && (
        <Section icon={Table2} title="五分映射表" count={mapping_tables.length} color="text-primary">
          {mapping_tables.map(mt => (
            <div key={mt.id} className="border rounded-md overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-panel-header border-b">
                <span className="text-xs font-mono font-medium">{mt.name}</span>
                <Badge variant="outline" className="text-[10px]">{mt.columns.length} 列 × {mt.rows.length} 行</Badge>
                {mt.aligned ? (
                  <Badge variant="outline" className="text-[10px] border-status-success/40 text-status-success ml-auto">
                    <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />对齐
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive ml-auto">
                    <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />错位 {mt.misaligned_rows.length} 行
                  </Badge>
                )}
              </div>
              <div className="overflow-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-2 py-1.5 text-left text-muted-foreground font-medium">行</th>
                      {mt.columns.map((c, i) => (
                        <th key={i} className="px-2 py-1.5 text-left font-mono text-token-keyword">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mt.rows.map((r, ri) => (
                      <tr key={ri} className="border-b hover:bg-muted/40">
                        <td className="px-2 py-1.5 font-mono text-muted-foreground">{r.label}</td>
                        {Array.from({ length: Math.max(mt.columns.length, r.items.length) }).map((_, ci) => (
                          <td key={ci} className="px-2 py-1.5 font-mono">
                            {r.items[ci] ?? <span className="text-destructive">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* 封口 */}
      {closures.length > 0 && (
        <Section icon={Lock} title="数量封口" count={closures.length} color="text-status-warning">
          {closures.map(cl => (
            <div key={cl.id} className="border rounded-md p-3">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs font-mono font-medium">{cl.name}</span>
                <Badge variant="outline" className="text-[10px]">声明 {cl.total}</Badge>
                <Badge variant="outline" className="text-[10px]">实算 {cl.computed_sum}</Badge>
                {cl.closed ? (
                  <Badge className="text-[10px] bg-status-success ml-auto">
                    <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />封口成功
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-[10px] ml-auto">
                    <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
                    差额 {cl.total - cl.computed_sum > 0 ? '+' : ''}{cl.total - cl.computed_sum}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
                {cl.parts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] px-2 py-1 rounded bg-muted/40 font-mono">
                    <span className="text-muted-foreground">{p.label}</span>
                    <span className="text-token-number">{p.value}</span>
                  </div>
                ))}
              </div>
              {/* 进度条：实算占声明的比例 */}
              <div className="mt-2 h-1 bg-muted rounded overflow-hidden">
                <div
                  className={`h-full ${cl.closed ? 'bg-status-success' : 'bg-status-warning'}`}
                  style={{ width: `${Math.min(100, (cl.computed_sum / Math.max(cl.total, 1)) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* 同位链 */}
      {correspondence_chains.length > 0 && (
        <Section icon={Link2} title="跨域同位链" count={correspondence_chains.length} color="text-accent-foreground">
          {correspondence_chains.map(ch => (
            <div key={ch.id} className="border rounded-md p-3">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs font-mono font-medium">{ch.name}</span>
                <Badge variant="outline" className="text-[10px]">{ch.domains.length} 域</Badge>
                {!ch.aligned && (
                  <Badge variant="destructive" className="text-[10px] ml-auto">
                    <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />项数与域数不一致
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                {ch.domains.map((d, i) => (
                  <div key={i} className="grid grid-cols-[80px_1fr] gap-2 items-center text-[11px]">
                    <Badge variant="outline" className="text-[10px] font-mono justify-center">{d}</Badge>
                    <span className="font-mono text-token-keyword">
                      {ch.items[i] ?? <span className="text-destructive">缺失</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* 域展开 */}
      {domain_expansions.length > 0 && (
        <Section icon={GitFork} title="递归域展开" count={domain_expansions.length} color="text-token-string">
          {domain_expansions.map(de => (
            <div key={de.id} className="border rounded-md p-3 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-medium">{de.name}</span>
                <Badge variant="outline" className="text-[10px]">
                  母法 {de.mother_law_values.length} · 域 {de.domains.length} · 派生 {de.factors.reduce((a, f) => a + f.items.length, 0)}
                </Badge>
              </div>

              {/* 母法值 */}
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-muted-foreground w-12">母法</span>
                <div className="flex flex-wrap gap-1">
                  {de.mother_law_values.map((v, i) => (
                    <Badge key={i} className="text-[10px] bg-primary/15 text-primary border-primary/30 font-mono">{v}</Badge>
                  ))}
                </div>
              </div>

              {/* 应用域 */}
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-muted-foreground w-12">应用域</span>
                <div className="flex flex-wrap gap-1">
                  {de.domains.map((d, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] font-mono">{d}</Badge>
                  ))}
                </div>
              </div>

              {/* 五因递归 */}
              <div className="space-y-1 pt-1">
                {de.factors.map((f, i) => (
                  <div key={i} className="grid grid-cols-[60px_1fr] gap-2 items-baseline text-[11px]">
                    <Badge variant="secondary" className="text-[10px] font-mono justify-center">{f.domain}</Badge>
                    <div className="flex flex-wrap gap-1">
                      {f.items.map((it, j) => (
                        <span key={j} className="font-mono text-foreground/80 px-1.5 py-0.5 rounded bg-muted/40">{it}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
};

const Section = ({ icon: Icon, title, count, color, children }: {
  icon: typeof Table2; title: string; count: number; color: string; children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-xs font-medium">
      <Icon className={`w-3.5 h-3.5 ${color}`} />
      <span className={color}>{title}</span>
      <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{count}</Badge>
    </div>
    <div className="space-y-2">{children}</div>
  </div>
);
