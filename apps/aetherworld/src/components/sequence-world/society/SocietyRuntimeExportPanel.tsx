import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SOCIETY_EXPORT_TARGETS, exportSocietyRuntime, type SocietyExportTarget, type SocietyRuntimePackage } from "@/lib/sequence-world/society/societyRuntimeExportEngine";
import type { WorldAgentSocietyResult } from "@/lib/sequence-world/society/worldAgentSocietyEngine";

export function SocietyRuntimeExportPanel({ society, isFull60 }: { society: WorldAgentSocietyResult; isFull60?: boolean }) {
  const [pkg, setPkg] = useState<SocietyRuntimePackage | null>(null);
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">运行时导出 · Society Runtime Export</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap gap-2">
          {SOCIETY_EXPORT_TARGETS.map(t => (
            <Button key={t} size="sm" variant="outline" onClick={() => setPkg(exportSocietyRuntime({
              target: t as SocietyExportTarget, society,
              subjectMode: society.metadata.subjectMode, isFull60,
            }))}>{t}</Button>
          ))}
        </div>
        {pkg && (
          <pre className="max-h-72 overflow-auto rounded border bg-muted/30 p-2 text-[10px] leading-relaxed">
{JSON.stringify(pkg, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}
