import { createFileRoute } from "@tanstack/react-router";
import { QuickStartBuilder } from "@/components/ui-update/QuickStartBuilder";
import { RouteBreadcrumb } from "@/components/router/RouteBreadcrumb";

export const Route = createFileRoute("/quick-start-manager")({
  head: () => ({
    meta: [
      { title: "快速开始管理 — Quick Start Manager" },
      { name: "description", content: "按 PUBLIC / ADVANCED / FOUNDER 分层管理快速入口。" },
    ],
  }),
  component: QuickStartManagerPage,
});

function QuickStartManagerPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <RouteBreadcrumb />
      <header>
        <h1 className="text-2xl font-display gold-text">快速开始管理</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Quick Start Manager · 按用户模式自动生成与预览三层快速入口卡片。
        </p>
      </header>
      <QuickStartBuilder />
    </div>
  );
}
