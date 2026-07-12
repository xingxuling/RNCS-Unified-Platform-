import { listGlossary } from "@/lib/learning/glossaryDocEngine";
import { Card, CardContent } from "@/components/ui/card";

export function GlossaryPanel() {
  const terms = listGlossary();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {terms.map((t) => (
        <Card key={t.termId}>
          <CardContent className="pt-4 space-y-1">
            <div className="text-sm font-semibold">{t.term} <span className="text-muted-foreground ml-1">/ {t.chineseTerm}</span></div>
            <p className="text-sm text-muted-foreground">{t.plainDefinition}</p>
            {t.technicalDefinition && <p className="text-xs text-muted-foreground/70">{t.technicalDefinition}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
