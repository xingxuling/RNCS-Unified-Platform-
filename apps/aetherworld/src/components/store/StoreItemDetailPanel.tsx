import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  getItem, subscribeAetherStore,
  storeDownload, storeInstall, storeEnable, storeDisable,
  storeUninstall, storeUpdate, storePurchase,
} from "@/lib/store/aetherStoreRuntime";
import { StoreStatusBadge } from "./StoreStatusBadge";
import { StoreInstallPreviewDrawer } from "./StoreInstallPreviewDrawer";
import { getCategoryMeta } from "@/constants/store/storeCategories";
import {
  getSourceGroup, STORE_SOURCE_GROUP_LABEL, STORE_SOURCE_GROUP_TONE,
} from "@/lib/store/storeSourceMapping";
import type { AetherStoreItem } from "@/lib/store/aetherStoreTypes";

interface Props { itemId: string }

type TabId = "overview" | "preview" | "permissions" | "manifest" | "ownership" | "versions";

const RISK_CLASS: Record<string, string> = {
  LOW: "text-muted-foreground",
  MEDIUM: "text-amber-300",
  HIGH: "text-orange-300",
  CRITICAL: "text-destructive",
};

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "简介" },
  { id: "preview", label: "预览" },
  { id: "permissions", label: "权限与风险" },
  { id: "manifest", label: "Manifest" },
  { id: "ownership", label: "所有权 / License" },
  { id: "versions", label: "版本与更新" },
];

export function StoreItemDetailPanel({ itemId }: Props) {
  const [, setTick] = useState(0);
  const [tab, setTab] = useState<TabId>("overview");
  const [previewOpen, setPreviewOpen] = useState(false);
  useEffect(() => subscribeAetherStore(() => setTick((n) => n + 1)), []);
  const item = getItem(itemId);

  if (!item) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-muted-foreground">未找到该商店条目。</div>
        <Link to="/store" className="text-xs text-primary hover:underline">← 返回商店</Link>
      </div>
    );
  }

  const cat = getCategoryMeta(item.category);
  const group = getSourceGroup(item.source);
  const isHighRisk = item.riskLevel === "HIGH" || item.riskLevel === "CRITICAL";

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <header className="rounded-2xl border border-border/50 bg-gradient-to-br from-card/80 to-card/20 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/30 to-primary/5 border border-border/40 flex items-center justify-center text-2xl font-display shrink-0">
            {item.chineseName.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${STORE_SOURCE_GROUP_TONE[group]}`}>
                {STORE_SOURCE_GROUP_LABEL[group]}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-border/40 text-muted-foreground">
                {cat.chineseName}
              </span>
              <span className="text-[10px] text-muted-foreground">{item.name} · v{item.version}</span>
            </div>
            <h1 className="text-2xl font-display">{item.chineseName}</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">{item.description}</p>
          </div>
          <StoreStatusBadge status={item.status} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setPreviewOpen(true)}
            className="text-xs rounded border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5"
          >
            安装预览
          </button>
          <ActionBtn label="下载" onClick={() => storeDownload(item.itemId)} disabled={isHighRisk} />
          <ActionBtn label="安装" onClick={() => storeInstall(item.itemId)} disabled={isHighRisk} />
          <ActionBtn label="启用" onClick={() => storeEnable(item.itemId)} primary />
          <ActionBtn label="停用" onClick={() => storeDisable(item.itemId)} />
          <ActionBtn label="更新" onClick={() => storeUpdate(item.itemId)} />
          <ActionBtn label="卸载" onClick={() => storeUninstall(item.itemId)} />
          {item.priceType !== "FREE" && (
            <ActionBtn label="购买" onClick={() => storePurchase(item.itemId)} />
          )}
          {item.detailRoute && (
            <Link
              to={item.detailRoute}
              className="text-xs rounded border border-border/50 px-3 py-1.5 text-muted-foreground hover:text-foreground"
            >
              进入原页面
            </Link>
          )}
        </div>

        {isHighRisk && (
          <p className="mt-3 text-[11px] text-amber-300">
            该能力包风险等级为 {item.riskLevel}，请先查看「安装预览」并经过审核。
          </p>
        )}
      </header>

      {/* Tabs */}
      <div className="border-b border-border/40 flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`text-xs px-3 py-2 border-b-2 -mb-px whitespace-nowrap transition-colors ${
              tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === "overview" && <OverviewTab item={item} />}
        {tab === "preview" && <PreviewTab item={item} />}
        {tab === "permissions" && <PermissionsTab item={item} />}
        {tab === "manifest" && <ManifestTab item={item} />}
        {tab === "ownership" && <OwnershipTab item={item} />}
        {tab === "versions" && <VersionsTab item={item} />}
      </div>

      <div className="pt-4 border-t border-border/40">
        <Link to="/store" className="text-xs text-muted-foreground hover:text-foreground">← 返回商店</Link>
      </div>

      <StoreInstallPreviewDrawer item={item} open={previewOpen} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}

