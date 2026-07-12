import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import type { NarrativeSafetyReport } from "@/lib/narrative/narrativeSafetyGuard";

export function NarrativeSafetyNote({ report }: { report: NarrativeSafetyReport }) {
  const Icon = report.ok ? ShieldCheck : ShieldAlert;
  return (
    <Alert variant={report.ok ? "default" : "destructive"}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{report.ok ? "安全检查通过（仍需人工把关）" : "存在需修复的剧情安全问题"}</AlertTitle>
      <AlertDescription className="space-y-2 mt-2">
        <ul className="text-xs list-disc pl-4 space-y-1">{report.disclaimer.map((d, i) => <li key={i}>{d}</li>)}</ul>
        {report.issues.map((i, k) => (
          <div key={k} className="text-xs flex items-start gap-2">
            <Badge variant={i.severity === "CRITICAL" ? "destructive" : "outline"}>{i.severity}</Badge>
            <div><div>{i.message}</div><div className="text-muted-foreground">建议：{i.suggestion}</div></div>
          </div>
        ))}
      </AlertDescription>
    </Alert>
  );
}
