import { createFileRoute } from "@tanstack/react-router";
import { RouteBreadcrumb } from "@/components/router/RouteBreadcrumb";
import { TermAuditPanel } from "@/components/vocabulary/TermAuditPanel";
import { TermExportPanel } from "@/components/vocabulary/TermExportPanel";
import { VocabularySafetyNote } from "@/components/vocabulary/VocabularySafetyNote";

export const Route = createFileRoute("/vocabulary-audit")({
  head: () => ({ meta: [{ title: "词汇审计 — Vocabulary Audit" }] }),
  component: () => (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <RouteBreadcrumb />
      <header>
        <h1 className="text-2xl font-display gold-text">词汇审计</h1>
        <p className="text-sm text-muted-foreground mt-1">扫描词汇定义是否越过安全边界、是否把虚构概念写成现实事实。</p>
      </header>
      <TermAuditPanel />
      <TermExportPanel />
      <VocabularySafetyNote />
    </div>
  ),
});
