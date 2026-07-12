import { createFileRoute } from "@tanstack/react-router";
import { RouteBreadcrumb } from "@/components/router/RouteBreadcrumb";
import { TextDynamicUpdatePanel } from "@/components/text-dynamic/TextDynamicUpdatePanel";
import { TextStalePanel } from "@/components/text-dynamic/TextStalePanel";
import { TextDependencyGraphPanel } from "@/components/text-dynamic/TextDependencyGraphPanel";
import { TextDiffViewer } from "@/components/text-dynamic/TextDiffViewer";
import { TextReviewPanel } from "@/components/text-dynamic/TextReviewPanel";
import { TextPatchPromptCard } from "@/components/text-dynamic/TextPatchPromptCard";
import { TextSafetyNote } from "@/components/text-dynamic/TextSafetyNote";

export const Route = createFileRoute("/text-dynamic-update")({
  head: () => ({
    meta: [
      { title: "文本动态更新 — Text Dynamic Update Engine" },
      { name: "description", content: "检测、生成、审计并同步 Aetherworld 应用文本随系统演化的更新。" },
    ],
  }),
  component: TextDynamicUpdatePage,
});

function TextDynamicUpdatePage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <RouteBreadcrumb />
      <header>
        <h1 className="text-2xl font-display gold-text">文本动态更新引擎</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Text Dynamic Update Detection &amp; Generation Engine · 让应用文本跟随系统、权重、常数、宪法、主体模式与 UI 自动演化。
        </p>
      </header>
      <TextSafetyNote />
      <TextDynamicUpdatePanel />
      <TextStalePanel />
      <TextDiffViewer />
      <TextReviewPanel />
      <TextDependencyGraphPanel />
      <TextPatchPromptCard />
    </div>
  );
}
