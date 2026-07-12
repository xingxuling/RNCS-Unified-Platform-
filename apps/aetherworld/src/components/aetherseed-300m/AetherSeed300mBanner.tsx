// AetherSeed 300M 主线 Banner：统一在训练 / 数据 / 实验 / 工作流页面顶部展示。
import { Link } from "@tanstack/react-router";
import {
  AETHERSEED_300M_HEADLINE,
  AETHERSEED_300M_DEPRIORITIZED,
} from "@/lib/aetherseed-300m/aetherSeed300mMainLine";

interface AetherSeed300mBannerProps {
  /** 当前页面提示语，例如 “第一炉训练准备已聚焦到 AetherSeed 300M” */
  pageNote?: string;
  /** 是否折叠「暂时不做」列表（默认展示） */
  compact?: boolean;
}

export function AetherSeed300mBanner({
  pageNote,
  compact = false,
}: AetherSeed300mBannerProps) {
  return (
    <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="font-medium text-primary">{AETHERSEED_300M_HEADLINE}</div>
        <Link
          to="/system/first-run-readiness"
          className="shrink-0 rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] text-primary hover:border-primary/60"
        >
          打开第一炉准备 →
        </Link>
      </div>
      {pageNote && (
        <div className="mt-1.5 text-[11px] text-foreground/80">{pageNote}</div>
      )}
      {!compact && (
        <ul className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
          {AETHERSEED_300M_DEPRIORITIZED.map((x) => (
            <li key={x}>· {x}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
