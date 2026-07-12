// L2SummaryPanel — P14
// 在 Viewer 中只读展示 L2 影子分支对象。
// - 默认开全部 flags(影子分支内开关,与主线无关)
// - parseL2 / summarizeL2 / runL2OSE / runL2OSEv2 / 弱绑定 / expr 解析全部在此组装
// - 不写回任何对象

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FlaskConical, ChevronDown, ChevronRight, AlertTriangle, Info } from 'lucide-react';
import {
  parseL2, summarizeL2, runL2OSE, runL2OSEv2,
  parseL2Expr, computeL2WeakBinding,
  L2_ALL_FLAGS, L2_FEATURE_LABELS, L2_VERSION_LABEL,
  type MainlineNameIndex,
} from '@/csl/lab/l2';

interface Props {
  source: string;
  /** 主线已知名字索引,用于弱绑定 */
  mainlineIndex?: MainlineNameIndex;
}

export function L2SummaryPanel({ source, mainlineIndex }: Props) {
  const [expanded, setExpanded] = useState(true);

  const result = useMemo(() => {
    const parsed = parseL2(source, { enabled: L2_ALL_FLAGS });
    const summary = summarizeL2(parsed.ir);
    const ose1 = runL2OSE(parsed.ir);
    const ose2 = runL2OSEv2(parsed.ir);
    const binding = computeL2WeakBinding(
      parsed.ir,
      mainlineIndex ?? { names: new Set() },
    );
    const exprStats = parsed.ir.constraints.map(c => ({
      name: c.name,
      kind: c.kind,
      raw: c.expr,
      parsed: parseL2Expr(c.expr),
    }));
    return { parsed, summary, ose1, ose2, binding, exprStats };
  }, [source, mainlineIndex]);

  const { summary, parsed, ose1, ose2, binding, exprStats } = result;
  const allDiagnostics = [...parsed.diagnostics, ...ose1.diagnostics, ...ose2.diagnostics];
  const exprOk = exprStats.filter(e => e.parsed.ok).length;

  return (
    <Card data-testid="l2-summary-panel" className="border-status-warning/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
          <FlaskConical className="w-4 h-4 text-status-warning" />
          L2 影子审阅
          <Badge variant="outline" className="text-[10px] font-mono border-status-warning/40 text-status-warning">
            {L2_VERSION_LABEL['v0.10-alpha']}
          </Badge>
          <Badge variant="outline" className="text-[10px]">lab 分支 · 不进入主运行链</Badge>
          <Button
            variant="ghost" size="sm" className="ml-auto h-6 text-xs gap-1"
            onClick={() => setExpanded(v => !v)}
            aria-label={expanded ? '折叠' : '展开'}
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {expanded ? '折叠' : '展开'}
          </Button>
        </CardTitle>
        <CardDescription className="text-[11px]">
          仅供审阅。Viewer 显示二阶段语法的结构、弱绑定提示与 OSE 影子诊断,不重写源码。
        </CardDescription>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-3 text-[11px]">
          {/* feature flags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-muted-foreground">已启用 flags:</span>
            {L2_ALL_FLAGS.map(f => (
              <Badge key={f} variant="outline" className="text-[9px] font-mono">
                {f} <span className="ml-1 opacity-70">· {L2_FEATURE_LABELS[f]}</span>
              </Badge>
            ))}
          </div>

          {/* counts */}
          <div className="grid grid-cols-4 gap-2">
            <Stat label="引擎" value={summary.counts.engines} />
            <Stat label="模块" value={summary.counts.modules} />
            <Stat label="职责" value={summary.counts.responsibilities} />
            <Stat label="约束" value={summary.counts.constraints} />
          </div>

          {/* summary lines */}
          {summary.lines.length === 0 ? (
            <div className="text-muted-foreground">
              当前源码未识别到任何 L2 顶层声明 — 该对象可能不是 L2 文本,或 L2 关键字未出现在结构位置。
            </div>
          ) : (
            <div className="rounded border bg-muted/30 p-2 space-y-0.5 font-mono text-[10px] max-h-[180px] overflow-auto">
              {summary.lines.map((l, i) => (
                <div key={i} className="whitespace-pre">{l}</div>
              ))}
            </div>
          )}

          {/* expr 解析统计 */}
          {exprStats.length > 0 && (
            <div>
              <div className="text-muted-foreground mb-1">
                约束表达式最小子集解析: <span className="font-mono">{exprOk}/{exprStats.length}</span> 成功
              </div>
              <div className="space-y-0.5 text-[10px] font-mono max-h-[120px] overflow-auto">
                {exprStats.map((e, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <Badge variant="outline" className={`text-[9px] ${e.parsed.ok ? 'border-status-success/40 text-status-success' : 'border-status-warning/40 text-status-warning'}`}>
                      {e.parsed.ok ? 'ok' : 'raw'}
                    </Badge>
                    <span className="opacity-70">{e.kind === 'pre' ? '前置' : '后置'}</span>
                    <span className="font-medium">{e.name}</span>
                    <span className="opacity-50 truncate">{e.raw}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 弱绑定 */}
          {(binding.hints.length > 0 || binding.unresolved.length > 0) && (
            <div className="space-y-1">
              <div className="text-muted-foreground">主线弱绑定提示</div>
              {binding.hints.map((h, i) => (
                <div key={`h${i}`} className="flex items-start gap-1.5 text-[10px]">
                  <Info className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                  <span>{h.message}</span>
                </div>
              ))}
              {binding.unresolved.map((u, i) => (
                <div key={`u${i}`} className="flex items-start gap-1.5 text-[10px]">
                  <AlertTriangle className="w-3 h-3 mt-0.5 text-status-warning shrink-0" />
                  <span><span className="font-mono">{u.from}</span> → <span className="font-mono">{u.ref}</span> · {u.reason}</span>
                </div>
              ))}
            </div>
          )}

          {/* OSE 影子诊断 */}
          {allDiagnostics.length > 0 && (
            <div className="space-y-1">
              <div className="text-muted-foreground">OSE 影子诊断 ({allDiagnostics.length})</div>
              <div className="space-y-0.5 max-h-[120px] overflow-auto">
                {allDiagnostics.map((d, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[10px]">
                    <Badge variant="outline" className={`text-[9px] font-mono ${
                      d.level === 'error' ? 'border-destructive/40 text-destructive'
                      : d.level === 'warn' ? 'border-status-warning/40 text-status-warning'
                      : 'border-border text-muted-foreground'
                    }`}>{d.code}</Badge>
                    <span className="flex-1">{d.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border p-1.5 bg-muted/30">
      <div className="text-[9px] text-muted-foreground">{label}</div>
      <div className="font-mono text-sm">{value}</div>
    </div>
  );
}
