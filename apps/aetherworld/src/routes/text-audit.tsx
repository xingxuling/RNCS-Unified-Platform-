import { createFileRoute } from "@tanstack/react-router";
import { RouteBreadcrumb } from "@/components/router/RouteBreadcrumb";
import { TextAuditPanel } from "@/components/text-dynamic/TextAuditPanel";
import { TextSafetyNote } from "@/components/text-dynamic/TextSafetyNote";

export const Route = createFileRoute("/text-audit")({
  head: () => ({
    meta: [
      { title: "文本审计 — Text Audit" },
      { name: "description", content: "对应用文本执行安全、宪法、主体模式与金融化边界审计。" },
    ],
  }),
  component: TextAuditPage,
});

function TextAuditPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <RouteBreadcrumb />
      <header>
        <h1 className="text-2xl font-display gold-text">文本审计</h1>
        <p className="text-sm text-muted-foreground mt-1">Text Audit · 检查文本是否违反系统宪法、安全边界与受众规则。</p>
      </header>
      <TextSafetyNote />
      <TextAuditPanel />
    </div>
  );
}
