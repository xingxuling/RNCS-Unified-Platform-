import { createFileRoute } from "@tanstack/react-router";
import { RouteBreadcrumb } from "@/components/router/RouteBreadcrumb";
import { TextVersionPanel } from "@/components/text-dynamic/TextVersionPanel";
import { TextSafetyNote } from "@/components/text-dynamic/TextSafetyNote";

export const Route = createFileRoute("/text-versions")({
  head: () => ({
    meta: [
      { title: "文本版本 — Text Versions" },
      { name: "description", content: "查看应用文本版本历史、变更摘要与回滚入口。" },
    ],
  }),
  component: TextVersionsPage,
});

function TextVersionsPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <RouteBreadcrumb />
      <header>
        <h1 className="text-2xl font-display gold-text">文本版本</h1>
        <p className="text-sm text-muted-foreground mt-1">Text Versions · 应用文本版本与回滚记录。</p>
      </header>
      <TextSafetyNote />
      <TextVersionPanel />
    </div>
  );
}
