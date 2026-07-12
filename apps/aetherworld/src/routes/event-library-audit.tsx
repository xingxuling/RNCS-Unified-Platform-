import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { auditEventLibrary } from "@/lib/eventLibraryAudit";
import { EventLibraryHealthPanel } from "@/components/EventLibraryHealthPanel";
import { EventCoverageScorePanel } from "@/components/EventCoverageScorePanel";
import { EventGapMatrix } from "@/components/EventGapMatrix";
import { EventDuplicateClusterPanel } from "@/components/EventDuplicateClusterPanel";
import { EventCompletionBoard } from "@/components/EventCompletionBoard";
import { EventMergeSuggestionCard } from "@/components/EventMergeSuggestionCard";
import { EventLibraryAuditPanel } from "@/components/EventLibraryAuditPanel";
import { EventBulkCompletionPanel } from "@/components/EventBulkCompletionPanel";

export const Route = createFileRoute("/event-library-audit")({
  component: EventLibraryAuditPage,
});

function EventLibraryAuditPage() {
  const audit = useMemo(() => auditEventLibrary(), []);
  return (
    <>
      <PageHeader
        caption="Event Library Audit · 事件库查重补全 + 批量施工计算法"
        title="事件库审计 · 批量补全"
        subtitle="一次性扫描事件库：批量补字段、批量补维度、批量接入。不破坏已有 eventId，所有补齐由维度模板回填。"
      />
      <div className="p-6 md:p-10 space-y-6">
        <EventBulkCompletionPanel />
        <EventLibraryHealthPanel audit={audit} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <EventCoverageScorePanel audit={audit} />
          <EventMergeSuggestionCard suggestions={audit.mergeSuggestions} />
        </div>
        <EventGapMatrix gap={audit.gap} />
        <EventDuplicateClusterPanel
          clusters={audit.duplicateClusters}
          parentChild={audit.parentChildClusters}
        />
        <EventCompletionBoard reports={audit.completionReports} />
        <EventLibraryAuditPanel audit={audit} />
      </div>
    </>
  );
}

