import { Badge } from '@/components/ui/badge';
import { User, Layers, ArrowRight, RefreshCw, Radio, Workflow } from 'lucide-react';
import type { IRContainer } from '@/csl';

interface Props {
  ir: IRContainer | null;
}

/**
 * 0.3 高阶语义面板：主体 / 主权阶段 / 阶段转移 / 编译层 / 再生事件 / 信号
 */
export const SubjectsPanel = ({ ir }: Props) => {
  if (!ir) return <span className="text-xs text-muted-foreground">暂无数据</span>;

  const { subjects, stages, transitions, compiler_layers, regenerations, signals } = ir;
  const total = subjects.length + stages.length + transitions.length +
                compiler_layers.length + regenerations.length + signals.length;

  if (total === 0) {
    return (
      <div className="text-xs text-muted-foreground space-y-2">
        <div>当前 IR 中无高阶语义节点。</div>
        <div>支持的原语：<span className="font-mono">主体 / 主权阶段 / 阶段转移 / 编译层 / 再生事件 / 信号</span></div>
        <div>切换到「主权轮回 v1」「潜意识编译层」「AIE 再生引擎」示例查看完整用例。</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 主体 */}
      {subjects.length > 0 && (
        <Section icon={User} title="主体" count={subjects.length} color="text-primary">
          {subjects.map(s => (
            <div key={s.id} className="border rounded-md p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-medium">{s.name}</span>
                {s.current_stage && (
                  <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                    当前阶段 · {s.current_stage}
                  </Badge>
                )}
              </div>
              {Object.keys(s.attributes).length > 0 && (
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground font-mono">
                  {Object.entries(s.attributes).map(([k, v]) => (
                    <span key={k}>
                      <span className="text-foreground/70">{k}</span>=<span className="text-token-number">{String(v)}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* 主权阶段 */}
      {stages.length > 0 && (
        <Section icon={Layers} title="主权阶段" count={stages.length} color="text-token-keyword">
          <div className="space-y-1">
            {[...stages].sort((a, b) => (a.index ?? 99) - (b.index ?? 99)).map(s => (
              <div key={s.id} className="grid grid-cols-[40px_100px_1fr] gap-2 items-baseline text-xs hover:bg-muted/50 rounded px-2 py-1.5">
                <span className="font-mono text-muted-foreground">{s.index !== null ? `#${s.index}` : '—'}</span>
                <span className="font-mono font-medium text-token-keyword">{s.name}</span>
                <div className="space-y-0.5">
                  {s.description && <div className="text-muted-foreground">{s.description}</div>}
                  {s.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {s.keywords.map((k, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] py-0 px-1.5">{k}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 阶段转移 */}
      {transitions.length > 0 && (
        <Section icon={ArrowRight} title="阶段转移" count={transitions.length} color="text-status-warning">
          {transitions.map(t => (
            <div key={t.id} className="border rounded-md p-2 text-xs flex items-center gap-2 flex-wrap">
              <span className="font-mono text-muted-foreground">{t.name}</span>
              <Badge variant="outline" className="text-[10px]">{t.from_stage || '—'}</Badge>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
              <Badge variant="outline" className="text-[10px] border-status-warning/40 text-status-warning">{t.to_stage || '—'}</Badge>
              {t.trigger && (
                <span className="text-[11px] text-muted-foreground font-mono ml-auto">
                  触发 {t.trigger.left} {t.trigger.op} {String(t.trigger.right)}
                </span>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* 编译层 */}
      {compiler_layers.length > 0 && (
        <Section icon={Workflow} title="编译层" count={compiler_layers.length} color="text-accent-foreground">
          {compiler_layers.map(l => (
            <div key={l.id} className="border rounded-md p-3 space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px] font-mono">层级 {l.level}</Badge>
                <span className="text-xs font-mono font-medium">{l.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-muted-foreground">输入:</span>{' '}
                  {l.inputs.length > 0 ? l.inputs.map((x, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] mr-1">{x}</Badge>
                  )) : <span className="text-muted-foreground">—</span>}
                </div>
                <div>
                  <span className="text-muted-foreground">输出:</span>{' '}
                  {l.outputs.length > 0 ? l.outputs.map((x, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] mr-1 border-status-success/40 text-status-success">{x}</Badge>
                  )) : <span className="text-muted-foreground">—</span>}
                </div>
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* 再生事件 */}
      {regenerations.length > 0 && (
        <Section icon={RefreshCw} title="再生事件" count={regenerations.length} color="text-status-warning">
          {regenerations.map(r => (
            <div key={r.id} className="border rounded-md p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-medium">{r.name}</span>
                {r.subject_ref && (
                  <Badge variant="outline" className="text-[10px]">主体: {r.subject_ref}</Badge>
                )}
                {r.new_version && (
                  <Badge className="text-[10px] bg-status-success ml-auto">→ {r.new_version}</Badge>
                )}
              </div>
              <div className="space-y-1 text-[11px]">
                <Row label="失配" value={r.failure} />
                <Row label="诊断" value={r.diagnosis} />
                <Row label="重组" value={r.recompose} />
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* 信号 */}
      {signals.length > 0 && (
        <Section icon={Radio} title="信号" count={signals.length} color="text-token-string">
          <div className="grid grid-cols-2 gap-2">
            {signals.map(s => (
              <div key={s.id} className="border rounded-md p-2 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium">{s.name}</span>
                  <Badge variant="outline" className="text-[10px] ml-auto">{s.kind}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-token-string"
                      style={{ width: `${Math.min(100, s.intensity)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">{s.intensity}</span>
                </div>
                {s.description && <div className="text-[11px] text-muted-foreground">{s.description}</div>}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
};

// --- 内部小组件 ---

const Section = ({ icon: Icon, title, count, color, children }: {
  icon: typeof User; title: string; count: number; color: string; children: React.ReactNode;
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

const Row = ({ label, value }: { label: string; value: string }) => (
  value ? (
    <div className="grid grid-cols-[40px_1fr] gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground/80">{value}</span>
    </div>
  ) : null
);
