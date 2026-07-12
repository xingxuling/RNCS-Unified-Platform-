import { createFileRoute } from "@tanstack/react-router";
import { analyzeCrossFunctionalObject } from "@/lib/cross-functional/crossFunctionalObjectAnalyzer";
import { listAllWorkflowTemplates } from "@/lib/cross-functional/crossFunctionalWorkflowPlanner";
import { CrossFunctionalWorkflowPanel } from "@/components/cross-functional/CrossFunctionalWorkflowPanel";
import { CrossFunctionalSafetyNote } from "@/components/cross-functional/CrossFunctionalSafetyNote";

export const Route = createFileRoute("/cross-functional-workflows")({
  head: () => ({
    meta: [
      { title: "跨功能工作流 · Cross-Functional Workflows" },
      { name: "description", content: "A–E 跨功能工作流模板：角色资产包、世界资产包、歌曲生产包、产品落地包、数列创作包。" },
    ],
  }),
  component: WorkflowsPage,
});

function WorkflowsPage() {
  const sample = analyzeCrossFunctionalObject("跨功能工作流示例对象", "CHARACTER", "示例对象");
  const workflows = listAllWorkflowTemplates(sample);
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="font-display text-2xl gold-text">跨功能工作流</h1>
        <p className="text-sm text-muted-foreground">5 条预置跨功能工作流，可作为跨域调度起点。</p>
      </header>
      <CrossFunctionalSafetyNote />
      <div className="space-y-3">
        {workflows.map((w) => <CrossFunctionalWorkflowPanel key={w.workflowId} workflow={w} />)}
      </div>
    </div>
  );
}
