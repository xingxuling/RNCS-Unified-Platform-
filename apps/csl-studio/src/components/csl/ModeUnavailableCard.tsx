// ModeUnavailableCard — P6
// 让 enabledModes 缺失成为一个可识别的专门体验,而不是混在 OSE block 或 lockState 里。
// 用于:演示壳 / 工作区在尝试展示 stage / blocks / mapping 等模式但被 spec 关闭时。

import { ShieldAlert, EyeOff, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { CapabilityProfile, ViewMode } from '@/csl/capability/profile';

interface Props {
  /** 当前正在尝试使用的模式 */
  mode: ViewMode;
  profile: CapabilityProfile | null | undefined;
  /** 一个友好的中文模式名 */
  modeLabel?: string;
}

const DEFAULT_LABEL: Record<ViewMode, string> = {
  form: '表单视图',
  summary: '摘要视图',
  list: '列表视图',
  detail: '详情视图',
  dashboard: '仪表盘视图',
  stage: '阶段流程',
  blocks: '概念块视图',
  mapping: '映射表视图',
};

export function ModeUnavailableCard({ mode, profile, modeLabel }: Props) {
  if (!profile) return null;
  if (profile.enabledModes.includes(mode)) return null;

  const required = profile.modeConstraints[mode]?.requiredFeatures ?? [];
  const missing = required.filter(f => !profile.featureFlags[f]);
  const reasons: string[] = missing.map(f => {
    const why = profile.featureDisabledReason[f];
    return why ? `feature「${f}」不可用 — ${why}` : `feature「${f}」未启用`;
  });
  const label = modeLabel ?? DEFAULT_LABEL[mode] ?? mode;

  return (
    <div className="rounded border border-status-warning/40 bg-status-warning/5 p-2 space-y-1.5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-status-warning">
        <EyeOff className="w-3.5 h-3.5" />
        <span>模式未启用:{label}</span>
        <Badge variant="outline" className="text-[9px] font-mono ml-1 border-status-warning/40 text-status-warning">
          mode={mode}
        </Badge>
      </div>

      <div className="text-[11px] text-foreground/80 flex items-start gap-1">
        <Info className="w-3 h-3 mt-0.5 flex-shrink-0 opacity-70" />
        <span>
          这不是治理阻断,也不是锁定问题 —
          当前 spec 没有启用支撑此视图所需的能力,因此该入口被系统主动隐藏 / 禁用。
        </span>
      </div>

      {required.length > 0 && (
        <div className="text-[10px] space-y-0.5">
          <div className="font-semibold opacity-80">该模式依赖 feature:</div>
          <div className="font-mono pl-2">{required.join(' · ')}</div>
        </div>
      )}

      {reasons.length > 0 && (
        <div className="text-[10px] space-y-0.5">
          <div className="font-semibold opacity-80">缺失原因({reasons.length}):</div>
          <ul className="font-mono pl-2 space-y-0.5">
            {reasons.map((r, i) => <li key={i}>· {r}</li>)}
          </ul>
        </div>
      )}

      <div className="text-[10px] space-y-0.5 border-t border-status-warning/30 pt-1">
        <div>
          <span className="opacity-80 font-semibold">当前可用模式({profile.enabledModes.length}/8):</span>{' '}
          <span className="font-mono">{profile.enabledModes.join(' · ')}</span>
        </div>
        <div className="opacity-90">
          推荐动作:在 spec 中启用上述 feature,或切换到当前可用的模式查看。
        </div>
      </div>
    </div>
  );
}

/** 紧凑版徽标 — 用于代替按钮、标题旁,告诉用户「此入口因 mode 未启用而禁用」 */
export function ModeUnavailableBadge({ mode }: { mode: ViewMode }) {
  return (
    <Badge variant="outline" className="text-[9px] border-status-warning/40 text-status-warning gap-1">
      <ShieldAlert className="w-2.5 h-2.5" />
      mode 未启用
    </Badge>
  );
}
