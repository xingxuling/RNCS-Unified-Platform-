import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { checkFirewall } from "@/lib/reality-data/subjectSequenceFirewall";
import { listExternalDataSources } from "@/lib/reality-data/externalDataSourceRegistry";

export function SubjectSequenceFirewallPanel() {
  const sources = listExternalDataSources();
  const probes = sources.slice(0, 4).map((s) => ({
    source: s,
    overwrite: checkFirewall({ source: s, targetSubjectMode: "FULL_60", action: "OVERWRITE_SUBJECT" }),
    affect: checkFirewall({ source: s, targetSubjectMode: "FULL_60", action: "AFFECT_OUTPUT" }),
  }));
  return (
    <Card className="p-4 space-y-3">
      <div className="text-sm font-medium">主体数列防火墙</div>
      <div className="text-xs text-muted-foreground">外部数据不可改写 Full60 / Light20 主体数列；只可作用于 calibratedOutput / calibrationProfile / validationHistory。</div>
      <div className="space-y-2">
        {probes.map((p) => (
          <div key={p.source.sourceId} className="text-xs border-t pt-2">
            <div className="font-medium">{p.source.sourceName}</div>
            <div className="flex gap-2 mt-1">
              <Badge variant={p.overwrite.allowed ? "destructive" : "outline"}>overwrite: {p.overwrite.allowed ? "ALLOWED" : "BLOCKED"}</Badge>
              <Badge variant={p.affect.allowed ? "default" : "outline"}>affect-output: {p.affect.allowed ? "OK" : "BLOCKED"}</Badge>
            </div>
            {p.overwrite.blockedReason && <div className="text-muted-foreground mt-1">{p.overwrite.blockedReason}</div>}
          </div>
        ))}
      </div>
    </Card>
  );
}
