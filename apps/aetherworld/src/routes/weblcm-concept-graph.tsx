import { createFileRoute } from "@tanstack/react-router";
import { listWorkspaceGraphs } from "@/lib/weblcm/webLcmWorkspaceBridge";
import { WebLcmConceptGraphPanel } from "@/components/weblcm/WebLcmConceptGraphPanel";
import { useState } from "react";

function GraphPage() {
  const [graphs] = useState(() => listWorkspaceGraphs());
  const [selectedIdx, setSelectedIdx] = useState(graphs.length - 1);
  const graph = graphs[selectedIdx];
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">WebLCM Concept Graph · WebLCM 概念图谱</h1>
        <p className="text-sm text-muted-foreground">查看本地保存的概念图谱及其节点 / 关系。</p>
      </header>
      {graphs.length === 0 ? (
        <div className="rounded border border-border/40 p-6 text-sm text-muted-foreground text-center">
          尚无概念图谱。请先在 WebLCM Runtime 页面运行一次完整推理。
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {graphs.map((g, i) => (
              <button key={g.graphId} onClick={() => setSelectedIdx(i)}
                className={`px-2 py-1 text-xs rounded border border-border/40 ${i === selectedIdx ? "bg-muted/40" : "hover:bg-muted/20"}`}>
                {g.title} ({g.nodes.length})
              </button>
            ))}
          </div>
          <WebLcmConceptGraphPanel graph={graph} />
        </>
      )}
    </div>
  );
}

export const Route = createFileRoute("/weblcm-concept-graph")({
  head: () => ({ meta: [{ title: "WebLCM Concept Graph · 概念图谱" }, { name: "description", content: "Aether 概念图谱节点与关系。" }] }),
  component: GraphPage,
});
