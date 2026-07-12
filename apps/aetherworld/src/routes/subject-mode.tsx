import { createFileRoute, Link } from "@tanstack/react-router";
import { SubjectModeSwitcher } from "@/components/subject/SubjectModeSwitcher";
import { SubjectProfileStatusCard } from "@/components/subject/SubjectProfileStatusCard";
import { Full60PrivacyNotice } from "@/components/subject/Full60PrivacyNotice";

export const Route = createFileRoute("/subject-mode")({
  head: () => ({
    meta: [
      { title: "主体模式 · Subject Mode" },
      { name: "description", content: "查看并切换当前主体模式：Demo / Light20 / Full60 / Founder。" },
    ],
  }),
  component: () => (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">主体模式</h1>
        <p className="text-sm text-muted-foreground">
          选择并持久化当前主体模式。所有核心引擎都会读取此模式作为生成依据。
        </p>
      </header>
      <SubjectProfileStatusCard />
      <section className="aether-card p-5 space-y-3">
        <h2 className="text-base font-semibold">切换主体模式</h2>
        <SubjectModeSwitcher />
      </section>
      <Full60PrivacyNotice />
      <div className="flex gap-2">
        <Link to="/real-subject-setup" className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">
          前往真实主体设置
        </Link>
        <Link to="/sequence-ai" className="rounded-md border border-border px-3 py-1.5 text-sm">
          返回 Sequence AI
        </Link>
      </div>
    </div>
  ),
});
