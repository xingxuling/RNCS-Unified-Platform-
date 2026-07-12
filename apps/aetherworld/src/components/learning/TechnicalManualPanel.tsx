import { buildTechnicalManual } from "@/lib/learning/technicalManualEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TechnicalManualPanel() {
  const sections = buildTechnicalManual();
  return (
    <div className="space-y-3">
      {sections.map((s) => (
        <Card key={s.id}>
          <CardHeader className="pb-2"><CardTitle className="text-base">{s.title}</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground whitespace-pre-wrap">{s.content}</CardContent>
        </Card>
      ))}
    </div>
  );
}
