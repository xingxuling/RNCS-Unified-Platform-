import { createFileRoute } from "@tanstack/react-router";
import { listTutorials } from "@/lib/learning/tutorialRegistry";
import { listPaths, expandPath } from "@/lib/learning/tutorialPathEngine";
import { TutorialPathCard } from "@/components/learning/TutorialPathCard";
import { TutorialStepCard } from "@/components/learning/TutorialStepCard";
import { DocsSafetyNote } from "@/components/learning/DocsSafetyNote";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/tutorials")({
  head: () => ({ meta: [{ title: "教程 · Tutorials" }, { name: "description", content: "Aetherworld 教程与学习路径。" }] }),
  component: TutorialsPage,
});

function TutorialsPage() {
  const paths = listPaths();
  const tutorials = listTutorials();
  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <header>
        <h1 className="text-2xl font-semibold">教程 · Tutorials</h1>
        <p className="text-sm text-muted-foreground mt-1">分层学习路径 + 完整教程注册表。</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">学习路径</h2>
        <div className="space-y-3">
          {paths.map((p) => {
            const expanded = expandPath(p.pathId);
            return (
              <Card key={p.pathId}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{p.chineseTitle} <span className="text-xs text-muted-foreground ml-2">{p.estimatedMinutes} 分钟</span></CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>{p.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {expanded?.tutorials.map((t: any) => t && <TutorialPathCard key={t.tutorialId} tutorial={t} />)}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">教程详情</h2>
        {tutorials.map((t) => (
          <Card key={t.tutorialId}>
            <CardHeader className="pb-2"><CardTitle className="text-base">{t.chineseTitle}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {t.steps.map((s, i) => <TutorialStepCard key={s.stepId} step={s} index={i} />)}
            </CardContent>
          </Card>
        ))}
      </section>

      <DocsSafetyNote />
    </div>
  );
}
