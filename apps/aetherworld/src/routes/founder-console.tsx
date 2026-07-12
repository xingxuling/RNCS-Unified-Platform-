import { createFileRoute } from "@tanstack/react-router";
import { FounderGate } from "@/components/FounderGate";
import { FounderConsolePanel } from "@/components/FounderConsolePanel";

export const Route = createFileRoute("/founder-console")({
  head: () => ({
    meta: [
      { title: "创始人控制台 · Founder Console" },
      { name: "description", content: "创始人模式的系统总览、受保护模块与高风险操作中心。" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: FounderConsoleRoute,
});

function FounderConsoleRoute() {
  return (
    <FounderGate>
      <div className="container mx-auto px-4 py-8">
        <FounderConsolePanel />
      </div>
    </FounderGate>
  );
}
