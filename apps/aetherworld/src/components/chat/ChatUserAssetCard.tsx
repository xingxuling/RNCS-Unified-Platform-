// User Asset Upload · Chat 结果卡
import type { ChatUserAssetInfo } from "@/lib/user-asset-upload/userAssetChatBridge";

interface Props { info: ChatUserAssetInfo }

export function ChatUserAssetCard({ info }: Props) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          User Asset Upload Market · 用户上传出售
        </div>
        <a
          href="/system/user-assets"
          className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground hover:text-foreground"
        >
          打开上传出售工作台
        </a>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/40 text-emerald-500">
          焦点 · {info.focusLabel}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground">
          已上传 {info.totals.total}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground">
          商品草案 {info.totals.drafts}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-sky-500/40 text-sky-400">
          私有候选 {info.totals.privateCandidates}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-500/40 text-amber-400">
          待审 {info.totals.needsReview}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-rose-500/40 text-rose-400">
          阻断 {info.totals.blocked}
        </span>
      </div>

      <div className="text-[12px] text-foreground/85 leading-relaxed">{info.summary}</div>

      {info.recentAssets.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[11px] text-muted-foreground">最近资产</div>
          {info.recentAssets.map((a) => (
            <div key={a.id} className="rounded-md border border-border/40 bg-muted/10 p-2 text-[11px] space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-foreground/90 truncate">{a.fileName}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{a.typeLabel}</span>
                <span className="ml-auto px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground">
                  {a.safetyLabel}
                </span>
                <span className="px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground">
                  {a.ownershipLabel}
                </span>
                <span className="px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground">
                  {a.marketLabel}
                </span>
              </div>
              {a.blockedReasons.length > 0 && (
                <div className="text-rose-400 text-[10px]">阻断：{a.blockedReasons.join(" · ")}</div>
              )}
            </div>
          ))}
        </div>
      )}

      <details className="text-[11px] text-muted-foreground">
        <summary className="cursor-pointer hover:text-foreground">查看安全边界</summary>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="border border-emerald-500/30 rounded-md p-2">
            <div className="text-emerald-400 mb-1">允许</div>
            <ul className="space-y-0.5 list-disc pl-4 text-foreground/80">
              {info.safetyAllowed.map((s) => <li key={s}>{s}</li>)}
            </ul>
          </div>
          <div className="border border-rose-500/30 rounded-md p-2">
            <div className="text-rose-400 mb-1">禁止</div>
            <ul className="space-y-0.5 list-disc pl-4 text-foreground/80">
              {info.safetyForbidden.map((s) => <li key={s}>{s}</li>)}
            </ul>
          </div>
        </div>
      </details>

      <div className="text-[10px] text-muted-foreground">{info.workbenchHint}</div>
    </div>
  );
}
