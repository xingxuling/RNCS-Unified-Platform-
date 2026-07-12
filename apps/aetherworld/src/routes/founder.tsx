import { createFileRoute } from "@tanstack/react-router";
import { FounderGate } from "@/components/FounderGate";
import { FounderAuditLogPanel } from "@/components/FounderAuditLogPanel";
import { FounderConsolePanel } from "@/components/FounderConsolePanel";

export const Route = createFileRoute("/founder")({
  head: () => ({
    meta: [
      { title: "创始人模式 · Founder Gate" },
      { name: "description", content: "创始人模式本地入口与操作日志。" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: FounderPage,
});

function FounderPage() {
  return (
    <FounderGate>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <FounderConsolePanel />
        <FounderAuditLogPanel />
      </div>
    </FounderGate>
  );
}
