// Capability Asset Market · 工作台 · /system/capability-assets
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import {
  CAPABILITY_SOURCE_LABEL,
  CAPABILITY_PACKAGE_LABEL,
  CAPABILITY_RISK_LABEL,
  CAPABILITY_SAFETY_LABEL,
  CAPABILITY_INSTALL_LABEL,
  CAPABILITY_MONETIZATION_LABEL,
  CAPABILITY_OWNERSHIP_LABEL,
  CAPABILITY_ASSET_STATUS_LABEL,
  type CapabilityAssetCandidate,
  type CapabilitySourceType,
  type CapabilityAssetPackage,
  type CapabilityAssetManifest,
} from "@/lib/capability-assets/capabilityAssetTypes";
import {
  bySource,
  createPackageDraft,
  runCapabilityAssetScan,
} from "@/lib/capability-assets/capabilityAssetRuntime";
import {
  CAPABILITY_ASSET_SAFETY_ALLOWED,
  CAPABILITY_ASSET_SAFETY_FORBIDDEN,
} from "@/lib/capability-assets/capabilityAssetSafetyPolicy";
import {
  buildCapabilityManifestArtifact,
  buildCapabilityPackageArtifact,
  buildCapabilityReportArtifact,
  buildStoreDraftArtifact,
} from "@/lib/capability-assets/capabilityAssetWorkspaceBridge";
import { manifestToJson } from "@/lib/capability-assets/capabilityAssetManifestBuilder";

export const Route = createFileRoute("/system/capability-assets")({
  head: () => ({
    meta: [
      { title: "能力资产 · 系统 · Aetherworld" },
      { name: "description", content: "内部能力 × 外部能力 × 用户能力三类能力源统一资产化工作台。" },
    ],
  }),
  component: CapabilityAssetsPage,
});

const TABS: { key: CapabilitySourceType; label: string }[] = [
  { key: "INTERNAL_CAPABILITY", label: "内部能力" },
  { key: "EXTERNAL_CAPABILITY", label: "外部能力" },
  { key: "USER_CAPABILITY", label: "用户能力" },
];

