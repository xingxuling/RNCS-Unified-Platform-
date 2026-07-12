// 首页文案预览（地区适配版）
import type { RegionalUXResult } from "@/lib/regionalUserCalculus";
import { UX_MODES } from "@/constants/userExperienceModes";
import { Sparkles } from "lucide-react";

export function UXAdaptationPreview({ result }: { result: RegionalUXResult }) {
  return (
    <div className="aether-card-elevated p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Homepage Copy Preview</div>
          <div className="font-display text-lg gold-text mt-1">首页文案预览</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">UX Mode</div>
          <div className="text-xs text-primary mt-0.5">{UX_MODES[result.mode].cn}</div>
          <div className="text-[10px] text-muted-foreground">{UX_MODES[result.mode].en}</div>
        </div>
      </div>

      <div className="gold-divider my-3" />

      {/* 模拟首页预览 */}
      <div className="rounded-lg border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-5">
        <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-primary mb-3">
          <Sparkles className="w-3 h-3" /> Aether Fate Engine · {result.regionEn}
        </div>
        <h2 className="font-display text-2xl md:text-3xl gold-text leading-tight">
          {result.copy.heading}
        </h2>
        <p className="text-sm text-foreground/85 mt-2 leading-relaxed">
          {result.copy.subheading}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-medium">
            {result.copy.primaryCta}
          </button>
          <button className="px-4 py-2 rounded-md border border-primary/40 text-primary text-xs">
            {result.copy.secondaryCta}
          </button>
        </div>
        <div className="mt-3 text-[10px] text-muted-foreground/80">
          {result.riskWarnings.slice(0, 2).join(" · ")}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">功能优先级</div>
        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {result.featurePriority.map((f, i) => (
            <li key={i} className="text-xs text-foreground/85 inline-flex items-center gap-2">
              <span className="font-mono text-[10px] text-primary/70 w-5">{String(i + 1).padStart(2, "0")}</span>
              {f}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
