// CompatReasonsCard — P6
// 把 bundle/对象的兼容判定结果展示成完整、可信、可读的对象说明卡。
// 不只 toast,要让 verdict / primaryHint / reasons / stamps 差异 / 推荐动作都对外可读。

import { ShieldCheck, ShieldAlert, ShieldX, Lock, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { CompatVerdict, CompatCheckResult } from '@/csl/workspace/compat';
import type { VersionStamps } from '@/csl/version-stamps';

interface Props {
  verdict: CompatVerdict;
  /** 完整 compat 结果(如有) */
  compat?: CompatCheckResult | null;
  /** 当前系统 stamps,可选;有 compat 时优先用 compat.current */
  current?: VersionStamps;
  /** 导入对象 stamps,可选;有 compat 时优先用 compat.imported */
  imported?: VersionStamps;
  /** 顶部主提示文案,可选;无则用 compat.primaryHint */
  primaryHint?: string;
  /** 失败/降级原因列表,可选;无则用 compat.reasons */
  reasons?: string[];
  /** 是否使用紧凑布局 */
  compact?: boolean;
}

const META: Record<CompatVerdict, { label: string; cls: string; Icon: typeof ShieldCheck }> = {
  compatible:   { label: '版本兼容',   cls: 'border-status-success/40 text-status-success bg-status-success/5',   Icon: ShieldCheck },
  read_only:    { label: '只读兼容',   cls: 'border-status-warning/40 text-status-warning bg-status-warning/5',   Icon: Lock },
  incompatible: { label: '不兼容',     cls: 'border-destructive/40 text-destructive bg-destructive/5',           Icon: ShieldX },
};

const ACTION_BY_VERDICT: Record<CompatVerdict, string> = {
  compatible:   '推荐动作:可直接编辑、运行、重新导出运行包。',
  read_only:    '推荐动作:仅供查看与解释。如需修改,请「另存为可编辑工作区」后再编辑。',
  incompatible: '推荐动作:升级 CSL / 编译器版本,或仅查看 manifest 元信息;系统已禁止编辑、运行与导出。',
};

function StampDiff({ current, imported }: { current?: VersionStamps; imported?: VersionStamps }) {
  if (!current || !imported) return null;
  const rows: Array<{ key: string; cur: string | number; imp: string | number; diff: boolean }> = [
    { key: 'grammar',  cur: current.grammarVersion,    imp: imported.grammarVersion,    diff: current.grammarVersion !== imported.grammarVersion },
    { key: 'spec',     cur: `v${current.specVersion}`, imp: `v${imported.specVersion}`, diff: current.specVersion !== imported.specVersion },
    { key: 'compiler', cur: current.compilerVersion,   imp: imported.compilerVersion,   diff: current.compilerVersion !== imported.compilerVersion },
    { key: 'ose',      cur: `v${current.osePolicyVersion}`, imp: `v${imported.osePolicyVersion}`, diff: current.osePolicyVersion !== imported.osePolicyVersion },
  ];
  return (
    <div className="grid grid-cols-[80px_1fr_1fr] gap-1 text-[10px] font-mono mt-1">
      <span className="text-muted-foreground">字段</span>
      <span className="text-muted-foreground">当前系统</span>
      <span className="text-muted-foreground">导入对象</span>
      {rows.map(r => (
        <div key={r.key} className="contents">
          <span className={r.diff ? 'text-destructive' : 'text-muted-foreground'}>{r.key}</span>
          <span>{r.cur}</span>
          <span className={r.diff ? 'text-destructive font-semibold' : ''}>{r.imp}</span>
        </div>
      ))}
    </div>
  );
}

export function CompatReasonsCard({
  verdict, compat, current, imported, primaryHint, reasons, compact,
}: Props) {
  const m = META[verdict];
  const cur = current ?? compat?.current;
  const imp = imported ?? compat?.imported;
  const hint = primaryHint ?? compat?.primaryHint;
  const reasonList = reasons ?? compat?.reasons ?? [];

  return (
    <div className={`rounded border p-2 space-y-1.5 ${m.cls}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold">
        <m.Icon className="w-3.5 h-3.5" />
        <span>兼容判定:{m.label}</span>
        <Badge variant="outline" className="text-[9px] font-mono ml-1">verdict={verdict}</Badge>
      </div>
      {hint && (
        <div className="text-[11px] flex items-start gap-1">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0 opacity-70" />
          <span>{hint}</span>
        </div>
      )}
      {!compact && reasonList.length > 0 && (
        <div className="text-[10px] space-y-0.5">
          <div className="font-semibold opacity-80">详细原因({reasonList.length}):</div>
          <ul className="font-mono pl-2 space-y-0.5">
            {reasonList.map((r, i) => <li key={i}>· {r}</li>)}
          </ul>
        </div>
      )}
      {!compact && (cur || imp) && (
        <div className="text-[10px]">
          <div className="font-semibold opacity-80">版本指纹差异:</div>
          <StampDiff current={cur} imported={imp} />
        </div>
      )}
      <div className="text-[10px] opacity-90 border-t pt-1 mt-1 border-current/20">
        {ACTION_BY_VERDICT[verdict]}
      </div>
    </div>
  );
}

export function CompatVerdictBadge({ verdict }: { verdict: CompatVerdict }) {
  const m = META[verdict];
  return (
    <Badge variant="outline" className={`text-[10px] flex items-center gap-1 ${m.cls}`}>
      <m.Icon className="w-3 h-3" />{m.label}
    </Badge>
  );
}
