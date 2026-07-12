import { useEffect } from "react";
import type { AetherStoreItem } from "@/lib/store/aetherStoreTypes";
import { getCategoryMeta } from "@/constants/store/storeCategories";
import {
  storeDownload, storeInstall, storeEnable,
} from "@/lib/store/aetherStoreRuntime";
import { getSourceGroup, STORE_SOURCE_GROUP_LABEL } from "@/lib/store/storeSourceMapping";

interface Props {
  item: AetherStoreItem;
  open: boolean;
  onClose: () => void;
}

const RISK_CLASS: Record<string, string> = {
  LOW: "text-muted-foreground",
  MEDIUM: "text-amber-300",
  HIGH: "text-orange-300",
  CRITICAL: "text-destructive",
};

/**
 * Install Preview Drawer
 * 展示：将安装到哪些系统、所需权限、将创建的对象、是否调用外部 API、
 *     数据读写、风险、blockedReasons。
 * 高风险条目不显示「一键安装」，只显示「生成安装计划 / 需要审核」。
 */
export function StoreInstallPreviewDrawer({ item, open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const cat = getCategoryMeta(item.category);
  const group = getSourceGroup(item.source);
  const isHighRisk = item.riskLevel === "HIGH" || item.riskLevel === "CRITICAL";
  const isBlocked = item.status === "BLOCKED" || item.status === "BROKEN";
  const calledExternal = item.permissions.some(
    (p) => /api|network|fetch|外部|联网/i.test(p.name + p.chineseName + p.description),
  );
  const writesData = item.permissions.some(
    (p) => /write|写|存储|save|create/i.test(p.name + p.chineseName + p.description),
  );

  const blockedReasons: string[] = [];
  if (isBlocked) blockedReasons.push(`当前状态为 ${item.status}，无法安装。`);
  if (item.qaStatus === "FAIL" || item.qaStatus === "BLOCKED") blockedReasons.push("QA 状态不通过。");
  if (item.riskLevel === "CRITICAL") blockedReasons.push("风险等级为 CRITICAL，必须经过审核。");

  const canQuickInstall = !isHighRisk && !isBlocked && blockedReasons.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/70 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div
        className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border/60 rounded-t-2xl sm:rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="px-5 py-4 border-b border-border/40 flex items-start justify-between gap-3 sticky top-0 bg-card/95 backdrop-blur z-10">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              安装预览 · {STORE_SOURCE_GROUP_LABEL[group]} · {cat.chineseName}
            </div>
            <h2 className="text-base font-display mt-1 truncate">{item.chineseName}</h2>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 border border-border/40 rounded"
          >
            关闭
          </button>
        </header>

        {/* Risk summary */}
        <div className="px-5 py-3 border-b border-border/30 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <Cell label="风险" value={item.riskLevel} className={RISK_CLASS[item.riskLevel]} />
          <Cell label="安全" value={item.qaStatus} />
          <Cell label="价格" value={item.priceType === "FREE" ? "免费" : "需购买"} />
          <Cell label="作者" value={item.author || "—"} />
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* 将安装到哪些系统 */}
          <Block title="将安装到哪些系统">
            {item.providedRoutes.length === 0
              ? <Empty text="未声明安装目标，仅作引用。" />
              : <ul className="text-xs space-y-1">
                  {item.providedRoutes.map((r) => (
                    <li key={r} className="border border-border/40 rounded px-2 py-1 truncate">{r}</li>
                  ))}
                </ul>}
          </Block>

          {/* 所需权限 */}
          <Block title="所需权限">
            {item.permissions.length === 0
              ? <Empty text="不申请额外权限。" />
              : <ul className="text-xs space-y-1.5">
                  {item.permissions.map((p) => (
                    <li key={p.permissionId} className="border border-border/40 rounded px-2 py-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate">{p.chineseName}</span>
                        <span className={`text-[10px] ${RISK_CLASS[p.riskLevel]}`}>{p.riskLevel}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{p.description}</div>
                    </li>
                  ))}
                </ul>}
          </Block>

          {/* 将创建哪些对象 */}
          <Block title="将创建哪些对象">
            {item.providedObjectTypes.length === 0
              ? <Empty text="未声明会创建对象。" />
              : <div className="flex flex-wrap gap-1.5">
                  {item.providedObjectTypes.map((o) => (
                    <span key={o} className="text-[11px] px-2 py-0.5 rounded border border-border/40 text-muted-foreground">{o}</span>
                  ))}
                </div>}
          </Block>

          {/* 外部 API / 数据 */}
          <Block title="数据与外部调用">
            <ul className="text-xs space-y-1">
              <li className="flex items-center justify-between border border-border/40 rounded px-2 py-1">
                <span>是否调用外部 API</span>
                <span className={calledExternal ? "text-amber-300" : "text-muted-foreground"}>
                  {calledExternal ? "是（请确认数据外传）" : "否"}
                </span>
              </li>
              <li className="flex items-center justify-between border border-border/40 rounded px-2 py-1">
                <span>是否读取 / 写入数据</span>
                <span className={writesData ? "text-amber-300" : "text-muted-foreground"}>
                  {writesData ? "是" : "仅读取（或无）"}
                </span>
              </li>
            </ul>
          </Block>

          {/* 阻断原因 */}
          {blockedReasons.length > 0 && (
            <Block title="阻断原因">
              <ul className="text-xs space-y-1">
                {blockedReasons.map((r, i) => (
                  <li key={i} className="border border-destructive/40 bg-destructive/5 text-destructive rounded px-2 py-1">{r}</li>
                ))}
              </ul>
            </Block>
          )}
        </div>

        {/* Footer actions */}
        <footer className="px-5 py-3 border-t border-border/40 flex flex-wrap items-center justify-end gap-2 sticky bottom-0 bg-card/95 backdrop-blur">
          <button
            onClick={onClose}
            className="text-xs rounded border border-border/50 hover:border-border text-muted-foreground hover:text-foreground px-3 py-1.5"
          >
            取消
          </button>
          {!canQuickInstall ? (
            <button
              disabled
              className="text-xs rounded border border-amber-400/40 bg-amber-400/10 text-amber-300 px-3 py-1.5 cursor-not-allowed"
              title="高风险或被阻断，需提交审核或人工确认"
            >
              {blockedReasons.length > 0 ? "已阻断 · 无法安装" : "需要审核 · 生成安装计划"}
            </button>
          ) : (
            <button
              onClick={() => {
                if (item.status === "AVAILABLE" || item.status === "UNINSTALLED") storeDownload(item.itemId);
                else if (item.status === "DOWNLOADED") storeInstall(item.itemId);
                else if (item.status === "INSTALLED" || item.status === "DISABLED") storeEnable(item.itemId);
                onClose();
              }}
              className="text-xs rounded border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5"
            >
              确认安装
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

function Cell({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="border border-border/40 rounded px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-xs mt-0.5 truncate ${className ?? ""}`}>{value}</div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-display text-muted-foreground uppercase tracking-wider">{title}</h3>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-[11px] text-muted-foreground border border-dashed border-border/40 rounded p-2">{text}</div>;
}
