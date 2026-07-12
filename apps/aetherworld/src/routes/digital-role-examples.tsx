import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { listDigitalRoleExamples } from "@/lib/digital-roles/digitalRoleExamplesRegistry";
import { runDigitalRoleCalculus, type DigitalRoleCalculusResult } from "@/lib/digital-roles/digitalRoleCalculus";
import { DigitalRoleAssignmentPanel } from "@/components/digital-roles/DigitalRoleAssignmentPanel";
import { DigitalRoleWorkflowPanel } from "@/components/digital-roles/DigitalRoleWorkflowPanel";

export const Route = createFileRoute("/digital-role-examples")({
  head: () => ({ meta: [{ title: "Digital Role Examples · 数字角色示例" }] }),
  component: ExamplesPage,
});

function ExamplesPage() {
  const examples = listDigitalRoleExamples();
  const [result, setResult] = useState<DigitalRoleCalculusResult | null>(null);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <header>
        <h1 className="font-display text-2xl gold-text">数字角色示例</h1>
        <p className="text-sm text-muted-foreground">预置 12 个数字角色协作示例。</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {examples.map((ex) => (
          <button key={ex.exampleId} onClick={() => setResult(runDigitalRoleCalculus(ex.exampleInput))} className="aether-card p-3 text-left space-y-1 hover:bg-muted/30">
            <div className="text-sm font-medium">{ex.title}</div>
            <div className="text-[11px] text-muted-foreground">{ex.description}</div>
            <div className="text-[10px] text-muted-foreground">任务：{ex.taskType}</div>
          </button>
        ))}
      </div>

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <DigitalRoleAssignmentPanel result={result} />
          <DigitalRoleWorkflowPanel workflow={result.workflow} />
        </div>
      )}
    </div>
  );
}
