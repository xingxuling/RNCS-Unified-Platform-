import { createFileRoute } from "@tanstack/react-router";
import { CROSS_FUNCTIONAL_EXAMPLES } from "@/lib/cross-functional/crossFunctionalExamplesRegistry";
import { INTENT_LABELS } from "@/constants/cross-functional/crossFunctionalIntentTypes";
import { WORKFLOW_LABELS } from "@/constants/cross-functional/crossFunctionalWorkflowTypes";
import { CrossFunctionalSafetyNote } from "@/components/cross-functional/CrossFunctionalSafetyNote";

export const Route = createFileRoute("/cross-functional-examples")({
  head: () => ({
    meta: [
      { title: "跨功能示例 · Cross-Functional Examples" },
      { name: "description", content: "12 个跨功能示例，覆盖角色、世界、歌曲、产品、数列、词汇与计算法。" },
    ],
  }),
  component: () => (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="font-display text-2xl gold-text">跨功能示例</h1>
        <p className="text-sm text-muted-foreground">12 个跨功能调度示例，可在主面板一键运行。</p>
      </header>
      <CrossFunctionalSafetyNote />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {CROSS_FUNCTIONAL_EXAMPLES.map((ex) => (
          <div key={ex.id} className="aether-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-display text-sm">{ex.title}</div>
              <span className="text-[10px] rounded border px-1.5 py-0.5 text-muted-foreground">{WORKFLOW_LABELS[ex.workflowType]}</span>
            </div>
            <div className="text-xs text-muted-foreground">意图：{INTENT_LABELS[ex.intentType]}</div>
            <div className="text-xs text-foreground/85">{ex.description}</div>
            <div className="text-[11px] text-muted-foreground">输入：{ex.inputText}</div>
            <div className="text-[11px] text-muted-foreground">预期输出：{ex.expectedOutputs.join("、")}</div>
          </div>
        ))}
      </div>
    </div>
  ),
});
