import { createFileRoute } from "@tanstack/react-router";
import { RealWebLlmStatusBadge } from "@/components/real-webllm/RealWebLlmStatusBadge";
import { RealWebLlmLoadProgressPanel } from "@/components/real-webllm/RealWebLlmLoadProgressPanel";
import { RealWebLlmChatTestPanel } from "@/components/real-webllm/RealWebLlmChatTestPanel";

export const Route = createFileRoute("/real-webllm-test")({
  head: () => ({ meta: [{ title: "真实语言模型测试" }] }),
  component: Page,
});

function Page() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-5">
        <header className="space-y-1">
          <h1 className="text-2xl font-display">真实语言模型测试</h1>
          <p className="text-sm text-muted-foreground">在已加载的本地模型上进行流式测试。</p>
          <RealWebLlmStatusBadge />
        </header>
        <RealWebLlmLoadProgressPanel />
        <RealWebLlmChatTestPanel />
      </div>
    </div>
  );
}
