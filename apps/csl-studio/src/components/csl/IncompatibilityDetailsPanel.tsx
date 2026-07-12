// IncompatibilityDetailsPanel — P7
// 把 CompatReasonsCard 的能力升级成可从多入口打开的「兼容详情面板」(Dialog)。
// 调用方:演示壳的 user_bundle、compare 视图中的 incompatible 对象、工作区回流对象。
//
// 纪律:
//   - 详情面板自身不被 lockState 阻止打开 — 用户必须能查看「为什么不兼容」。
//   - 对 incompatible 对象,UI 仍会拒绝运行/编辑/导出当前版本运行包(由调用方守住)。

import { useState, type ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldX, Lock, Info, ListChecks, FileSearch } from 'lucide-react';
import { CompatReasonsCard } from './CompatReasonsCard';
import type { CompatVerdict, CompatCheckResult } from '@/csl/workspace/compat';
import type { VersionStamps } from '@/csl/version-stamps';

interface Props {
  /** 触发器,默认是个小 Badge */
  trigger?: ReactNode;
  objectName: string;
  verdict: CompatVerdict;
  compat?: CompatCheckResult | null;
  current?: VersionStamps;
  imported?: VersionStamps;
  primaryHint?: string;
  reasons?: string[];
  /** 调用入口标识(便于排查) */
  origin?: 'showcase' | 'compare' | 'workspace' | 'recent' | 'viewer';
  /** 受控开关(可选) */
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}

const ORIGIN_LABEL: Record<NonNullable<Props['origin']>, string> = {
  showcase:  '演示壳 user_bundle',
  compare:   'compare 视图',
  workspace: '工作区回流',
  recent:    '最近列表',
  viewer:    'Viewer 只读壳',
};

export function IncompatibilityDetailsPanel({
  trigger, objectName, verdict, compat, current, imported,
  primaryHint, reasons, origin, open, onOpenChange,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const cls =
    verdict === 'incompatible' ? 'border-destructive/40 text-destructive bg-destructive/5'
    : verdict === 'read_only' ? 'border-status-warning/40 text-status-warning bg-status-warning/5'
    : 'border-status-success/40 text-status-success bg-status-success/5';

  const Icon = verdict === 'incompatible' ? ShieldX : verdict === 'read_only' ? Lock : Info;

  const defaultTrigger = (
    <Badge
      variant="outline"
      className={`text-[10px] gap-1 cursor-pointer hover:opacity-80 ${cls}`}
    >
      <FileSearch className="w-3 h-3" />
      查看兼容详情
    </Badge>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            兼容性详情 · <span className="font-mono text-sm">{objectName}</span>
          </DialogTitle>
          <DialogDescription className="text-xs flex items-center gap-1.5 flex-wrap">
            <span>查看为什么这个对象被判定为</span>
            <Badge variant="outline" className={`text-[10px] font-mono ${cls}`}>{verdict}</Badge>
            {origin && (
              <>
                <span>· 入口:</span>
                <Badge variant="outline" className="text-[10px]">{ORIGIN_LABEL[origin]}</Badge>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <CompatReasonsCard
            verdict={verdict}
            compat={compat}
            current={current}
            imported={imported}
            primaryHint={primaryHint}
            reasons={reasons}
          />

          <div className="rounded border p-2 text-[11px] bg-muted/30 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold">
              <ListChecks className="w-3.5 h-3.5" />
              系统真实行为(由 lockState 守住,非 UI 装饰)
            </div>
            <ul className="text-[10px] text-muted-foreground space-y-0.5 pl-4 list-disc">
              <li>查看详情 / 阅读 manifest / 比较版本指纹 — 始终允许</li>
              <li>编辑源码 — {verdict === 'compatible' ? '允许' : '拒绝'}</li>
              <li>运行 / 推进阶段 — {verdict === 'incompatible' ? '拒绝' : '允许'}</li>
              <li>导出当前版本运行包 — {verdict === 'compatible' ? '允许' : '拒绝(只读 / 不兼容均不得导出当前版本)'}</li>
              <li>另存为可编辑工作区 — {verdict === 'incompatible' ? '降级为只读副本' : '允许'}</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
