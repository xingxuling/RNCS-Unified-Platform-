// ShellActionBar — P10
// 统一 Showcase / Compare / Viewer / Workspace 四个壳层的动作集合。
//
// 设计纪律:
//   - 所有动作语义/文案来自 ACTIONS (action-labels.ts) — 不允许各壳层自己起名。
//   - capability matrix 由 (shellMode, lockState, compatVerdict, oseStatus) 共同决定。
//   - 不可用动作必须显示并解释为什么不可用 (title + disabled),不要静默隐藏。
//   - 本组件只做"动作呈现 + 可用性派生",不做业务逻辑;具体回调由调用方传入。
//
// 不做的事:
//   - 不替代 ObjectStatusBar(那是状态条)
//   - 不替代 IncompatibilityDetailsPanel(那是详情对话)
//   - 不接管路由跳转(由调用方决定 Link/navigate)

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Eye, Columns3, Save, Copy, FileDown, FlaskConical, FolderOpen,
} from 'lucide-react';
import { ACTIONS } from '@/csl/ui/action-labels';
import type { ShellMode, LockKind, OseStatus } from '@/components/csl/ObjectStatusBar';
import type { CompatVerdict } from '@/csl/workspace/compat';

export interface ShellActionContext {
  shellMode: ShellMode;
  lockState: LockKind;
  compat?: CompatVerdict;
  oseStatus?: OseStatus;
  /** 该对象当前是否真的存在工作区(决定 openInPlayground) */
  hasWorkspace?: boolean;
}

export type ShellActionKey =
  | 'back'
  | 'openInViewer'
  | 'openInCompareSrc'
  | 'convertToWorkspace'
  | 'forkAsEditable'
  | 'openInPlayground'
  | 'backToShowcase'
  | 'exportSource'
  | 'exportSnapshot'
  | 'exportBundle'
  | 'exportCompareJSON';

export interface ShellActionState {
  enabled: boolean;
  /** 不可用时的人类可读原因(用于 title/tooltip) */
  reason?: string;
}

/**
 * capability matrix — 单一真相源。
 * 输出对每个动作的 enabled + reason。
 *
 * 规则一览:
 *   - editable + compatible:大部分动作允许
 *   - read_only:不可编辑、不可导出当前版本运行包,但可"另存为可编辑"
 *   - incompatible:不得运行/导出 bundle/导出源码,详情/转入(降级只读)/Compare/Viewer 仍允许
 *   - Viewer 壳:不允许 openInViewer 自身;不允许 exportBundle
 *   - Compare 壳:不直接暴露 convert/fork(回到原壳层执行);允许 exportCompareJSON
 *   - Showcase 壳:openInPlayground 仅在 hasWorkspace 时允许
 */
export function getShellCapability(
  ctx: ShellActionContext,
  key: ShellActionKey
): ShellActionState {
  const { shellMode, lockState, compat, hasWorkspace } = ctx;
  const incompat = compat === 'incompatible' || lockState === 'incompatible';
  const readOnly = lockState === 'read_only' || compat === 'read_only';

  switch (key) {
    case 'back':
      return { enabled: true };

    case 'openInViewer':
      if (shellMode === 'viewer') return { enabled: false, reason: '当前已在 Viewer 壳' };
      return { enabled: true };

    case 'openInCompareSrc':
      if (shellMode === 'compare') return { enabled: false, reason: '当前已在 Compare 壳' };
      return { enabled: true };

    case 'convertToWorkspace':
      // incompatible 也允许 — 会降级为只读副本
      if (shellMode === 'workspace') return { enabled: false, reason: '对象已在工作区' };
      return { enabled: true };

    case 'forkAsEditable':
      // 永远允许(物理复制),但如果对象 incompatible 仍降级为只读副本
      if (incompat) return { enabled: true, reason: '不兼容对象将以只读副本形式 fork' };
      return { enabled: true };

    case 'openInPlayground':
      if (!hasWorkspace) return { enabled: false, reason: '对象尚未在工作区 — 先「转入正式工作区」' };
      return { enabled: true };

    case 'backToShowcase':
      if (shellMode === 'showcase') return { enabled: false, reason: '当前已在演示壳' };
      return { enabled: true };

    case 'exportSource':
      if (incompat) return { enabled: false, reason: '不兼容对象不得导出源码' };
      return { enabled: true };

    case 'exportSnapshot':
      if (incompat) return { enabled: false, reason: '不兼容对象无运行结果,无法导出快照' };
      return { enabled: true };

    case 'exportBundle':
      if (shellMode === 'viewer') return { enabled: false, reason: 'Viewer 不提供运行包导出 — 先转入工作区' };
      if (incompat) return { enabled: false, reason: '不兼容对象不得导出当前版本运行包' };
      if (readOnly)  return { enabled: false, reason: '只读对象不得导出当前版本运行包' };
      return { enabled: true };

    case 'exportCompareJSON':
      if (shellMode !== 'compare') return { enabled: false, reason: '仅在 Compare 壳层可用' };
      return { enabled: true };
  }
}

interface ShellActionBarProps {
  ctx: ShellActionContext;
  /** 要显示的动作集合(按顺序);未列出的动作不渲染 */
  actions: ShellActionKey[];
  /** 各动作的回调 — 仅当 enabled 时被触发 */
  handlers: Partial<Record<ShellActionKey, () => void>>;
  /** 紧凑模式,默认 true */
  compact?: boolean;
}

const ICONS: Record<ShellActionKey, typeof ArrowLeft> = {
  back: ArrowLeft,
  openInViewer: Eye,
  openInCompareSrc: Columns3,
  convertToWorkspace: Save,
  forkAsEditable: Copy,
  openInPlayground: FolderOpen,
  backToShowcase: FlaskConical,
  exportSource: FileDown,
  exportSnapshot: FileDown,
  exportBundle: FileDown,
  exportCompareJSON: FileDown,
};

const LABELS: Record<ShellActionKey, string> = {
  back: '返回',
  openInViewer: ACTIONS.openInViewer,
  openInCompareSrc: ACTIONS.openInCompareSrc,
  convertToWorkspace: ACTIONS.convertToWorkspace,
  forkAsEditable: ACTIONS.forkAsEditable,
  openInPlayground: ACTIONS.openInPlayground,
  backToShowcase: ACTIONS.backToShowcase,
  exportSource: ACTIONS.exportSource,
  exportSnapshot: ACTIONS.exportSnapshot,
  exportBundle: ACTIONS.exportBundle,
  exportCompareJSON: ACTIONS.exportCompareJSON,
};

export function ShellActionBar({ ctx, actions, handlers, compact = true }: ShellActionBarProps) {
  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${compact ? 'text-xs' : 'text-sm'}`}>
      {actions.map(key => {
        const cap = getShellCapability(ctx, key);
        const Icon = ICONS[key];
        const label = LABELS[key];
        const handler = handlers[key];
        const disabled = !cap.enabled || !handler;
        const reason = cap.reason ?? (!handler ? '此壳层未提供该动作' : undefined);
        return (
          <Button
            key={key}
            variant={key === 'back' ? 'ghost' : 'outline'}
            size="sm"
            className="h-7 gap-1.5"
            onClick={handler}
            disabled={disabled}
            title={reason ?? label}
          >
            <Icon className="w-3 h-3" />
            <span>{label}</span>
            {disabled && reason && (
              <Badge variant="outline" className="ml-1 text-[9px] border-muted-foreground/30 text-muted-foreground">
                不可用
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
}
