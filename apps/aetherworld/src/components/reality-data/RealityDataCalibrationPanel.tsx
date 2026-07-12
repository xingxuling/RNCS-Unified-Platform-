import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRealityDataSummary, realityDataMeta } from "@/lib/reality-data/realityDataCalibrationEngine";
import { RealityDataSafetyNote } from "./RealityDataSafetyNote";
import { ExternalDataSourceRegistryTable } from "./ExternalDataSourceRegistryTable";
import { SourceCredibilityCard } from "./SourceCredibilityCard";
import { EvidenceMappingPanel } from "./EvidenceMappingPanel";
import { RealityVariablePanel } from "./RealityVariablePanel";
import { CalibrationPlanPanel } from "./CalibrationPlanPanel";
import { SubjectSequenceFirewallPanel } from "./SubjectSequenceFirewallPanel";
import { RealityDataAuditPanel } from "./RealityDataAuditPanel";
import { DataIngestionPanel } from "./DataIngestionPanel";
import { RealityDataExportPanel } from "./RealityDataExportPanel";

export function RealityDataCalibrationPanel() {
  const meta = realityDataMeta();
  const s = getRealityDataSummary();
  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-lg font-semibold">{meta.engineChineseName}</div>
            <div className="text-xs text-muted-foreground">{meta.engineName} · {meta.version}</div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline">数据源 {s.total}</Badge>
            <Badge variant={s.staleSourceCount > 0 ? "secondary" : "outline"}>stale {s.staleSourceCount}</Badge>
            <Badge variant={s.auditStatus === "CRITICAL" ? "destructive" : "outline"}>审计 {s.auditStatus}</Badge>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <CalibrationPlanPanel />
        <SubjectSequenceFirewallPanel />
        <SourceCredibilityCard />
        <EvidenceMappingPanel />
        <RealityVariablePanel />
        <DataIngestionPanel />
      </div>

      <ExternalDataSourceRegistryTable />
      <RealityDataAuditPanel />
      <RealityDataExportPanel />
      <RealityDataSafetyNote />
    </div>
  );
}
