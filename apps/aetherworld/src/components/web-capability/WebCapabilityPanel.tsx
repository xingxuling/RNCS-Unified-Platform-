import { useState } from "react";
import { runWebCapability, getWebCapabilityRuntimeSummary, type RunWebCapabilityResult } from "@/lib/web-capability/webCapabilityRunner";
import { listWebCapabilityModels, getWebCapabilityRegistrySummary } from "@/lib/web-capability/webCapabilityRegistry";
import { WebCapabilityProcedurePanel } from "./WebCapabilityProcedurePanel";
import { WebCapabilityOutputPanel } from "./WebCapabilityOutputPanel";
import { WebCapabilityQaPanel } from "./WebCapabilityQaPanel";
import { WebCapabilitySafetyNote } from "./WebCapabilitySafetyNote";
import { WebCapabilityRegistryPanel } from "./WebCapabilityRegistryPanel";

export function WebCapabilityPanel() {
  const [task, setTask] = useState("做一个歌词 prompt 生成器");
  const [result, setResult] = useState<RunWebCapabilityResult | null>(null);
  const registry = getWebCapabilityRegistrySummary();
  const runtime = getWebCapabilityRuntimeSummary();
  const models = listWebCapabilityModels();

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {[
          ["总能力数", registry.totalCapabilities],
          ["活跃能力", registry.activeCapabilities],
          ["最近运行", runtime.latestCapabilityId ?? "—"],
          ["QA 警告", runtime.qaWarnings],
          ["被阻断", runtime.blockedRuns],
          ["运行总数", runtime.totalRuns],
        ].map(([k, v]) => (
          <div key={String(k)} className="rounded border bg-card p-2.5">
            <div className="text-[10px] text-muted-foreground">{k}</div>
            <div className="text-sm font-mono">{String(v)}</div>
          </div>
        ))}
      </section>

      <section className="rounded-lg border bg-card p-4 space-y-3">
        <h2 className="text-base font-semibold">运行能力模型</h2>
        <textarea
          className="w-full rounded border bg-background px-3 py-2 text-sm min-h-[72px]"
          value={task}
          onChange={(e) => setTask(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap">
          <button
            className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-sm"
            onClick={() => setResult(runWebCapability({ task }))}
          >
            自动路由并运行
          </button>
          {models.slice(0, 6).map((m) => (
            <button
              key={m.capabilityId}
              className="px-2.5 py-1.5 rounded border text-xs"
              onClick={() => setResult(runWebCapability({ task, capabilityIdOverride: m.capabilityId }))}
            >{m.name}</button>
          ))}
        </div>
      </section>

      {result && (
        <>
          <section className="rounded-lg border bg-card p-4 text-xs space-y-1.5">
            <div className="text-sm font-semibold">本次运行</div>
            <div>RunId：<span className="font-mono">{result.run.runId}</span></div>
            <div>选定能力：<span className="font-mono">{result.run.capabilityId}</span>
              {result.route.combinedWith.length > 0 && <> · 组合：{result.route.combinedWith.join(", ")}</>}
              {result.route.fallback && <span className="text-amber-600"> · 默认回退</span>}
            </div>
            <div>Knowledge：{result.run.retrievedKnowledgeIds.join("、") || "—"}</div>
            <div>Calculus：{result.run.selectedCalculusIds.join("、") || "—"}</div>
            <div>Constants：{result.run.appliedConstantIds.join("、") || "—"}</div>
            <div>Concept Chain：<span className="font-mono">{result.run.conceptChainId}</span></div>
            <div>Workspace Record：<span className="font-mono">{result.run.workspaceRecordId}</span></div>
            {result.safety.blocked && (
              <div className="text-rose-600">Safety 阻断：{result.safety.reasons.join("；")}</div>
            )}
          </section>
          <WebCapabilityProcedurePanel steps={result.procedure} />
          <WebCapabilityOutputPanel outputs={result.run.outputs} />
          <WebCapabilityQaPanel qa={result.run.qa} />
        </>
      )}

      <WebCapabilityRegistryPanel />
      <WebCapabilitySafetyNote />
    </div>
  );
}
