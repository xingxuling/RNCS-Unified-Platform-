import { createFileRoute } from "@tanstack/react-router";
import { RouteBreadcrumb } from "@/components/router/RouteBreadcrumb";
import { TextRegistryTable } from "@/components/text-dynamic/TextRegistryTable";
import { TextSafetyNote } from "@/components/text-dynamic/TextSafetyNote";

export const Route = createFileRoute("/text-registry")({
  head: () => ({
    meta: [
      { title: "文本注册表 — Text Registry" },
      { name: "description", content: "Aetherworld 应用内全部受治理文本条目，按受众、类型与 scope 浏览。" },
    ],
  }),
  component: TextRegistryPage,
});

function TextRegistryPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <RouteBreadcrumb />
      <header>
        <h1 className="text-2xl font-display gold-text">文本注册表</h1>
        <p className="text-sm text-muted-foreground mt-1">Text Registry · 应用文本统一登记入口。</p>
      </header>
      <TextSafetyNote />
      <TextRegistryTable />
    </div>
  );
}
