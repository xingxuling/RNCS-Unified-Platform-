import { createFileRoute } from "@tanstack/react-router";
import { UIUpdatePanel } from "@/components/ui-update/UIUpdatePanel";
import { UISafetyNote } from "@/components/ui-update/UISafetyNote";
import { RouteBreadcrumb } from "@/components/router/RouteBreadcrumb";

export const Route = createFileRoute("/ui-update-engine")({
  head: () => ({
    meta: [
      { title: "UI 界面更新引擎 — UI Interface Update Engine" },
      { name: "description", content: "管理 Aetherworld 模块注册、快速入口、空状态与界面演化。" },
    ],
  }),
  component: UIUpdateEnginePage,
});

function UIUpdateEnginePage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <RouteBreadcrumb />
      <header>
        <h1 className="text-2xl font-display gold-text">UI 界面更新引擎</h1>
        <p className="text-sm text-muted-foreground mt-1">
          UI Interface Update Engine · 跟随系统引擎自动演化的入口、空状态、快速开始与权限提示。
        </p>
      </header>
      <UISafetyNote />
      <UIUpdatePanel />
    </div>
  );
}
