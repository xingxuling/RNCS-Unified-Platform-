import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { listWorkflowChains } from "@/lib/digital-roles/digitalRoleWorkflowPlanner";
import { runDigitalRoleCalculus, type DigitalRoleCalculusResult } from "@/lib/digital-roles/digitalRoleCalculus";
import { DigitalRoleWorkflowPanel } from "@/components/digital-roles/DigitalRoleWorkflowPanel";
import { DigitalRoleQaPanel } from "@/components/digital-roles/DigitalRoleQaPanel";
import type { DigitalRoleWorkflowType } from "@/constants/digital-roles/digitalRoleWorkflowTypes";
import { DIGITAL_ROLE_WORKFLOW_LABELS } from "@/constants/digital-roles/digitalRoleWorkflowTypes";

export const Route = createFileRoute("/digital-team-workflow")({
  head: () => ({ meta: [{ title: "Digital Team Workflow · 数字团队工作流" }] }),
  component: WorkflowPage,
});

function WorkflowPage() {
  const chains = listWorkflowChains();
  const [result, setResult] = useState<DigitalRoleCalculusResult | null>(null);

  const run = (type: DigitalRoleWorkflowType) => {
    setResult(runDigitalRoleCalculus("用数字团队跑一遍完整流程", { workflowOverride: type }));
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <header>
        <h1 className="font-display text-2xl gold-text">数字团队工作流</h1>
        <p className="text-sm text-muted-foreground">五条标准协作链：产品构建、系统构建、创作资产、版本升级、治理审查。</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {chains.map((c) => (
          <div key={c.type} className="aether-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{DIGITAL_ROLE_WORKFLOW_LABELS[c.type as DigitalRoleWorkflowType]}</div>
              <button onClick={() => run(c.type as DigitalRoleWorkflowType)} className="text-[11px] px-2 py-1 rounded bg-primary text-primary-foreground">运行</button>
            </div>
            <div className="text-[11px] text-muted-foreground">{c.chain.join(" → ")}</div>
          </div>
        ))}
      </div>

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <DigitalRoleWorkflowPanel workflow={result.workflow} />
          <DigitalRoleQaPanel qa={result.qa} />
        </div>
      )}
    </div>
  );
}
