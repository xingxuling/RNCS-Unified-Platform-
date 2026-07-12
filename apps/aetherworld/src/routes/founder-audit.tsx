import { createFileRoute } from "@tanstack/react-router";
import { FounderGate } from "@/components/FounderGate";
import { FounderAuditLogPanel } from "@/components/FounderAuditLogPanel";

export const Route = createFileRoute("/founder-audit")({
  head: () => ({
    meta: [
      { title: "创始人操作日志 · Founder Audit Log" },
      { name: "description", content: "查看创始人模式的本地操作日志。" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: () => (
    <FounderGate>
      <div className="container mx-auto px-4 py-8 space-y-4">
        <header>
          <h1 className="font-display text-2xl gold-text">创始人操作日志</h1>
          <p className="text-sm text-muted-foreground">Founder Audit Log · 本地操作审计记录。</p>
        </header>
        <FounderAuditLogPanel />
      </div>
    </FounderGate>
  ),
});
