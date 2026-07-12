import { createFileRoute } from "@tanstack/react-router";
import { RouteBreadcrumb } from "@/components/router/RouteBreadcrumb";
import { TermLocalizationPanel } from "@/components/vocabulary/TermLocalizationPanel";

export const Route = createFileRoute("/vocabulary-localization")({
  head: () => ({ meta: [{ title: "词汇本地化 — Vocabulary Localization" }] }),
  component: () => (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <RouteBreadcrumb />
      <header>
        <h1 className="text-2xl font-display gold-text">词汇本地化</h1>
        <p className="text-sm text-muted-foreground mt-1">查看词条在 zh-CN / zh-HK / zh-TW / en / ja / ko / fr 的覆盖与 stale 状态。</p>
      </header>
      <TermLocalizationPanel />
    </div>
  ),
});
