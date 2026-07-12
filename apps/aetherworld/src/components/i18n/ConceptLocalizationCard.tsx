import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConceptLocalizationResult } from "@/lib/i18n/conceptLocalizationEngine";

export function ConceptLocalizationCard({ result }: { result: ConceptLocalizationResult }) {
  return (
    <Card className="p-4 space-y-2 aether-card-elevated">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">{result.recommendedUIName}</div>
          <div className="text-xs text-muted-foreground">原始：{result.originalConcept}</div>
        </div>
        {result.fallbackUsed && <Badge variant="outline">fallback</Badge>}
      </div>
      <div className="text-xs"><span className="text-muted-foreground mr-1">普通：</span>{result.plainExplanation}</div>
      <div className="text-xs"><span className="text-muted-foreground mr-1">高阶：</span>{result.advancedExplanation}</div>
      <div className="text-xs"><span className="text-muted-foreground mr-1">Founder：</span>{result.founderExplanation}</div>
      {result.avoidWording.length > 0 && (
        <div className="text-[10px] text-amber-500">避用：{result.avoidWording.join("，")}</div>
      )}
    </Card>
  );
}
