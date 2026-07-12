import type { TutorialDefinition } from "@/constants/learning/lessonTemplates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";

export function TutorialPathCard({ tutorial }: { tutorial: TutorialDefinition }) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          {tutorial.chineseTitle}
          <Badge variant="secondary" className="text-xs">{tutorial.level}</Badge>
          <Badge variant="outline" className="text-xs">{tutorial.type}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-2">
        <div className="text-xs">预计 {tutorial.estimatedMinutes} 分钟 · {tutorial.steps.length} 步</div>
        <div className="flex flex-wrap gap-1">
          {tutorial.targetModules.map((m) => (
            <Badge key={m} variant="outline" className="text-[10px]">{m}</Badge>
          ))}
        </div>
        {tutorial.routeLinks.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs">
            {tutorial.routeLinks.slice(0, 3).map((r) => (
              <Link key={r} to={r} className="text-primary hover:underline">{r}</Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