function CapabilityAssetsPage() {
  const [report, setReport] = useState(() => runCapabilityAssetScan());
  const [tab, setTab] = useState<CapabilitySourceType>("INTERNAL_CAPABILITY");
  const [riskFilter, setRiskFilter] = useState<string>("ALL");
  const [ownershipFilter, setOwnershipFilter] = useState<string>("ALL");
  const [drafts, setDrafts] = useState<{ pkg: CapabilityAssetPackage; manifest: CapabilityAssetManifest; manifestJson: string }[]>([]);
  const [savedArtifacts, setSavedArtifacts] = useState<string[]>([]);

  const candidates = useMemo(() => {
    let list = bySource(report, tab);
    if (riskFilter !== "ALL") list = list.filter((c) => c.riskLevel === riskFilter);
    if (ownershipFilter !== "ALL") list = list.filter((c) => c.ownershipStatus === ownershipFilter);
    return list;
  }, [report, tab, riskFilter, ownershipFilter]);

  const refresh = useCallback(() => setReport(runCapabilityAssetScan()), []);

  const handleDraft = useCallback((c: CapabilityAssetCandidate) => {
    const result = createPackageDraft(c);
    setDrafts((prev) => [result, ...prev].slice(0, 12));
  }, []);

  const handleSaveWorkspace = useCallback(() => {
    const reportArt = buildCapabilityReportArtifact(report);
    const pkgArts = drafts.map((d) => buildCapabilityPackageArtifact(d.pkg));
    const manifestArts = drafts.map((d) => buildCapabilityManifestArtifact(d.manifest));
    const storeArts = drafts.filter((d) => d.pkg.assetStatus === "DRAFT" || d.pkg.assetStatus === "READY")
      .map((d) => buildStoreDraftArtifact(d.pkg));
    setSavedArtifacts([
      `${reportArt.objectType} · ${reportArt.title}`,
      ...pkgArts.map((a) => `${a.objectType} · ${a.title}`),
      ...manifestArts.map((a) => `${a.objectType} · ${a.title}`),
      ...storeArts.map((a) => `${a.objectType} · ${a.title}`),
    ]);
  }, [report, drafts]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <header className="space-y-2">
        <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Aether Capability Asset Market · v0.1
        </div>
        <h1 className="text-2xl font-semibold">能力资产</h1>
        <p className="text-sm text-muted-foreground">
          内部能力 × 外部能力 × 用户能力 统一资产化。本轮不真正接支付、不真正公开上架、不自动安装高风险能力。
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-6 gap-2 text-[12px]">
        <Stat label="内部" value={report.totals.internal} />
        <Stat label="外部" value={report.totals.external} />
        <Stat label="用户" value={report.totals.user} />
        <Stat label="可售卖" value={report.totals.sellable} tone="emerald" />
        <Stat label="待审核" value={report.totals.needsReview} tone="sky" />
        <Stat label="阻断" value={report.totals.blocked} tone="rose" />
      </section>

      <section className="flex items-center gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-[12px] px-3 py-1.5 rounded-full border ${
              tab === t.key ? "border-emerald-500/60 text-emerald-400" : "border-border/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Select label="风险" value={riskFilter} onChange={setRiskFilter}
            options={[["ALL","全部"],["LOW","低"],["MEDIUM","中"],["HIGH","高"],["CRITICAL","极高"]]} />
          <Select label="所有权" value={ownershipFilter} onChange={setOwnershipFilter}
            options={[
              ["ALL","全部"],["OWNED","自有"],["USER_DECLARED","用户声明"],
              ["OPEN_SOURCE","开源"],["RESTRICTED","受限"],["LICENSE_UNKNOWN","未知"],["PRIVATE","私密"],
            ]} />
          <button onClick={refresh}
            className="text-[12px] px-3 py-1.5 rounded-full border border-border/60 text-muted-foreground hover:text-foreground">
            重新扫描
          </button>
        </div>
      </section>

      <section className="space-y-2">
        {candidates.length === 0 ? (
          <div className="text-[12px] text-muted-foreground border border-border/40 rounded-md p-4">
            当前筛选条件下没有候选能力。
          </div>
        ) : (
          candidates.map((c) => (
            <CandidateRow key={c.id} c={c} onDraft={() => handleDraft(c)} />
          ))
        )}
      </section>

      {drafts.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">已生成的能力包草案</h2>
            <button onClick={handleSaveWorkspace}
              className="text-[12px] px-3 py-1.5 rounded-full border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10">
              保存到 Workspace（草案）
            </button>
          </div>
          <div className="space-y-2">
            {drafts.map((d) => (
              <details key={d.pkg.id} className="rounded-md border border-border/40 bg-muted/10 p-3 text-[12px]">
                <summary className="cursor-pointer flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{d.pkg.cnName}</span>
                  <span className="text-muted-foreground">· {CAPABILITY_SOURCE_LABEL[d.pkg.sourceType]}</span>
                  <span className="text-muted-foreground">· {CAPABILITY_PACKAGE_LABEL[d.pkg.packageType]}</span>
                  <span className="px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground">
                    {CAPABILITY_ASSET_STATUS_LABEL[d.pkg.assetStatus]}
                  </span>
                </summary>
                <pre className="mt-2 max-h-64 overflow-auto text-[11px] leading-snug whitespace-pre-wrap">
                  {manifestToJson(d.manifest)}
                </pre>
              </details>
            ))}
          </div>
          {savedArtifacts.length > 0 && (
            <div className="text-[11px] text-emerald-400 border border-emerald-500/40 rounded-md p-3">
              已生成 {savedArtifacts.length} 份 Workspace 草案（不写库，仅本地草案）：
              <ul className="mt-1 space-y-0.5 list-disc pl-4">
                {savedArtifacts.slice(0, 8).map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
        </section>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px]">
        <div className="border border-emerald-500/30 rounded-md p-3">
          <div className="text-emerald-400 mb-2">允许</div>
          <ul className="space-y-1 list-disc pl-4 text-foreground/85">
            {CAPABILITY_ASSET_SAFETY_ALLOWED.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </div>
        <div className="border border-rose-500/30 rounded-md p-3">
          <div className="text-rose-400 mb-2">禁止</div>
          <ul className="space-y-1 list-disc pl-4 text-foreground/85">
            {CAPABILITY_ASSET_SAFETY_FORBIDDEN.map((s) => <li key={s}>{s}</li>)}
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

function CandidateRow({ c, onDraft }: { c: CapabilityAssetCandidate; onDraft: () => void }) {
  return (
    <div className="rounded-md border border-border/40 bg-muted/5 p-3 text-[12px] flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-foreground/95">{c.cnTitle}</span>
          <span className="text-muted-foreground">{c.title}</span>
          <span className="px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground">
            {CAPABILITY_PACKAGE_LABEL[c.suggestedPackageType]}
          </span>
          <span className="px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground">
            {CAPABILITY_RISK_LABEL[c.riskLevel]}
          </span>
          <span className={`px-1.5 py-0.5 rounded border ${
            c.safetyStatus === "PASS" ? "border-emerald-500/40 text-emerald-400" :
            c.safetyStatus === "WARN" ? "border-amber-500/40 text-amber-400" :
            c.safetyStatus === "NEEDS_REVIEW" ? "border-sky-500/40 text-sky-400" :
            "border-rose-500/40 text-rose-400"
          }`}>
            {CAPABILITY_SAFETY_LABEL[c.safetyStatus]}
          </span>
          <span className="px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground">
            {CAPABILITY_OWNERSHIP_LABEL[c.ownershipStatus]}
          </span>
          <span className="px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground">
            {CAPABILITY_INSTALL_LABEL[c.suggestedInstallMode]}
          </span>
          <span className="px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground">
            {CAPABILITY_MONETIZATION_LABEL[c.suggestedMonetization]}
          </span>
        </div>
        <div className="text-[11px] text-muted-foreground">{c.valueReason}</div>
        {c.notes && <div className="text-[11px] text-muted-foreground/80">备注：{c.notes}</div>}
      </div>
      <button
        onClick={onDraft}
        className="text-[12px] px-3 py-1.5 rounded-full border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 whitespace-nowrap"
      >
        生成能力包草案
      </button>
    </div>
  );
}
