import { createFileRoute, Link } from "@tanstack/react-router";
import { listWebCapabilityExamples } from "@/lib/web-capability/webCapabilityExamplesRegistry";

export const Route = createFileRoute("/web-capability-examples")({
  head: () => ({ meta: [{ title: "Web Capability Examples · 能力模型示例" }] }),
  component: function ExamplesPage() {
    const examples = listWebCapabilityExamples();
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <h1 className="text-2xl font-semibold">能力模型示例</h1>
        <p className="text-sm text-muted-foreground">点击示例可直接跳转到运行页并预填任务。</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {examples.map((e) => (
            <Link
              key={e.exampleId}
              to="/web-capability-run"
              search={{ id: e.capabilityId, task: e.task }}
              className="rounded-lg border bg-card p-4 hover:border-primary/50 transition"
            >
              <div className="text-sm font-semibold">{e.title}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">{e.capabilityId}</div>
              <div className="text-xs mt-2">{e.task}</div>
              <div className="text-[10px] text-muted-foreground mt-2">预期输出：{e.expectedOutputs.join(" · ")}</div>
            </Link>
          ))}
        </div>
      </div>
    );
  },
});
