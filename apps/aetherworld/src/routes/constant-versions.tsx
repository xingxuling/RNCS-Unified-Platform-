import { createFileRoute } from "@tanstack/react-router";
import { ConstantVersionPanel } from "@/components/constants-universe/ConstantVersionPanel";
import { ConstantExportPanel } from "@/components/constants-universe/ConstantExportPanel";
import { ConstantSafetyNote } from "@/components/constants-universe/ConstantSafetyNote";

export const Route = createFileRoute("/constant-versions")({
  head: () => ({ meta: [{ title: "常数版本 · Constant Versions" }, { name: "description", content: "常数宇宙的版本历史、迁移说明与导出。" }] }),
  component: () => (
    <div className="container mx-auto px-4 py-6 space-y-4 max-w-7xl">
      <header>
        <h1 className="text-2xl font-semibold">常数版本 · Constant Versions</h1>
        <p className="text-sm text-muted-foreground">查看版本历史、Founder 批准状态与导出。</p>
      </header>
      <ConstantSafetyNote />
      <ConstantVersionPanel />
      <ConstantExportPanel />
    </div>
  ),
});