function OverviewTab({ item }: { item: AetherStoreItem }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <Meta label="版本" value={`v${item.version}`} />
        <Meta label="作者" value={item.author} />
        <Meta label="来源" value={item.source} />
        <Meta label="授权" value={item.licenseType} />
        <Meta label="价格" value={item.priceType === "FREE" ? "免费" : `${item.price ?? ""} ${item.currency ?? ""}`.trim() || "需购买"} />
        <Meta label="QA" value={item.qaStatus} />
        <Meta label="风险" value={item.riskLevel} />
        <Meta label="标签" value={item.tags.join(" · ") || "—"} />
      </div>
      <Section title="这个能力包能做什么">
        <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
      </Section>
      <Section title="提供的接口">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <ProvidedList label="对象" items={item.providedObjectTypes} />
          <ProvidedList label="命令" items={item.providedCommands} />
          <ProvidedList label="路由" items={item.providedRoutes} />
        </div>
      </Section>
    </div>
  );
}

function PreviewTab({ item }: { item: AetherStoreItem }) {
  const cat = item.category;
  const previewLabel =
    cat === "MODEL" ? "模型预览（Provider / 参数 / 接入方式）"
    : cat === "KNOWLEDGE" ? "数据集 / 知识包预览（样本与格式）"
    : cat === "WORLD" ? "世界包预览（角色 / 事件 / 资源）"
    : cat === "APP_TEMPLATE" ? "应用模板预览（页面与工作流）"
    : cat === "CODE_TEMPLATE" ? "代码模板预览（结构与片段）"
    : cat === "MUSIC_STORY" ? "创作包预览（歌词 / 剧情）"
    : cat === "PLUGIN" ? "插件预览（运行时与扩展）"
    : "能力预览";

  return (
    <div className="space-y-4">
      <Section title={previewLabel}>
        <p className="text-xs text-muted-foreground">
          预览仅展示元信息与公开摘要，不会执行任何脚本，不会调用外部 API，不会泄漏敏感内容。
        </p>
      </Section>
      <Section title="提供的能力">
        {item.providedObjectTypes.length + item.providedCommands.length + item.providedRoutes.length === 0
          ? <Empty text="未声明对外能力。" />
          : <ul className="text-xs space-y-1">
              {item.providedRoutes.map((r) => <li key={r} className="border border-border/40 rounded px-2 py-1">路由 · {r}</li>)}
              {item.providedCommands.map((c) => <li key={c} className="border border-border/40 rounded px-2 py-1">命令 · {c}</li>)}
              {item.providedObjectTypes.map((o) => <li key={o} className="border border-border/40 rounded px-2 py-1">对象 · {o}</li>)}
            </ul>}
      </Section>
      <Section title="预留示例">
        <div className="text-[11px] text-muted-foreground border border-dashed border-border/40 rounded p-3">
          复制 Prompt / 导入 JSON / 下载文件 / API 接入示例将在下一个版本接入。
        </div>
      </Section>
    </div>
  );
}

function PermissionsTab({ item }: { item: AetherStoreItem }) {
  return (
    <div className="space-y-4">
      <Section title="风险概览">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <Meta label="风险等级" value={item.riskLevel} valueClass={RISK_CLASS[item.riskLevel]} />
          <Meta label="安全状态" value={item.qaStatus} />
          <Meta label="所需系统" value={item.providedRoutes.length ? `${item.providedRoutes.length} 项` : "—"} />
          <Meta label="是否需要审核" value={item.riskLevel === "CRITICAL" ? "是" : "否"} />
        </div>
      </Section>
      <Section title="所需权限">
        {item.permissions.length === 0
          ? <Empty text="不申请额外权限。" />
          : <ul className="space-y-1 text-sm">
              {item.permissions.map((p) => (
                <li key={p.permissionId} className="border border-border/40 rounded px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span>{p.chineseName} <span className="text-[11px] text-muted-foreground">{p.name}</span></span>
                    <span className={`text-[11px] ${RISK_CLASS[p.riskLevel]}`}>{p.riskLevel}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                </li>
              ))}
            </ul>}
      </Section>
      <Section title="依赖">
        {item.dependencies.length === 0
          ? <Empty text="无显式依赖。" />
          : <ul className="space-y-1 text-sm">
              {item.dependencies.map((d) => (
                <li key={d.dependencyId} className="flex items-center justify-between border border-border/40 rounded px-3 py-2">
                  <span>{d.dependencyName}<span className="text-muted-foreground ml-2 text-[11px]">{d.dependencyType}</span></span>
                  <span className="text-[11px] text-muted-foreground">{d.required ? "必需" : "可选"}{d.minVersion ? ` · ≥ v${d.minVersion}` : ""}</span>
                </li>
              ))}
            </ul>}
      </Section>
    </div>
  );
}

