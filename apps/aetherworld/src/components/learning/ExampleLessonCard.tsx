import type { ExampleLesson } from "@/lib/learning/exampleLessonEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";

export function ExampleLessonCard({ lesson }: { lesson: ExampleLesson }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          {lesson.title}
          <Badge variant="secondary" className="text-xs">{lesson.targetUserLevel}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-2 text-muted-foreground">
        <p>{lesson.scenario}</p>
        <div className="text-xs"><span>输入：</span><code className="bg-muted px-1 rounded">{lesson.inputText}</code></div>
        <div className="text-xs">期望：{lesson.expectedOutputSummary}</div>
        <div className="flex flex-wrap gap-2 text-xs">
          {lesson.engineRoute.map((r) => (
            <Link key={r} to={r} className="text-primary hover:underline">{r}</Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
