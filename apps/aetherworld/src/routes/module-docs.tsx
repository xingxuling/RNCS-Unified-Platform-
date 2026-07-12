import { createFileRoute } from "@tanstack/react-router";
import { listModuleDocs } from "@/lib/learning/moduleDocGenerator";
import { ModuleDocCard } from "@/components/learning/ModuleDocCard";
import { DocsSafetyNote } from "@/components/learning/DocsSafetyNote";

export const Route = createFileRoute("/module-docs")({
  head: () => ({ meta: [{ title: "模块文档 · Module Docs" }, { name: "description", content: "Aetherworld 核心模块文档。" }] }),
  component: ModuleDocsPage,
});

function ModuleDocsPage() {
  const docs = listModuleDocs();
  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <header>
        <h1 className="text-2xl font-semibold">模块文档 · Module Docs</h1>
        <p className="text-sm text-muted-foreground mt-1">共 {docs.length} 个核心模块。</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {docs.map((d) => <ModuleDocCard key={d.moduleId} doc={d} />)}
      </div>
      <DocsSafetyNote />
    </div>
  );
}
