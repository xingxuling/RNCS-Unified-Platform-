import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SOCIETY_COMPRESSION_TARGETS, compressSociety, type SocietyCompressionTarget, type SocietyCompressionResult } from "@/lib/sequence-world/society/societyCompressionEngine";
import type { WorldAgentSocietyResult } from "@/lib/sequence-world/society/worldAgentSocietyEngine";

export function SocietyCompressionPanel({ society }: { society: WorldAgentSocietyResult }) {
  const [result, setResult] = useState<SocietyCompressionResult | null>(society.societyCompression ?? null);
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">社会压缩 · Society Compression</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap gap-2">
          {SOCIETY_COMPRESSION_TARGETS.map(t => (
            <Button key={t} size="sm" variant="outline" onClick={() => setResult(compressSociety({
              target: t as SocietyCompressionTarget,
              agents: society.npcAgents, factions: society.factions,
              institutions: society.institutions, conflicts: society.socialConflicts,
              civilization: society.civilizationPhase,
            }))}>{t}</Button>
          ))}
        </div>
        {result && (
          <div className="rounded border p-3 text-xs">
            <div className="mb-1 font-medium">{result.compressionTarget}</div>
            <div className="text-muted-foreground">{result.summary}</div>
            <div className="mt-1">建议用途：{result.recommendedUse}</div>
            {result.archivedDetails.length > 0 && (
              <div className="mt-1 text-muted-foreground">归档：{result.archivedDetails.join("；")}</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
