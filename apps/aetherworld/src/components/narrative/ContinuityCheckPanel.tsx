import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ContinuityCheck } from "@/lib/narrative/continuityChecker";

export function ContinuityCheckPanel({ check }: { check: ContinuityCheck }) {
  const Row = ({ label, items }: { label: string; items: string[] }) =>
    items.length ? (
      <div><div className="text-xs font-medium">{label}</div><ul className="text-xs list-disc pl-4">{items.map((i, k) => <li key={k}>{i}</li>)}</ul></div>
    ) : null;
  const empty = !check.characterConsistency.length && !check.loreConsistency.length && !check.timelineIssues.length && !check.unresolvedHooks.length && !check.contradictionWarnings.length;
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">连续性检查</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {empty ? <div className="text-xs text-muted-foreground">未发现明显问题</div> : null}
        <Row label="角色一致性" items={check.characterConsistency} />
        <Row label="设定一致性" items={check.loreConsistency} />
        <Row label="时间线问题" items={check.timelineIssues} />
        <Row label="未解钩子" items={check.unresolvedHooks} />
        <Row label="矛盾提示" items={check.contradictionWarnings} />
        <Row label="修复建议" items={check.suggestedFixes} />
      </CardContent>
    </Card>
  );
}
