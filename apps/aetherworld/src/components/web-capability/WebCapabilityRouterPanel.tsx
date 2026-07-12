import { useState } from "react";
import { routeWebCapability, type WebCapabilityRouteResult } from "@/lib/web-capability/webCapabilityRouter";

export function WebCapabilityRouterPanel() {
  const [task, setTask] = useState("做一个歌词 prompt 生成器");
  const [result, setResult] = useState<WebCapabilityRouteResult | null>(null);

  return (
    <section className="rounded-lg border bg-card p-4 space-y-3">
      <h2 className="text-base font-semibold">能力模型路由 · WebCapabilityRouter</h2>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded border bg-background px-3 py-2 text-sm"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="输入任务，例如：为蓝天机生成一首角色歌 prompt"
        />
        <button
          className="px-3 py-2 rounded bg-primary text-primary-foreground text-sm"
          onClick={() => setResult(routeWebCapability(task))}
        >
          路由
        </button>
      </div>
      {result && (
        <div className="text-xs space-y-1">
          <div>主选能力：<span className="font-mono">{result.primary}</span>{result.fallback ? "（默认回退）" : ""}</div>
          {result.combinedWith.length > 0 && (
            <div>组合：{result.combinedWith.join(" + ")}</div>
          )}
          <ul className="space-y-0.5 text-muted-foreground">
            {result.matched.map((m) => (
              <li key={m.capability}>· {m.capability} · score={m.score} · 命中 [{m.hits.join(", ")}]</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
