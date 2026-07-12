// User Asset Upload Market · 工作台 · /system/user-assets
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  USER_UPLOADED_ASSET_TYPE_LABEL,
  USER_ASSET_SAFETY_LABEL,
  USER_ASSET_OWNERSHIP_LABEL,
  USER_ASSET_MARKET_STATUS_LABEL,
  USER_ASSET_DECLARATION_LABEL,
  USER_ASSET_PRICING_LABEL,
  USER_ASSET_INSTALL_LABEL,
  type UserUploadedAsset,
  type UserAssetDeclarationType,
  type UserAssetInstallMode,
  type UserAssetPricingSuggestion,
} from "@/lib/user-asset-upload/userAssetUploadTypes";
import {
  ingestSingleFile,
  ingestZipFile,
  ingestFolder,
  declareOwnership,
  buildDraftBundle,
  listUserAssets,
  listListings,
  listReviews,
  analyticsSummary,
} from "@/lib/user-asset-upload/userAssetUploadRuntime";
import {
  USER_ASSET_SAFETY_ALLOWED,
  USER_ASSET_SAFETY_FORBIDDEN,
  USER_ASSET_BLOCKED_EXTENSIONS,
} from "@/lib/user-asset-upload/userAssetSafetyPolicy";

export const Route = createFileRoute("/system/user-assets")({
  head: () => ({
    meta: [
      { title: "用户上传出售 · 系统 · Aetherworld" },
      { name: "description", content: "用户上传文件、声明所有权、生成商品草案，进入私有商店候选。不真实支付、不真实公开上架、不自动执行。" },
    ],
  }),
  component: UserAssetsPage,
});

const DECLARATION_OPTIONS: UserAssetDeclarationType[] = [
  "ORIGINAL_WORK",
  "HAS_RESALE_RIGHTS",
  "OPEN_SOURCE_LICENSE_ALLOWED",
  "DERIVATIVE_WITH_PERMISSION",
  "PRIVATE_USE_ONLY",
  "UNKNOWN",
];

const PRICING_OPTIONS: UserAssetPricingSuggestion[] = [
  "FREE", "PAID", "SUBSCRIPTION", "ENTERPRISE", "PRIVATE", "NOT_FOR_SALE",
];

const INSTALL_OPTIONS: UserAssetInstallMode[] = [
  "COPY_PROMPT", "DOWNLOAD_FILE", "IMPORT_JSON", "LOCAL_ONLY", "REFERENCE_ONLY", "ENTERPRISE_CONTACT",
];

function UserAssetsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assets = useMemo(() => listUserAssets(), []);
  const stats = useMemo(() => analyticsSummary(), []);
  const listings = useMemo(() => listListings(), []);
  const reviews = useMemo(() => listReviews(), []);
  // 强制依赖 refresh tick
  void assets; void stats; void listings; void reviews;

  const currentAssets = listUserAssets();
  const currentStats = analyticsSummary();
  const currentListings = listListings();
  const currentReviews = listReviews();

  const handleFiles = useCallback(async (files: FileList | null, mode: "FILE" | "ZIP" | "FOLDER") => {
    if (!files || files.length === 0) return;
    setBusy(true); setError(null);
    try {
      const arr = Array.from(files);
      if (mode === "FOLDER" && arr.length > 1) {
        await ingestFolder(arr);
      } else {
        for (const f of arr) {
          const isZip = /\.zip$/i.test(f.name);
          if (isZip) await ingestZipFile(f);
          else await ingestSingleFile(f);
        }
      }
      refresh();
    } catch (e: any) {
      setError(e?.message ?? "上传失败");
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const handleDeclare = useCallback((assetId: string, decl: UserAssetDeclarationType) => {
    declareOwnership(assetId, decl, decl !== "UNKNOWN");
    refresh();
  }, [refresh]);

  const [draftOptions, setDraftOptions] = useState<Record<string, { install: UserAssetInstallMode; pricing: UserAssetPricingSuggestion }>>({});

  const handleDraft = useCallback((assetId: string) => {
    const opt = draftOptions[assetId] ?? { install: "REFERENCE_ONLY", pricing: "PRIVATE" };
    buildDraftBundle(assetId, { installMode: opt.install, pricing: opt.pricing });
    refresh();
  }, [draftOptions, refresh]);

  const blockedExt = useMemo(() => Array.from(USER_ASSET_BLOCKED_EXTENSIONS).slice(0, 12).join(" / "), []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <header className="space-y-2">
        <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Aether User Asset Upload Market · v0.1
        </div>
        <h1 className="text-2xl font-semibold">用户上传出售</h1>
        <p className="text-sm text-muted-foreground">
          上传 Prompt / 模板 / 数据集 / 世界 / 角色 / Workflow / Agent / 训练包 / 企业方案 → 资产化为商品草案。
          本轮不真实支付、不真实公开上架、不自动发布、不自动解压执行。
        </p>
        <div className="flex items-center gap-2 flex-wrap text-[11px]">
          <Link to="/system/capability-assets" className="px-2 py-1 rounded border border-border/60 text-muted-foreground hover:text-foreground">
            ↗ 能力资产市场
          </Link>
          <Link to="/store/private" className="px-2 py-1 rounded border border-border/60 text-muted-foreground hover:text-foreground">
            ↗ 私有商店
          </Link>
          <Link to="/store" className="px-2 py-1 rounded border border-border/60 text-muted-foreground hover:text-foreground">
            ↗ Aether Store
          </Link>
        </div>
      </header>

      {/* 统计 */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[12px]">
        <Stat label="已上传" value={currentStats.total} />
        <Stat label="商品草案" value={currentListings.length} />
        <Stat label="私有候选" value={currentStats.privateCandidates} tone="emerald" />
        <Stat label="待审核" value={currentAssets.filter((a) => a.marketStatus === "NEEDS_REVIEW").length} tone="sky" />
        <Stat label="阻断" value={currentAssets.filter((a) => a.safetyStatus === "BLOCK").length} tone="rose" />
      </section>

      {/* 上传区 */}
      <section className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
        <div className="text-sm font-medium">① 上传文件</div>
        <div className="text-[11px] text-muted-foreground">
          支持 txt / md / pdf / docx / json / jsonl / csv / 代码模板 / 图片 / 音频 / zip。
          高危后缀直接阻断：{blockedExt}…
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
            className="text-[12px] px-3 py-1.5 rounded-full border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50"
          >
            选择文件（含 zip）
          </button>
          <button
            disabled={busy}
            onClick={() => folderInputRef.current?.click()}
            className="text-[12px] px-3 py-1.5 rounded-full border border-border/60 text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            选择文件夹
          </button>
          {busy && <span className="text-[11px] text-muted-foreground">处理中…</span>}
          {error && <span className="text-[11px] text-rose-400">{error}</span>}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files, "FILE")}
        />
        <input
          ref={folderInputRef}
          type="file"
          multiple
          // @ts-expect-error - webkitdirectory 是非标准属性
          webkitdirectory="true"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files, "FOLDER")}
        />
      </section>

      {/* 资产列表 */}
      <section className="space-y-2">
        <div className="text-sm font-medium">② 已上传资产（{currentAssets.length}）</div>
        {currentAssets.length === 0 ? (
          <div className="text-[12px] text-muted-foreground border border-dashed border-border/40 rounded-md p-6 text-center">
            还没有上传任何文件。点上方按钮开始。
          </div>
        ) : (
          currentAssets.map((a) => (
            <AssetRow
              key={a.id}
              asset={a}
              draftOption={draftOptions[a.id] ?? { install: "REFERENCE_ONLY", pricing: "PRIVATE" }}
              onChangeDraftOption={(opt) => setDraftOptions((prev) => ({ ...prev, [a.id]: opt }))}
              onDeclare={(d) => handleDeclare(a.id, d)}
              onDraft={() => handleDraft(a.id)}
            />
          ))
        )}
      </section>

      {/* 商品草案 */}
      {currentListings.length > 0 && (
        <section className="space-y-2">
          <div className="text-sm font-medium">③ 商品草案（{currentListings.length}）</div>
          <div className="space-y-2">
            {currentListings.slice(0, 12).map((l) => (
              <div key={l.id} className="rounded-md border border-border/40 bg-muted/10 p-3 text-[12px] space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{l.title}</span>
                  <span className="text-muted-foreground">· {USER_ASSET_PRICING_LABEL[l.pricingSuggestion]}</span>
                  <span className="text-muted-foreground">· {USER_ASSET_INSTALL_LABEL[l.installMode]}</span>
                </div>
                <div className="text-[11px] text-muted-foreground">{l.subtitle}</div>
                <div className="text-[11px] text-foreground/80">{l.description}</div>
                {l.safetyNotes.length > 0 && (
                  <div className="text-[10px] text-amber-400">安全：{l.safetyNotes.join(" · ")}</div>
                )}
                {l.ownershipNotes.length > 0 && (
                  <div className="text-[10px] text-muted-foreground">所有权：{l.ownershipNotes.join(" · ")}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 审核 / 阻断 */}
      {currentReviews.length > 0 && (
        <section className="space-y-2">
          <div className="text-sm font-medium">④ 审核与阻断</div>
          {currentReviews.slice(0, 12).map((r) => (
            <div key={r.id} className={`rounded-md border p-3 text-[12px] space-y-1 ${
              r.reviewStatus === "PASS" ? "border-emerald-500/40 bg-emerald-500/5" :
              r.reviewStatus === "WARN" ? "border-amber-500/40 bg-amber-500/5" :
              r.reviewStatus === "NEEDS_REVIEW" ? "border-sky-500/40 bg-sky-500/5" :
              "border-rose-500/40 bg-rose-500/5"
            }`}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{r.reviewStatus}</span>
                <span className="text-muted-foreground">· 资产 {r.assetId.slice(0, 16)}</span>
                <span className="text-muted-foreground">· 建议 {USER_ASSET_MARKET_STATUS_LABEL[r.recommendedMarketStatus]}</span>
              </div>
              {r.safetyIssues.length > 0 && <div className="text-[11px] text-rose-400">安全：{r.safetyIssues.join(" · ")}</div>}
              {r.ownershipIssues.length > 0 && <div className="text-[11px] text-amber-400">所有权：{r.ownershipIssues.join(" · ")}</div>}
              {r.contentIssues.length > 0 && <div className="text-[11px] text-muted-foreground">内容：{r.contentIssues.join(" · ")}</div>}
              {r.notes && <div className="text-[11px] text-muted-foreground">{r.notes}</div>}
            </div>
          ))}
        </section>
      )}

      {/* 安全边界 */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px]">
        <div className="border border-emerald-500/30 rounded-md p-3">
          <div className="text-emerald-400 mb-2">允许</div>
          <ul className="space-y-1 list-disc pl-4 text-foreground/85">
            {USER_ASSET_SAFETY_ALLOWED.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </div>
        <div className="border border-rose-500/30 rounded-md p-3">
          <div className="text-rose-400 mb-2">禁止</div>
          <ul className="space-y-1 list-disc pl-4 text-foreground/85">
            {USER_ASSET_SAFETY_FORBIDDEN.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "emerald" | "sky" | "rose" }) {
  const color = tone === "emerald" ? "text-emerald-400 border-emerald-500/40"
    : tone === "sky" ? "text-sky-400 border-sky-500/40"
    : tone === "rose" ? "text-rose-400 border-rose-500/40"
    : "text-foreground border-border/60";
  return (
    <div className={`rounded-md border ${color} p-3`}>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function AssetRow({
  asset, draftOption, onChangeDraftOption, onDeclare, onDraft,
}: {
  asset: UserUploadedAsset;
  draftOption: { install: UserAssetInstallMode; pricing: UserAssetPricingSuggestion };
  onChangeDraftOption: (opt: { install: UserAssetInstallMode; pricing: UserAssetPricingSuggestion }) => void;
  onDeclare: (d: UserAssetDeclarationType) => void;
  onDraft: () => void;
}) {
  const isBlocked = asset.safetyStatus === "BLOCK";
  const ownershipDeclared = asset.ownershipStatus !== "NOT_DECLARED";
  const canDraft = !isBlocked && ownershipDeclared && asset.ownershipStatus !== "UNKNOWN";

  return (
    <div className="rounded-md border border-border/40 bg-muted/5 p-3 text-[12px] space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-medium text-foreground/95 truncate">{asset.fileName}</span>
        <span className="text-muted-foreground">· {(asset.fileSizeBytes / 1024).toFixed(1)} KB</span>
        <span className="px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground">
          {USER_UPLOADED_ASSET_TYPE_LABEL[asset.detectedAssetType]}
        </span>
        <span className={`px-1.5 py-0.5 rounded border ${
          asset.safetyStatus === "PASS" ? "border-emerald-500/40 text-emerald-400" :
          asset.safetyStatus === "WARN" ? "border-amber-500/40 text-amber-400" :
          asset.safetyStatus === "NEEDS_REVIEW" ? "border-sky-500/40 text-sky-400" :
          "border-rose-500/40 text-rose-400"
        }`}>
          {USER_ASSET_SAFETY_LABEL[asset.safetyStatus]}
        </span>
        <span className="px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground">
          {USER_ASSET_OWNERSHIP_LABEL[asset.ownershipStatus]}
        </span>
        <span className="ml-auto px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground">
          {USER_ASSET_MARKET_STATUS_LABEL[asset.marketStatus]}
        </span>
      </div>

      {asset.blockedReasons.length > 0 && (
        <div className="text-[11px] text-rose-400">阻断：{asset.blockedReasons.join(" · ")}</div>
      )}
      {asset.warningReasons.length > 0 && (
        <div className="text-[11px] text-amber-400">提示：{asset.warningReasons.join(" · ")}</div>
      )}
      {asset.innerFileNames && asset.innerFileNames.length > 0 && (
        <details className="text-[11px] text-muted-foreground">
          <summary className="cursor-pointer hover:text-foreground">压缩包内文件（{asset.fileCount ?? asset.innerFileNames.length}）— 不解压</summary>
          <ul className="mt-1 max-h-32 overflow-auto list-disc pl-4">
            {asset.innerFileNames.slice(0, 40).map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </details>
      )}

      {!isBlocked && (
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border/30">
          <span className="text-[11px] text-muted-foreground">声明所有权：</span>
          {DECLARATION_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => onDeclare(d)}
              className="text-[11px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground hover:border-emerald-500/60 hover:text-emerald-400"
            >
              {USER_ASSET_DECLARATION_LABEL[d]}
            </button>
          ))}
        </div>
      )}

      {!isBlocked && (
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border/30">
          <span className="text-[11px] text-muted-foreground">商品配置：</span>
          <Select label="安装" value={draftOption.install} onChange={(v) => onChangeDraftOption({ ...draftOption, install: v as UserAssetInstallMode })}
            options={INSTALL_OPTIONS.map((o) => [o, USER_ASSET_INSTALL_LABEL[o]] as [string, string])} />
          <Select label="价格" value={draftOption.pricing} onChange={(v) => onChangeDraftOption({ ...draftOption, pricing: v as UserAssetPricingSuggestion })}
            options={PRICING_OPTIONS.map((o) => [o, USER_ASSET_PRICING_LABEL[o]] as [string, string])} />
          <button
            disabled={!canDraft}
            onClick={onDraft}
            className="ml-auto text-[11px] px-3 py-1 rounded-full border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
            title={canDraft ? "" : "请先完成所有权声明（不能选未知）"}
          >
            生成商品草案
          </button>
        </div>
      )}
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="text-[11px] text-muted-foreground flex items-center gap-1">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent border border-border/60 rounded px-1.5 py-0.5 text-foreground"
      >
        {options.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
    </label>
  );
}
