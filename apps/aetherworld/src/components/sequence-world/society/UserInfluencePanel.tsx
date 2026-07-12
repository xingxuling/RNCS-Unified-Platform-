import type { UserInfluenceState } from "@/lib/sequence-world/society/userInfluenceEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function UserInfluencePanel({ user }: { user: UserInfluenceState }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">用户影响 · User Influence</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div>身份：{user.userId}｜影响力 {(user.influenceLevel * 100).toFixed(0)}%</div>
        <div>头衔：{user.worldTitles.join("、") || "—"}</div>
        <div className="text-xs text-muted-foreground">阵营关系：{Object.entries(user.factionRelations).map(([k,v]) => `${k}:${v}`).join("｜") || "—"}</div>
        <ul className="list-disc pl-4 text-[11px] text-amber-200/80">
          {user.influenceRisks.map(r => <li key={r}>{r}</li>)}
        </ul>
      </CardContent>
    </Card>
  );
}
