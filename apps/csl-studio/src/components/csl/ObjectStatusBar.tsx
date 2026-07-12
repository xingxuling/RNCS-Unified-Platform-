// ObjectStatusBar — P6
// 把对象的几个关键状态压成一个稳定组件,在演示壳与工作区里复用,口径一致。
//   - shellMode    当前所在壳层:演示壳 / 工作区
//   - lockState    editable / read_only / incompatible
//   - oseStatus    pass / warn / block / unknown
//   - compat       可选 verdict,用于导入对象
//   - bucket       template / user_csl / user_bundle / user_paste / workspace
//
// 不承担行为,只承担「让外部用户一眼看出现在这个对象处于什么状态」。

import { ShieldCheck, ShieldAlert, ShieldX, Lock, FlaskConical, FolderOpen, Database, Columns3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { CompatVerdict } from '@/csl/workspace/compat';

export type ShellMode = 'showcase' | 'workspace' | 'viewer' | 'compare';
export type LockKind = 'editable' | 'read_only' | 'incompatible';
export type OseStatus = 'pass' | 'warn' | 'block' | 'unknown';
export type ObjectBucket =
  | 'template' | 'user_csl' | 'user_bundle' | 'user_paste' | 'workspace';

interface Props {
  shellMode: ShellMode;
  bucket?: ObjectBucket;
  lockState?: LockKind;
  oseStatus?: OseStatus;
  compat?: CompatVerdict;
  /** 对象名(可选,用作前缀) */
  objectName?: string;
}

const SHELL_META: Record<ShellMode, { label: string; cls: string; Icon: typeof FlaskConical }> = {
  showcase:  { label: '演示壳',   cls: 'border-primary/40 text-primary bg-primary/5',         Icon: FlaskConical },
  workspace: { label: '正式工作区', cls: 'border-foreground/30 text-foreground bg-muted/40',  Icon: FolderOpen },
  viewer:    { label: '只读查看器', cls: 'border-status-warning/40 text-status-warning bg-status-warning/5', Icon: Lock },
  compare:   { label: '对比视图',   cls: 'border-primary/40 text-primary bg-primary/5',                     Icon: Columns3 },
};

const BUCKET_LABEL: Record<ObjectBucket, string> = {
  template:    '内置模板',
  user_csl:    '用户 .csl',
  user_bundle: '用户运行包',
  user_paste:  '粘贴对象',
  workspace:   '工作区对象',
};

const LOCK_META: Record<LockKind, { label: string; cls: string }> = {
  editable:     { label: 'editable',     cls: 'border-status-success/40 text-status-success bg-status-success/5' },
  read_only:    { label: 'read_only',    cls: 'border-status-warning/40 text-status-warning bg-status-warning/5' },
  incompatible: { label: 'incompatible', cls: 'border-destructive/40 text-destructive bg-destructive/5' },
};

const OSE_META: Record<OseStatus, { label: string; cls: string; Icon: typeof ShieldCheck }> = {
  pass:    { label: 'OSE pass',    cls: 'border-status-success/40 text-status-success bg-status-success/5', Icon: ShieldCheck },
  warn:    { label: 'OSE warn',    cls: 'border-status-warning/40 text-status-warning bg-status-warning/5', Icon: ShieldAlert },
  block:   { label: 'OSE block',   cls: 'border-destructive/40 text-destructive bg-destructive/5',          Icon: ShieldX },
  unknown: { label: 'OSE 未运行',  cls: 'border-border text-muted-foreground bg-muted/40',                    Icon: ShieldAlert },
};

const COMPAT_META: Record<CompatVerdict, { label: string; cls: string }> = {
  compatible:   { label: '兼容',     cls: 'border-status-success/40 text-status-success' },
  read_only:    { label: '只读兼容', cls: 'border-status-warning/40 text-status-warning' },
  incompatible: { label: '不兼容',   cls: 'border-destructive/40 text-destructive' },
};

export function ObjectStatusBar({
  shellMode, bucket, lockState, oseStatus, compat, objectName,
}: Props) {
  const sm = SHELL_META[shellMode];
  return (
    <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
      <Badge variant="outline" className={`flex items-center gap-1 ${sm.cls}`}>
        <sm.Icon className="w-3 h-3" />
        当前壳层:{sm.label}
      </Badge>
      {objectName && (
        <Badge variant="outline" className="font-mono">
          <Database className="w-3 h-3 mr-1 opacity-60" />
          {objectName}
        </Badge>
      )}
      {bucket && (
        <Badge variant="outline">类型:{BUCKET_LABEL[bucket]}</Badge>
      )}
      {lockState && (
        <Badge variant="outline" className={`flex items-center gap-1 ${LOCK_META[lockState].cls}`}>
          {lockState !== 'editable' && <Lock className="w-2.5 h-2.5" />}
          {LOCK_META[lockState].label}
        </Badge>
      )}
      {oseStatus && (
        <Badge variant="outline" className={`flex items-center gap-1 ${OSE_META[oseStatus].cls}`}>
          {(() => { const I = OSE_META[oseStatus].Icon; return <I className="w-3 h-3" />; })()}
          {OSE_META[oseStatus].label}
        </Badge>
      )}
      {compat && (
        <Badge variant="outline" className={COMPAT_META[compat].cls}>
          导入兼容:{COMPAT_META[compat].label}
        </Badge>
      )}
    </div>
  );
}
