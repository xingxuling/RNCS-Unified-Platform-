// Regional UX · 地区用户体验
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { REGION_PROFILES } from "@/constants/regionProfiles";
import { UX_MODES, type UXModeKey } from "@/constants/userExperienceModes";
import { calculateRegionalUX, buildRegionalPrompt } from "@/lib/regionalUserCalculus";
import { RegionProfileCard } from "@/components/RegionProfileCard";
import { RegionalUXPanel } from "@/components/RegionalUXPanel";
import { UserJourneyMap } from "@/components/UserJourneyMap";
import { TrustLayerCard } from "@/components/TrustLayerCard";
import { UXAdaptationPreview } from "@/components/UXAdaptationPreview";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/regional-ux")({
  head: () => ({
    meta: [
      { title: "地区用户体验 · Aether Fate Engine" },
      { name: "description", content: "Regional UX Engine：根据地区调整文案、入口、信任机制、风险表达与提示词。" },
    ],
  }),
  component: RegionalUXPage,
});

function RegionalUXPage() {
  const [regionKey, setRegionKey] = useState<string>(REGION_PROFILES[0].key);
  const [modeOverride, setModeOverride] = useState<UXModeKey | "auto">("auto");
  const [productContext, setProductContext] = useState(
    "Aether Fate Engine 是一个结构触发预测 OS，整合主体数列、常数宇宙、多计算法内核与定数计算法，输出强触发日、行动许可与回验。",
  );
  const [copied, setCopied] = useState(false);

  const result = useMemo(
    () => calculateRegionalUX(regionKey, modeOverride === "auto" ? undefined : modeOverride),
    [regionKey, modeOverride],
  );
  const profile = useMemo(() => REGION_PROFILES.find((r) => r.key === regionKey)!, [regionKey]);
  const prompt = useMemo(() => buildRegionalPrompt(result, productContext), [result, productContext]);

  const copy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    toast.success("地区化提示词已复制");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <PageHeader
        caption="Regional User Experience Engine · 地区用户计算法"
        title="Regional UX · 地区用户体验"
        subtitle="根据不同地区的文化语境、信任路径、付费习惯与风险敏感度，输出文案、入口、功能优先级与地区化提示词。"
      />

      <div className="p-6 md:p-10 space-y-6">
        {/* 地区选择器 */}
        <div className="aether-card-elevated p-5">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">Region Selector</div>
          <div className="flex flex-wrap gap-2">
            {REGION_PROFILES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRegionKey(r.key)}
                className={`px-3 py-2 rounded-md border text-xs transition-colors ${
                  regionKey === r.key
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/60 text-foreground/80 hover:border-primary/40"
                }`}
              >
                <span className="mr-1.5">{r.flag}</span>{r.regionName}
                <span className="ml-1.5 text-[10px] text-muted-foreground">{r.regionEn}</span>
              </button>
            ))}
          </div>

          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">UX Mode Override</div>
            <div className="flex flex-wrap gap-2">
              <ModeChip active={modeOverride === "auto"} onClick={() => setModeOverride("auto")} label={`Auto (${UX_MODES[profile.defaultMode].cn})`} />
              {Object.values(UX_MODES).map((m) => (
                <ModeChip
                  key={m.key}
                  active={modeOverride === m.key}
                  onClick={() => setModeOverride(m.key)}
                  label={`${m.cn} · ${m.en}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 适配度 + 画像 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2"><RegionalUXPanel result={result} /></div>
          <RegionProfileCard profile={profile} />
        </div>

        {/* 文案预览 + 用户旅程 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <UXAdaptationPreview result={result} />
          <UserJourneyMap steps={result.onboardingStrategy} />
        </div>

        {/* 信任层 + 视觉建议 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TrustLayerCard
            trustMechanism={result.trustMechanism}
            privacyRequirements={result.privacyRequirements}
            riskWarnings={result.riskWarnings}
          />
          <div className="aether-card-elevated p-5">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Visual & Localization</div>
            <div className="font-display text-lg gold-text mt-1">视觉与本地化建议</div>
            <div className="gold-divider my-3" />
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Visual</div>
            <ul className="text-xs space-y-0.5 text-foreground/85 mb-3">
              {result.visualStyleAdjustment.map((v, i) => <li key={i}>· {v}</li>)}
            </ul>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Localization</div>
            <ul className="text-xs space-y-0.5 text-foreground/85 mb-3">
              {result.localizationNotes.map((v, i) => <li key={i}>· {v}</li>)}
            </ul>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Monetization</div>
            <div className="text-xs text-foreground/85">· {result.monetizationFit}</div>
          </div>
        </div>

        {/* 地区化提示词 */}
        <div className="aether-card-elevated p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Regional Prompt Output</div>
              <div className="font-display text-lg gold-text mt-1">地区化 Lovable / 产品优化提示词</div>
              <div className="text-xs text-muted-foreground mt-1">直接复制给 Lovable / Codex / AI Coder，用于按地区适配 UI 与文案。</div>
            </div>
            <button
              onClick={copy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-primary/40 text-primary text-xs hover:bg-primary/10"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "已复制" : "复制提示词"}
            </button>
          </div>

          <div className="mb-3">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Product Context</label>
            <textarea
              value={productContext}
              onChange={(e) => setProductContext(e.target.value)}
              rows={3}
              className="mt-1 w-full bg-background/50 border border-border/60 rounded-md p-2 text-xs text-foreground/90 font-mono"
            />
          </div>

          <pre className="bg-background/60 border border-border/60 rounded-md p-3 text-[11px] leading-relaxed text-foreground/85 whitespace-pre-wrap font-mono max-h-96 overflow-auto">
{prompt}
          </pre>
        </div>
      </div>
    </>
  );
}

function ModeChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1.5 rounded border text-[11px] ${
        active ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
