import type { SocialGraph } from "@/lib/sequence-world/society/socialGraphEngine";
import { SOCIAL_RELATION_LABELS } from "@/constants/sequence-world/society/socialRelationTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SocialGraphPanel({ graph }: { graph: SocialGraph }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">社会关系图 · Social Graph</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded border p-2"><div className="text-muted-foreground">节点</div><div className="text-lg">{graph.nodes.length}</div></div>
          <div className="rounded border p-2"><div className="text-muted-foreground">关系边</div><div className="text-lg">{graph.edges.length}</div></div>
          <div className="rounded border p-2"><div className="text-muted-foreground">不稳关系</div><div className="text-lg">{graph.unstableRelations.length}</div></div>
        </div>
        <div className="text-xs text-muted-foreground">
          核心 agent：{graph.centralAgents.join("、") || "—"}
        </div>
        <div className="max-h-64 overflow-y-auto rounded border">
          <table className="w-full text-xs">
            <thead className="bg-muted/30">
              <tr><th className="px-2 py-1 text-left">来源</th><th className="px-2 py-1 text-left">目标</th><th className="px-2 py-1 text-left">关系</th><th className="px-2 py-1 text-left">强度</th></tr>
            </thead>
            <tbody>
              {graph.edges.slice(0, 60).map((e, i) => (
                <tr key={i} className="border-t">
                  <td className="px-2 py-1 truncate max-w-[120px]">{e.from}</td>
                  <td className="px-2 py-1 truncate max-w-[120px]">{e.to}</td>
                  <td className="px-2 py-1">{SOCIAL_RELATION_LABELS[e.relationType]}</td>
                  <td className="px-2 py-1">{(e.strength * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
