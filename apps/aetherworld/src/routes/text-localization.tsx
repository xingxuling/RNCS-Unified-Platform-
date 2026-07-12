import { createFileRoute } from "@tanstack/react-router";
import { RouteBreadcrumb } from "@/components/router/RouteBreadcrumb";
import { TextLocalizationPanel } from "@/components/text-dynamic/TextLocalizationPanel";
import { TextSafetyNote } from "@/components/text-dynamic/TextSafetyNote";

export const Route = createFileRoute("/text-localization")({
  head: () => ({
    meta: [
      { title: "文本本地化 — Text Localization" },
      { name: "description", content: "应用文本多语言同步状态与翻译落后检测。" },
    ],
  }),
  component: TextLocalizationPage,
});

function TextLocalizationPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <RouteBreadcrumb />
      <header>
        <h1 className="text-2xl font-display gold-text">文本本地化</h1>
        <p className="text-sm text-muted-foreground mt-1">Text Localization · 多语言同步与翻译漂移检测。</p>
      </header>
      <TextSafetyNote />
      <TextLocalizationPanel />
    </div>
  );
}
