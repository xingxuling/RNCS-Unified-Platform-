import type { GeneratedModelSchema } from "@/lib/model-generation/modelSchemaBuilder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function GeneratedModelSchemaView({ schema }: { schema: GeneratedModelSchema }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          {schema.modelName}
          <Badge variant="secondary">{schema.modelType}</Badge>
          <Badge variant="outline">v{schema.version}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="text-muted-foreground">{schema.description}</div>
        <div className="flex flex-wrap gap-1">
          {schema.exportTargets.map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
        </div>
        <div className="text-xs text-muted-foreground">Model ID：<span className="font-mono">{schema.modelId}</span></div>
      </CardContent>
    </Card>
  );
}