function ManifestTab({ item }: { item: AetherStoreItem }) {
  const manifest = {
    itemId: item.itemId,
    name: item.name,
    chineseName: item.chineseName,
    version: item.version,
    source: item.source,
    category: item.category,
    itemType: item.itemType,
    licenseType: item.licenseType,
    permissions: item.permissions.map((p) => p.permissionId),
    dependencies: item.dependencies.map((d) => d.dependencyId),
    providedRoutes: item.providedRoutes,
    providedCommands: item.providedCommands,
    providedObjectTypes: item.providedObjectTypes,
    qaStatus: item.qaStatus,
    riskLevel: item.riskLevel,
    backingPackageId: item.backingPackageId,
  };
  const json = JSON.stringify(manifest, null, 2);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => { void navigator.clipboard.writeText(json); }}
          className="text-[11px] rounded border border-border/50 hover:border-border px-2 py-1 text-muted-foreground hover:text-foreground"
        >
          复制
        </button>
      </div>
      <pre className="text-[11px] bg-background/40 border border-border/40 rounded p-3 overflow-auto max-h-96">{json}</pre>
    </div>
  );
}

function OwnershipTab({ item }: { item: AetherStoreItem }) {
  return (
    <div className="space-y-4">
      <Section title="所有权">
        <Meta label="来源" value={item.source} />
        <p className="text-[11px] text-muted-foreground mt-2">
          BUILT_IN / OFFICIAL 属于 Aetherworld 自有；MARKETPLACE 来自外部；COMMUNITY / LOCAL 由用户声明所有权。
        </p>
      </Section>
      <Section title="授权信息">
        <Meta label="License" value={item.licenseType || "—"} />
        <p className="text-[11px] text-muted-foreground mt-2">
          用户上传资产需在「上传出售」处签署所有权声明，授权未明者不允许出售。
        </p>
      </Section>
    </div>
  );
}

function VersionsTab({ item }: { item: AetherStoreItem }) {
  return (
    <div className="space-y-3">
      <ul className="text-xs space-y-1.5">
        <li className="border border-border/40 rounded px-3 py-2 flex items-center justify-between">
          <span>当前版本 v{item.version}</span>
          <span className="text-muted-foreground">{item.updatedAt}</span>
        </li>
        <li className="border border-dashed border-border/40 rounded px-3 py-2 text-muted-foreground">
          首次上架 · {item.createdAt}
        </li>
      </ul>
      <p className="text-[11px] text-muted-foreground">完整变更日志将在公开发布后接入。</p>
    </div>
  );
}

// ===== small atoms =====

function Meta({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="border border-border/40 rounded px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-sm mt-0.5 truncate ${valueClass ?? ""}`}>{value || "—"}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-display">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-xs text-muted-foreground border border-dashed border-border/40 rounded p-3">{text}</div>;
}

function ProvidedList({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="border border-border/40 rounded p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
      {items.length === 0
        ? <div className="text-muted-foreground">—</div>
        : <ul className="space-y-0.5">{items.map((i) => <li key={i} className="truncate">{i}</li>)}</ul>}
    </div>
  );
}

function ActionBtn({ label, onClick, primary, disabled }: { label: string; onClick: () => void; primary?: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-xs rounded border px-3 py-1.5 transition-colors ${
        disabled ? "border-border/30 text-muted-foreground/50 cursor-not-allowed"
        : primary
          ? "border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary"
          : "border-border/50 hover:border-border text-muted-foreground hover:text-foreground"
      }`}
      title={disabled ? "高风险条目请先查看安装预览" : undefined}
    >
      {label}
    </button>
  );
}
