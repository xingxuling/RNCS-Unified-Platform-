import { createFileRoute } from "@tanstack/react-router";
import { RouteBreadcrumb } from "@/components/router/RouteBreadcrumb";
import { TermRelationGraph } from "@/components/vocabulary/TermRelationGraph";
import { TermAliasPanel } from "@/components/vocabulary/TermAliasPanel";

export const Route = createFileRoute("/vocabulary-relations")({
  head: () => ({ meta: [{ title: "词汇关系 — Vocabulary Relations" }] }),
  component: () => (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <RouteBreadcrumb />
      <header>
        <h1 className="text-2xl font-display gold-text">词汇关系</h1>
        <p className="text-sm text-muted-foreground mt-1">查看术语之间的依赖、派生、对照与“不能混淆”关系。</p>
      </header>
      <TermRelationGraph />
      <TermAliasPanel />
    </div>
  ),
});
