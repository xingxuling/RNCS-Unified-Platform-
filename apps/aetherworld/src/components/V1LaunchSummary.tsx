import { Badge } from "@/components/ui/badge";
import {
  VERSION_STATUS_META,
  type VersionReadinessResult,
} from "@/lib/versionIterationCalculus";

interface Props {
  result: VersionReadinessResult;
}

export function V1LaunchSummary({ result }: Props) {
  const meta = VERSION_STATUS_META[result.releaseStatus];
  const nextAction = result.canMarkAsV1
    ? "Mark v1.0 Private Beta → 启动 Private Alpha（3–10 人）"
    : result.releaseStatus === "V0_9_RC"
    ? "Mark v0.9 RC → 收尾修复后再评估 v1.0"
    : "Fix Blockers → 解决阻断项后重新评估";

  return (
    <div className="aether-card-elevated p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            V1 Launch Summary · v1.0 发布摘要
          </div>
          <h3 className="font-display text-2xl gold-text mt-1">Aether Fate Engine</h3>
          <div className="text-sm text-muted-foreground mt-1">
            {result.recommendedVersion}
          </div>
        </div>
        <Badge
          variant="outline"
          className={
            result.canMarkAsV1
              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[11px]"
              : "bg-amber-500/15 text-amber-300 border-amber-500/30 text-[11px]"
          }
        >
          {meta.cn}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <SummaryBlock title="开放范围" items={result.stableModules.slice(0, 6)} />
        <SummaryBlock title="谨慎开放" items={result.betaModules.slice(0, 6)} tone="amber" />
        <SummaryBlock title="实验态（仅可信用户）" items={result.experimentalModules.slice(0, 6)} tone="fuchsia" />
        <SummaryBlock title="锁定" items={result.lockedModules} tone="rose" />
      </div>

      {result.releaseBlockers.length > 0 && (
        <div className="aether-card p-3">
          <div className="text-[10px] uppercase tracking-widest text-rose-300/80 mb-1">
            发布阻断
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
            {result.releaseBlockers.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      {result.requiredFixesBeforeV1.length > 0 && (
        <div className="aether-card p-3">
          <div className="text-[10px] uppercase tracking-widest text-amber-300/80 mb-1">
            进入 v1.0 前的修复项
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
            {result.requiredFixesBeforeV1.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="aether-card p-3">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
          下一步动作
        </div>
        <div className="text-sm">{nextAction}</div>
      </div>

      <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
        v1.0 表示「私密内测候选版」，不代表公开正式发布。系统仍处于结构化预测实验阶段，所有预测必须经过回验修正。本系统不构成医疗、法律、金融、投资、心理诊断建议。真实主体数据默认仅本地保存。
      </p>
    </div>
  );
}

function SummaryBlock({
  title,
  items,
  tone = "default",
}: {
  title: string;
  items: string[];
  tone?: "default" | "amber" | "fuchsia" | "rose";
}) {
  const toneClass =
    tone === "amber"
      ? "text-amber-300/80"
      : tone === "fuchsia"
      ? "text-fuchsia-300/80"
      : tone === "rose"
      ? "text-rose-300/80"
      : "text-muted-foreground";
  return (
    <div className="aether-card p-3">
      <div className={`text-[10px] uppercase tracking-widest mb-1 ${toneClass}`}>{title}</div>
      {items.length === 0 ? (
        <div className="text-xs text-muted-foreground">—</div>
      ) : (
        <ul className="text-xs space-y-1">
          {items.map((i) => (
            <li key={i}>· {i}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
