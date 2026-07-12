import { createFileRoute } from "@tanstack/react-router";
import { AetherObjectInspector } from "@/components/command-canvas/AetherObjectInspector";

export const Route = createFileRoute("/object-inspector")({
  head: () => ({ meta: [{ title: "Object Inspector · 对象检查器" }] }),
  component: () => (
    <div className="max-w-3xl mx-auto p-6 space-y-3">
      <header>
        <h1 className="text-xl font-semibold">对象检查器 · Object Inspector</h1>
        <p className="text-sm text-muted-foreground">查看当前对象的输入、输出、QA、追踪、版本、重算、常数、概念与导出。</p>
      </header>
      <AetherObjectInspector />
    </div>
  ),
});
