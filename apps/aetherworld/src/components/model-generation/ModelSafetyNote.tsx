import type { ModelSafetyReport } from "@/lib/model-generation/modelSafetyGuard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, ShieldCheck } from "lucide-react";

export function ModelSafetyNote({ report }: { report: ModelSafetyReport }) {
  const Icon = report.ok ? ShieldCheck : ShieldAlert;
  return (
    <Alert variant={report.ok ? "default" : "destructive"}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{report.ok ? "安全检查通过（仍需现实回验）" : "存在需修复的安全问题"}</AlertTitle>
      <AlertDescription className="space-y-2 mt-2">
        <ul className="text-xs list-disc pl-4 space-y-1">
          {report.disclaimer.map((d, i) => <li key={i}>{d}</li>)}
        </ul>
        {report.issues.length > 0 && (
          <div className="space-y-1">
            {report.issues.map((i, idx) => (
              <div key={idx} className="text-xs flex items-start gap-2">
                <Badge variant={i.severity === "CRITICAL" ? "destructive" : "outline"}>{i.severity}</Badge>
                <div><div>{i.message}</div><div className="text-muted-foreground">建议：{i.suggestion}</div></div>
              </div>
            ))}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
