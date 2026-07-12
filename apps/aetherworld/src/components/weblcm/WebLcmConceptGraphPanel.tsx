import type { AetherConceptGraph } from "@/lib/weblcm/webLcmTypes";

export function WebLcmConceptGraphPanel({ graph }: { graph: AetherConceptGraph | null | undefined }) {
  if (!graph) return <div className="text-xs text-muted-foreground p-3 rounded border border-border/40">尚未构建概念图谱。</div>;
  return (
    <div className="space-y-3 text-xs">
      <div className="rounded border border-border/40 p-3">
        <div className="font-semibold">{graph.title}</div>
        <div className="text-muted-foreground">{graph.graphSummary} · QA：{graph.qaStatus}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="rounded border border-border/40 p-3">
          <div className="font-semibold mb-1">节点 ({graph.nodes.length})</div>
          <ul className="space-y-1 max-h-72 overflow-y-auto">
            {graph.nodes.map(n => <li key={n.nodeId}>• {n.label} <span className="text-muted-foreground">[{n.conceptType}]</span></li>)}
          </ul>
        </div>
        <div className="rounded border border-border/40 p-3">
          <div className="font-semibold mb-1">关系 ({graph.edges.length})</div>
          <ul className="space-y-1 max-h-72 overflow-y-auto">
            {graph.edges.map(e => {
              const from = graph.nodes.find(n => n.nodeId === e.fromNodeId)?.label ?? "?";
              const to = graph.nodes.find(n => n.nodeId === e.toNodeId)?.label ?? "?";
              return <li key={e.edgeId}><span className="text-muted-foreground">[{e.relationType}]</span> {from} → {to} <span className="text-muted-foreground">({e.weight})</span></li>;
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
