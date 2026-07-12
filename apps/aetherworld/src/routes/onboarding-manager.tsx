import { createFileRoute } from "@tanstack/react-router";
import { OnboardingFlowPreview } from "@/components/ui-update/OnboardingFlowPreview";
import { RouteBreadcrumb } from "@/components/router/RouteBreadcrumb";

export const Route = createFileRoute("/onboarding-manager")({
  head: () => ({
    meta: [
      { title: "新手流程管理 — Onboarding Manager" },
      { name: "description", content: "管理与预览 PUBLIC / ADVANCED / FOUNDER 三类新手流程。" },
    ],
  }),
  component: OnboardingManagerPage,
});

function OnboardingManagerPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <RouteBreadcrumb />
      <header>
        <h1 className="text-2xl font-display gold-text">新手流程管理</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Onboarding Manager · 由 UI Update Engine 驱动的分层入门流程预览与编排。
        </p>
      </header>
      <OnboardingFlowPreview />
    </div>
  );
}
