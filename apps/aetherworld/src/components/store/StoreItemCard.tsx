import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { AetherStoreItem } from "@/lib/store/aetherStoreTypes";
import { StoreStatusBadge } from "./StoreStatusBadge";
import {
  storeDownload, storeInstall, storeEnable, storePurchase,
} from "@/lib/store/aetherStoreRuntime";
import { getCategoryMeta } from "@/constants/store/storeCategories";
import {
  getSourceGroup, STORE_SOURCE_GROUP_LABEL, STORE_SOURCE_GROUP_TONE,
} from "@/lib/store/storeSourceMapping";
import { StoreInstallPreviewDrawer } from "./StoreInstallPreviewDrawer";

interface Props { item: AetherStoreItem; compact?: boolean }

const RISK_TONE: Record<string, string> = {
  LOW: "border-border/40 text-muted-foreground",
  MEDIUM: "border-amber-400/40 text-amber-300",
  HIGH: "border-orange-400/40 text-orange-300",
  CRITICAL: "border-destructive/50 text-destructive",
};

const QA_TONE: Record<string, string> = {
  PASS: "border-emerald-400/40 text-emerald-300",
  WARN: "border-amber-400/40 text-amber-300",
  FAIL: "border-destructive/40 text-destructive",
  BLOCKED: "border-destructive/50 text-destructive",
  UNKNOWN: "border-border/40 text-muted-foreground",
};

function primaryAction(item: AetherStoreItem): { label: string; onClick: () => void } | null {
  switch (item.status) {
    case "AVAILABLE":
    case "UNINSTALLED":
      return { label: "下载", onClick: () => storeDownload(item.itemId) };
    case "DOWNLOADED":
      return { label: "安装", onClick: () => storeInstall(item.itemId) };
    case "INSTALLED":
    case "DISABLED":
      return { label: "启用", onClick: () => storeEnable(item.itemId) };
    case "ENABLED":
      return null;
    case "UPDATE_AVAILABLE":
      return { label: "更新", onClick: () => storeDownload(item.itemId) };
    case "PURCHASE_REQUIRED":
      return { label: "购买", onClick: () => storePurchase(item.itemId) };
    default:
      return null;
  }
}

/**
 * StoreItemCard — 应用商店式卡片
 * Hero icon · 名称 · 一句话描述
 * 标签行：来源（内部/外部/用户）+ 分类 + 风险 + QA
 * 元信息：版本 / 价格 / 作者
 * 操作：详情 · 安装预览 · 主操作
 */
export function StoreItemCard({ item, compact }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const action = primaryAction(item);
  const cat = getCategoryMeta(item.category);
  const group = getSourceGroup(item.source);
  const priceText =
    item.priceType === "FREE"
      ? "免费"
      : `${item.price ?? ""} ${item.currency ?? ""}`.trim() || "需购买";
  const initial = item.chineseName.slice(0, 1);
  const isHighRisk = item.riskLevel === "HIGH" || item.riskLevel === "CRITICAL";

  return (
    <>
      <div className="rounded-xl border border-border/50 bg-card/40 flex flex-col hover:border-border hover:bg-card/60 transition-all overflow-hidden group">
        {/* 1 · Header — 图标 + 名称 + 状态 */}
        <header className="px-4 pt-4 pb-3 flex items-start gap-3 border-b border-border/30">
          <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-primary/30 to-primary/5 border border-border/40 flex items-center justify-center text-base font-display shrink-0">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${STORE_SOURCE_GROUP_TONE[group]}`}>
                {STORE_SOURCE_GROUP_LABEL[group]}
              </span>
              <span className="text-[10px] text-muted-foreground truncate">{cat.chineseName}</span>
            </div>
            <h3 className="text-sm font-display truncate">{item.chineseName}</h3>
            <div className="text-[10px] text-muted-foreground truncate">{item.name} · v{item.version}</div>
          </div>
          <StoreStatusBadge status={item.status} />
        </header>

        {/* 2 · Body */}
        {!compact && (
          <div className="px-4 py-3 flex-1 space-y-3">
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.description}</p>
            <div className="flex flex-wrap gap-1.5">
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${RISK_TONE[item.riskLevel]}`}>
                风险 {item.riskLevel}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${QA_TONE[item.qaStatus]}`}>
                安全 {item.qaStatus}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-border/40 text-muted-foreground">
                {priceText}
              </span>
              {isHighRisk && (
                <span className="text-[10px] px-1.5 py-0.5 rounded border border-amber-400/40 text-amber-300">
                  需审核
                </span>
              )}
            </div>
          </div>
        )}

        {/* 3 · Footer */}
        <footer className="px-4 py-2.5 border-t border-border/30 flex items-center justify-between gap-2 bg-background/20">
          <Link
            to="/store/item/$id"
            params={{ id: item.itemId }}
            className="text-[11px] text-muted-foreground hover:text-foreground"
          >
            详情 →
          </Link>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPreviewOpen(true)}
              className="text-[11px] rounded border border-border/50 hover:border-border text-muted-foreground hover:text-foreground px-2 py-1"
            >
              安装预览
            </button>
            {action && (
              <button
                onClick={isHighRisk ? () => setPreviewOpen(true) : action.onClick}
                className="text-[11px] rounded border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary px-2.5 py-1"
                title={isHighRisk ? "高风险需先查看安装预览" : action.label}
              >
                {isHighRisk ? "查看后安装" : action.label}
              </button>
            )}
          </div>
        </footer>
      </div>
      <StoreInstallPreviewDrawer
        item={item}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}
