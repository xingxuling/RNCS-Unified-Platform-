// Capability Asset · Chat 结果卡
import type { ChatCapabilityAssetInfo } from "@/lib/capability-assets/capabilityAssetChatBridge";

interface Props { info: ChatCapabilityAssetInfo }

const SAFETY_COLOR: Record<string, string> = {
  PASS: "text-emerald-500 border-emerald-500/40",
  WARN: "text-amber-500 border-amber-500/40",
  BLOCK: "text-rose-500 border-rose-500/40",
  NEEDS_REVIEW: "text-sky-400 border-sky-500/40",
};

const RISK_COLOR: Record<string, string> = {
  LOW: "text-emerald-500 border-emerald-500/40",
  MEDIUM: "text-amber-500 border-amber-500/40",
  HIGH: "text-orange-500 border-orange-500/40",
  CRITICAL: "text-rose-500 border-rose-500/40",
};

const SOURCE_COLOR: Record<string, string> = {
  INTERNAL_CAPABILITY: "text-emerald-400 border-emerald-500/40",
  EXTERNAL_CAPABILITY: "text-sky-400 border-sky-500/40",
  USER_CAPABILITY: "text-violet-400 border-violet-500/40",
};

export function ChatCapabilityAssetCard({ info }: Props) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Capability Asset Market · 能力资产市场
        </div>
        <a
          href="/system/capability-assets"
          className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground hover:text-foreground"
        >
          打开能力资产工作台
        </a>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/40 text-emerald-500">
          焦点 · {info.focusLabel}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground">
          内部 {info.totals.internal}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground">
          外部 {info.totals.external}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground">
          用户 {info.totals.user}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/40 text-emerald-500">
          可售 {info.totals.sellable}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-sky-500/40 text-sky-400">
          待审 {info.totals.needsReview}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-rose-500/40 text-rose-500">
          阻断 {info.totals.blocked}
        </span>
      </div>

      <div className="text-sm text-foreground/90 leading-relaxed">{info.summary}</div>

      {info.highlightedCandidates.length > 0 && (
        <div className="space-y-1">
          <div className="text-[11px] text-muted-foreground">候选能力</div>
          <div className="space-y-1">
            {info.highlightedCandidates.map((c) => (
              <div key={c.id} className="rounded-md border border-border/40 bg-muted/10 p-2 text-[11px] flex items-center gap-2 flex-wrap">
                <span className={`px-1.5 py-0.5 rounded border ${SOURCE_COLOR[c.sourceType] ?? "border-border/60 text-muted-foreground"}`}>
                  {c.sourceTypeLabel}
                </span>
                <span className="font-medium text-foreground/90">{c.cnTitle}</span>
                <span className="text-muted-foreground">· {c.packageTypeLabel}</span>
                <span className={`px-1.5 py-0.5 rounded border ${RISK_COLOR[c.risk] ?? ""}`}>{c.riskLabel}</span>
                <span className={`px-1.5 py-0.5 rounded border ${SAFETY_COLOR[c.safety] ?? ""}`}>{c.safetyLabel}</span>
                <span className="px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground">{c.installModeLabel}</span>
                <span className="px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground">{c.monetizationLabel}</span>
                {c.needsReview && (
                  <span className="px-1.5 py-0.5 rounded border border-sky-500/40 text-sky-400">需审核</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
        <div className="space-y-1">
          <div className="text-muted-foreground">允许</div>
          <ul className="space-y-0.5 list-disc pl-4">
            {info.safetyAllowed.slice(0, 4).map((s) => (
              <li key={s} className="text-emerald-500/90">{s}</li>
            ))}
          </ul>
        </div>
        <div className="space-y-1">
          <div className="text-muted-foreground">禁止</div>
          <ul className="space-y-0.5 list-disc pl-4">
            {info.safetyForbidden.slice(0, 4).map((s) => (
              <li key={s} className="text-rose-500/90">{s}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="text-[11px] text-muted-foreground">{info.workbenchHint}</div>
    </div>
  );
}
