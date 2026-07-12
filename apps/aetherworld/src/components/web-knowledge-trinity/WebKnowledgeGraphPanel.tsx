import { buildConstantGraph } from "@/lib/web-knowledge-trinity/webcom/webCoMConstantGraphEngine";

export function WebKnowledgeGraphPanel() {
  const graph = buildConstantGraph();
  return (
    <div className="space-y-2 text-xs">
      <div className="text-muted-foreground">
        常数图谱：节点 {graph.nodes.length}，边 {graph.edges.length}（v0.5 文本可视化）
      </div>
      <div className="rounded border border-border/40 p-2 max-h-80 overflow-y-auto space-y-1">
        {graph.nodes.map((n) => {
          const out = graph.edges.filter((e) => e.from === n.id);
          return (
            <div key={n.id} className="text-[11px] border-b border-border/20 pb-1">
              <span className="font-mono text-amber-400">{n.id}</span> · {n.label}
              {out.length > 0 && (
                <div className="text-[10px] text-muted-foreground ml-3">
                  → {out.map((e) => e.to).join(", ")}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
