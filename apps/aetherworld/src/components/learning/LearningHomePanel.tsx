import { Link } from "@tanstack/react-router";
import { getLearningSummary } from "@/lib/learning/learningDocsEngine";
import { recommendPaths } from "@/lib/learning/tutorialPathEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, GraduationCap, Code2, Crown } from "lucide-react";
import { USER_LEARNING_LEVELS } from "@/constants/learning/userLearningLevels";

const ENTRIES = [
  { level: "BEGINNER", icon: BookOpen, title: "我是新手", desc: "10 分钟从 Demo 到第一次提问。" },
  { level: "CREATOR", icon: GraduationCap, title: "我是创作者", desc: "世界 / 剧情 / 声乐 / 翻译 / 导出。" },
  { level: "BUILDER", icon: Code2, title: "我是开发者", desc: "模型 / Prompt / JSON / QA。" },
  { level: "FOUNDER", icon: Crown, title: "Founder", desc: "宪法 / 常数 / 全系统审计。" },
] as const;

export function LearningHomePanel() {
  const summary = getLearningSummary();
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {ENTRIES.map((e) => {
          const Icon = e.icon;
          const paths = recommendPaths(e.level as any);
          return (
            <Card key={e.level} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  {e.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>{e.desc}</p>
                {paths[0] ? (
                  <Link to="/tutorials" className="inline-block text-primary hover:underline text-xs">
                    进入「{paths[0].chineseTitle}」→
                  </Link>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">学习中心状态</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <Stat label="docsVersion" value={summary.docsVersion} />
          <Stat label="教程数" value={summary.totalTutorials} />
          <Stat label="模块文档" value={summary.totalModuleDocs} />
          <Stat label="FAQ" value={summary.totalFAQ} />
          <Stat label="术语" value={summary.totalGlossary} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">文档分类</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-sm">
          {[
            { to: "/tutorials", label: "快速开始 / 教程" },
            { to: "/module-docs", label: "模块文档" },
            { to: "/docs", label: "示例课程" },
            { to: "/faq", label: "FAQ" },
            { to: "/glossary", label: "术语表" },
            { to: "/technical-manual", label: "技术手册" },
            { to: "/docs-audit", label: "文档审计" },
          ].map((l) => (
            <Link key={l.to} to={l.to} className="px-3 py-1 rounded-md border border-border hover:border-primary/50">
              {l.label}
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">用户层级</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {USER_LEARNING_LEVELS.map((l) => (
            <Badge key={l.id} variant="outline">
              {l.chineseLabel} · {l.label}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
