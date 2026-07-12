// L2ComparePanel — P14
// 在 Compare 壳中展示 L2 IR 之间的差异;source/target 都不是 L2 时安全降级。

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, Plus, Minus, Diff as DiffIcon, Equal } from 'lucide-react';
import {
  parseL2, compareL2, isLikelyL2Source,
  L2_ALL_FLAGS, L2_VERSION_LABEL,
  type L2DiffEntry,
} from '@/csl/lab/l2';

interface Props {
  sourceName: string;
  targetName: string;
  sourceCode: string;
  targetCode: string;
}

const CAT_LABEL: Record<L2DiffEntry['category'], string> = {
  engine: '引擎',
  module: '模块',
  responsibility: '职责',
  constraint: '约束',
};

export function L2ComparePanel({ sourceName, targetName, sourceCode, targetCode }: Props) {
  const showSrc = isLikelyL2Source(sourceCode);
  const showTgt = isLikelyL2Source(targetCode);
  const eitherL2 = showSrc || showTgt;

  const report = useMemo(() => {
    if (!eitherL2) return null;
    const a = parseL2(sourceCode || '', { enabled: L2_ALL_FLAGS });
    const b = parseL2(targetCode || '', { enabled: L2_ALL_FLAGS });
    return compareL2(a.ir, b.ir);
  }, [sourceCode, targetCode, eitherL2]);

  if (!eitherL2 || !report) {
    return (
      <Card data-testid="l2-compare-panel-empty" className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-muted-foreground" />
            L2 影子对比
          </CardTitle>
          <CardDescription className="text-[11px]">
            两侧均未识别到 L2 二阶段语法 — 已自动隐藏 L2 对比详情。
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const filteredEntries = report.entries.filter(e => e.kind !== 'same');

  return (
    <Card data-testid="l2-compare-panel" className="border-status-warning/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
          <FlaskConical className="w-4 h-4 text-status-warning" />
          L2 影子对比
          <Badge variant="outline" className="text-[10px] font-mono border-status-warning/40 text-status-warning">
            {L2_VERSION_LABEL['v0.10-alpha']}
          </Badge>
          <Badge variant="outline" className="text-[10px] border-status-success/40 text-status-success">+{report.counts.add}</Badge>
          <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">−{report.counts.del}</Badge>
          <Badge variant="outline" className="text-[10px] border-status-warning/40 text-status-warning">~{report.counts.mod}</Badge>
          <Badge variant="outline" className="text-[10px]">={report.counts.same}</Badge>
        </CardTitle>
        <CardDescription className="text-[11px]">
          A · {sourceName} ↔ B · {targetName} — 仅按名字与字段对照,不深执行。
        </CardDescription>
      </CardHeader>
      <CardContent className="text-[11px] space-y-1">
        {filteredEntries.length === 0 ? (
          <div className="text-muted-foreground">两侧 L2 对象在所有类别上均一致(或都为空)。</div>
        ) : (
          <div className="space-y-1 max-h-[260px] overflow-auto">
            {filteredEntries.map((e, i) => <DiffRow key={i} entry={e} />)}
          </div>
        )}
        {(!showSrc || !showTgt) && (
          <div className="text-[10px] text-muted-foreground border-t pt-1">
            注意:{!showSrc ? `A · ${sourceName} 未识别为 L2,视为空 IR;` : ''}
            {!showTgt ? `B · ${targetName} 未识别为 L2,视为空 IR;` : ''}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DiffRow({ entry }: { entry: L2DiffEntry }) {
  const Icon = entry.kind === 'add' ? Plus : entry.kind === 'del' ? Minus : entry.kind === 'mod' ? DiffIcon : Equal;
  const cls =
    entry.kind === 'add' ? 'text-status-success'
    : entry.kind === 'del' ? 'text-destructive'
    : entry.kind === 'mod' ? 'text-status-warning'
    : 'text-muted-foreground';
  return (
    <div className="rounded border bg-muted/20 px-2 py-1">
      <div className="flex items-center gap-1.5 flex-wrap">
        <Icon className={`w-3 h-3 ${cls}`} />
        <Badge variant="outline" className="text-[9px]">{CAT_LABEL[entry.category]}</Badge>
        <span className="font-medium">{entry.name}</span>
        <Badge variant="outline" className={`text-[9px] font-mono ${cls}`}>{entry.kind}</Badge>
      </div>
      {entry.fieldDiffs && entry.fieldDiffs.length > 0 && (
        <div className="mt-1 ml-4 space-y-0.5 text-[10px] font-mono">
          {entry.fieldDiffs.map((d, i) => (
            <div key={i}>
              <span className="opacity-70">{d.field}:</span>{' '}
              <span className="text-destructive">{d.left ?? '∅'}</span>
              <span className="opacity-50"> → </span>
              <span className="text-status-success">{d.right ?? '∅'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
