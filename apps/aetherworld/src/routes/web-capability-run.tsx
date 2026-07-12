import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { runWebCapability, type RunWebCapabilityResult } from "@/lib/web-capability/webCapabilityRunner";
import { WEB_CAPABILITY_IDS, type WebCapabilityId } from "@/constants/web-capability/webCapabilityTypes";
import { WebCapabilityProcedurePanel } from "@/components/web-capability/WebCapabilityProcedurePanel";
import { WebCapabilityOutputPanel } from "@/components/web-capability/WebCapabilityOutputPanel";
import { WebCapabilityQaPanel } from "@/components/web-capability/WebCapabilityQaPanel";
import { WebCapabilitySafetyNote } from "@/components/web-capability/WebCapabilitySafetyNote";

type Search = { id?: WebCapabilityId; task?: string };

export const Route = createFileRoute("/web-capability-run")({
  validateSearch: (s: Record<string, unknown>): Search => {
    const id = s.id as WebCapabilityId | undefined;
    return {
      id: id && (WEB_CAPABILITY_IDS as readonly string[]).includes(id) ? id : undefined,
      task: typeof s.task === "string" ? s.task : undefined,
    };
  },
  head: () => ({ meta: [{ title: "Web Capability Run · 能力模型运行" }] }),
  component: function RunPage() {
    const { id, task: initTask } = Route.useSearch();
    const [task, setTask] = useState(initTask ?? "");
    const [result, setResult] = useState<RunWebCapabilityResult | null>(null);

    useEffect(() => { if (initTask && id) setTask(initTask); }, [initTask, id]);

    function execute() {
      if (!task.trim()) return;
      setResult(runWebCapability({ task, capabilityIdOverride: id }));
    }

    return (
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <Link to="/web-capabilities" className="text-xs text-primary hover:underline">← 返回能力模型列表</Link>
        <h1 className="text-2xl font-semibold">运行能力模型 {id ? `· ${id}` : "（自动路由）"}</h1>
        <textarea
          className="w-full rounded border bg-background p-3 text-sm min-h-[100px]"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="输入你的任务，例如：为蓝天机生成一首角色歌 prompt"
        />
        <button className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-sm" onClick={execute}>
          运行
        </button>
        {result && (
          <>
            <section className="rounded-lg border bg-card p-4 text-xs space-y-1">
              <div>RunId：<span className="font-mono">{result.run.runId}</span></div>
              <div>能力：<span className="font-mono">{result.run.capabilityId}</span></div>
              <div>QA：<span className="font-mono">{result.run.qaStatus}</span></div>
              <div>Workspace Record：<span className="font-mono">{result.run.workspaceRecordId}</span></div>
            </section>
            <WebCapabilityProcedurePanel steps={result.procedure} />
            <WebCapabilityOutputPanel outputs={result.run.outputs} />
            <WebCapabilityQaPanel qa={result.run.qa} />
          </>
        )}
        <WebCapabilitySafetyNote />
      </div>
    );
  },
});
