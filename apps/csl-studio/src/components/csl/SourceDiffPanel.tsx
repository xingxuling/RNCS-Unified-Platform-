// P8 — Compare 壳源码差异面板
// 折叠组件,展示 source vs target 的行级 diff。
// 严格只读 — 任何点击都不修改原对象。

import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, FileDiff } from 'lucide-react';
import { diffLines, type DiffLine } from '@/csl/ui/source-diff';

interface Props {
  sourceName: string;
  targetName: string;
  sourceCode: string;
  targetCode: string;
  defaultOpen?: boolean;
}

const OP_META: Record<DiffLine['op'], { label: string; cls: string; sign: string }> = {
  same: { label: '相同', cls: 'text-muted-foreground',          sign: ' ' },
  add:  { label: '新增', cls: 'text-status-success bg-status-success/5', sign: '+' },
  del:  { label: '删除', cls: 'text-destructive bg-destructive/5',       sign: '-' },
  mod:  { label: '修改', cls: 'text-status-warning bg-status-warning/5', sign: '~' },
};

export function SourceDiffPanel({
  sourceName, targetName, sourceCode, targetCode, defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [hideSame, setHideSame] = useState(true);
  const { lines, summary } = useMemo(
    () => diffLines(sourceCode, targetCode),
    [sourceCode, targetCode],
  );

  const visible = useMemo(() => {
    if (!hideSame) return lines;
    // 保留差异 + 上下各 1 行 same 作为上下文
    const keep = new Array<boolean>(lines.length).fill(false);
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].op !== 'same') {
        keep[i] = true;
        if (i > 0) keep[i - 1] = true;
        if (i < lines.length - 1) keep[i + 1] = true;
      }
    }
    return lines.filter((_, i) => keep[i]);
  }, [lines, hideSame]);

  const noDiff = summary.add + summary.del + summary.mod === 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-start justify-between gap-2 text-left"
        >
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <FileDiff className="w-4 h-4 text-primary" />
              源码差异(行级)
              {noDiff ? (
                <Badge variant="outline" className="text-[10px] border-status-success/40 text-status-success">两侧源码完全一致</Badge>
              ) : (
                <>
                  <Badge variant="outline" className="text-[10px] border-status-success/40 text-status-success">+{summary.add}</Badge>
                  <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">−{summary.del}</Badge>
                  <Badge variant="outline" className="text-[10px] border-status-warning/40 text-status-warning">~{summary.mod}</Badge>
                </>
              )}
            </CardTitle>
            <CardDescription className="text-[11px]">
              A · {sourceName}({summary.totalA} 行) ↔ B · {targetName}({summary.totalB} 行) — 严格只读,辅助解释对象级字段差异。
            </CardDescription>
          </div>
          {open && !noDiff && (
            <Button
              variant="outline" size="sm" className="h-7 text-[10px]"
              onClick={(e) => { e.stopPropagation(); setHideSame(s => !s); }}
            >
              {hideSame ? '显示完整源码' : '只看差异行'}
            </Button>
          )}
        </button>
      </CardHeader>
      {open && (
        <CardContent className="pt-0">
          {noDiff ? (
            <div className="text-[11px] text-muted-foreground py-2">
              对象级字段如有差异,与源码无关 — 例如 lockState / 版本指纹 / compat / enabledModes。
            </div>
          ) : (
            <div className="border rounded font-mono text-[10.5px] overflow-auto max-h-[360px] bg-muted/20">
              <table className="w-full">
                <tbody>
                  {visible.map((l, idx) => {
                    const m = OP_META[l.op];
                    if (l.op === 'mod') {
                      return (
                        <tr key={idx} className="align-top">
                          <td className="px-1 text-right w-10 text-muted-foreground select-none">{l.aLine ?? ''}</td>
                          <td className="px-1 text-right w-10 text-muted-foreground select-none">{l.bLine ?? ''}</td>
                          <td className={`px-1 ${m.cls}`}>~</td>
                          <td className="px-2 whitespace-pre-wrap break-all">
                            <div className="text-destructive">- {l.aText}</div>
                            <div className="text-status-success">+ {l.bText}</div>
                          </td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={idx} className={`align-top ${m.cls}`}>
                        <td className="px-1 text-right w-10 text-muted-foreground select-none">{l.aLine ?? ''}</td>
                        <td className="px-1 text-right w-10 text-muted-foreground select-none">{l.bLine ?? ''}</td>
                        <td className="px-1 select-none">{m.sign}</td>
                        <td className="px-2 whitespace-pre-wrap break-all">{l.text}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
