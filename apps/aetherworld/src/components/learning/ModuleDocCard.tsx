import type { ModuleDoc } from "@/lib/learning/moduleDocGenerator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";

export function ModuleDocCard({ doc }: { doc: ModuleDoc }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span>{doc.chineseTitle} <span className="text-xs text-muted-foreground ml-2">{doc.title}</span></span>
          {doc.route && <Link to={doc.route} className="text-xs text-primary hover:underline">打开 →</Link>}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-2">
        <p className="text-muted-foreground">{doc.plainExplanation}</p>
        {doc.whenToUse.length > 0 && (
          <div className="text-xs">
            <span className="text-muted-foreground">何时使用：</span>
            {doc.whenToUse.join("；")}
          </div>
        )}
        {doc.whenNotToUse.length > 0 && (
          <div className="text-xs text-amber-500">
            <span>何时不使用：</span>{doc.whenNotToUse.join("；")}
          </div>
        )}
        {doc.safetyNotes.length > 0 && (
          <div className="text-xs">
            {doc.safetyNotes.map((s, i) => (
              <Badge key={i} variant="outline" className="mr-1 text-[10px]">{s}</Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
