// VersionDiffPanel — v0.8 vs v0.9 并行对比 UI
// MVP-2 Phase 7

import { useMemo } from 'react';
import { GitCompare, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { buildDual, type DualBuildResult } from '@/csl/diff';

interface VersionDiffPanelProps {
  open: boolean;
  source: string;
  onOpenChange: (open: boolean) => void;
}

export function VersionDiffPanel({ open, source, onOpenChange }: VersionDiffPanelProps) {
  const dual: DualBuildResult | null = useMemo(() => {
    if (!open) return null;
    try { return buildDual(source); } catch { return null; }
  }, [open, source]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="w-4 h-4" />
            版本并行对比 · v0.8 vs v0.9
          </DialogTitle>
        </DialogHeader>

        {!dual ? (
          <div className="text-sm text-muted-foreground p-8 text-center">无法生成对比</div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="space-y-4 pr-3">
              {/* 顶部:两侧 stamps + 解析状态 */}
              <div className="grid grid-cols-2 gap-3">
                <SideHeader label="左 · v0.8" stamps={dual.left.stamps} ok={!dual.left.result.error} error={dual.left.result.error} />
                <SideHeader label="右 · v0.9" stamps={dual.right.stamps} ok={!dual.right.result.error} error={dual.right.result.error} />
              </div>

              {/* AST diff */}
              <DiffSection
                title="AST 差异"
                status={dual.diffs.ast.status}
                summary={`新增 ${dual.diffs.ast.summary.addedCount} · 移除 ${dual.diffs.ast.summary.removedCount} · 变更 ${dual.diffs.ast.summary.changedCount}`}
              >
                {dual.diffs.ast.added.length === 0 && dual.diffs.ast.removed.length === 0 && dual.diffs.ast.changed.length === 0 && (
                  <div className="text-xs text-muted-foreground py-2">两侧 AST 完全一致</div>
                )}
                {dual.diffs.ast.added.map((it, i) => (
                  <DiffLine key={'a'+i} kind="add" text={`+ ${it.path}  ${it.preview}`} />
                ))}
                {dual.diffs.ast.removed.map((it, i) => (
                  <DiffLine key={'r'+i} kind="del" text={`- ${it.path}  ${it.preview}`} />
                ))}
                {dual.diffs.ast.changed.map((it, i) => (
                  <DiffLine key={'c'+i} kind="mod" text={`~ ${it.path}\n  L: ${it.before}\n  R: ${it.after}`} />
                ))}
              </DiffSection>

              {/* IR diff */}
              <DiffSection
                title="IR 差异"
                status={dual.diffs.ir.status}
                summary={`左 ${dual.diffs.ir.meta.leftNodeCount} 节点 · 右 ${dual.diffs.ir.meta.rightNodeCount} 节点 · Δ ${dual.diffs.ir.meta.delta}`}
              >
                {Object.keys(dual.diffs.ir.buckets).length === 0 && (
                  <div className="text-xs text-muted-foreground py-2">无 IR 桶差异</div>
                )}
                {Object.entries(dual.diffs.ir.buckets).map(([bucket, b]) => (
                  <div key={bucket} className="border-l-2 border-muted pl-2 py-1">
                    <div className="text-xs font-mono font-semibold">{bucket}</div>
                    {b.added.map((n, i) => <DiffLine key={'a'+i} kind="add" text={`+ ${n}`} />)}
                    {b.removed.map((n, i) => <DiffLine key={'r'+i} kind="del" text={`- ${n}`} />)}
                    {b.changed.map((c, i) => <DiffLine key={'c'+i} kind="mod" text={`~ ${c.name}  字段: ${c.fields.join(', ')}`} />)}
                  </div>
                ))}
              </DiffSection>

              {/* OSE diff */}
              <DiffSection
                title="治理(OSE / Guard)差异"
                status={dual.diffs.ose.status}
                summary={`左阻断 ${dual.diffs.ose.blockedDelta.left ? '是' : '否'} · 右阻断 ${dual.diffs.ose.blockedDelta.right ? '是' : '否'}`}
              >
                {dual.diffs.ose.newBlocks.length === 0 && dual.diffs.ose.resolved.length === 0 && dual.diffs.ose.severityChanged.length === 0 && (
                  <div className="text-xs text-muted-foreground py-2">两侧治理结果一致</div>
                )}
                {dual.diffs.ose.newBlocks.map((d, i) => (
                  <DiffLine key={'a'+i} kind="add" text={`+ [${d.policyId}] ${d.message}`} />
                ))}
                {dual.diffs.ose.resolved.map((d, i) => (
                  <DiffLine key={'r'+i} kind="del" text={`- [${d.policyId}] ${d.message}`} />
                ))}
                {dual.diffs.ose.severityChanged.map((c, i) => (
                  <DiffLine key={'s'+i} kind="mod" text={`~ ${c.policyId}: ${c.left} → ${c.right}`} />
                ))}
              </DiffSection>

              {/* Projection diff(占位) */}
              <DiffSection
                title="Projection 差异"
                status={dual.diffs.projection.status}
                summary="MVP 阶段 projection 不参与 dual build,留待第二轮"
              >
                <div className="text-xs text-muted-foreground py-2">
                  此项 MVP 不实现。projection 由 UI 独立触发,未来 dual build 接入后填实
                </div>
              </DiffSection>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SideHeader({ label, stamps, ok, error }: {
  label: string;
  stamps: { grammarVersion: string; specVersion: number; compilerVersion: string; osePolicyVersion: number };
  ok: boolean;
  error: string | null;
}) {
  return (
    <div className="border rounded p-2.5 bg-muted/30">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold">{label}</span>
        {ok
          ? <Badge variant="outline" className="text-[10px] text-status-success border-status-success/40"><CheckCircle2 className="w-3 h-3 mr-1" />解析成功</Badge>
          : <Badge variant="outline" className="text-[10px] text-destructive border-destructive/40"><AlertCircle className="w-3 h-3 mr-1" />解析失败</Badge>}
      </div>
      <div className="mt-1.5 text-[10px] font-mono text-muted-foreground space-x-2">
        <span>grammar={stamps.grammarVersion}</span>
        <span>spec={stamps.specVersion}</span>
        <span>compiler={stamps.compilerVersion}</span>
        <span>ose={stamps.osePolicyVersion}</span>
      </div>
      {error && <div className="mt-1.5 text-[11px] text-destructive truncate">{error}</div>}
    </div>
  );
}

function DiffSection({ title, status, summary, children }: {
  title: string; status: string; summary: string; children: React.ReactNode;
}) {
  const failed = status !== 'ok';
  return (
    <div className="border rounded">
      <div className="px-3 py-2 bg-muted/40 border-b flex items-center justify-between">
        <span className="text-xs font-semibold">{title}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">{summary}</span>
          {failed && <Badge variant="outline" className="text-[10px]">{status}</Badge>}
        </div>
      </div>
      <div className="p-2 space-y-0.5 text-[11px] font-mono">{children}</div>
    </div>
  );
}

function DiffLine({ kind, text }: { kind: 'add' | 'del' | 'mod'; text: string }) {
  const cls =
    kind === 'add' ? 'text-status-success bg-status-success/10' :
    kind === 'del' ? 'text-destructive bg-destructive/10' :
                     'text-amber-600 bg-amber-500/10';
  return (
    <pre className={`whitespace-pre-wrap px-2 py-0.5 rounded ${cls}`}>{text}</pre>
  );
}
