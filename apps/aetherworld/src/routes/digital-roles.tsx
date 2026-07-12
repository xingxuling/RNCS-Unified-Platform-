import { createFileRoute } from "@tanstack/react-router";
import { DigitalRolePanel } from "@/components/digital-roles/DigitalRolePanel";

export const Route = createFileRoute("/digital-roles")({
  head: () => ({
    meta: [
      { title: "Digital Role Calculus · 数字角色计算法" },
      { name: "description", content: "将复杂任务分配给 Aetherworld 内部的数字创始人、架构师、产品经理、程序员、策划、设计师、QA、治理官等数字职能体，并管理协作、审计与权限。" },
    ],
  }),
  component: () => (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Digital Role Calculus · v1.0</div>
        <h1 className="font-display text-2xl gold-text">数字角色计算法</h1>
        <p className="text-sm text-muted-foreground">用数字创始人、架构师、产品经理、程序员、策划、QA、治理官、增长官、世界构筑师等数字职能体协作处理复杂任务。</p>
      </header>
      <DigitalRolePanel />
    </div>
  ),
});
