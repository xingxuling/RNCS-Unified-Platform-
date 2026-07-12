import { createFileRoute } from "@tanstack/react-router";
import { WebCapabilityPanel } from "@/components/web-capability/WebCapabilityPanel";

export const Route = createFileRoute("/web-capabilities")({
  head: () => ({
    meta: [
      { title: "Web Capabilities · WebXX 能力模型群" },
      { name: "description", content: "Aether Web Human Capability Models v0.7：把代码、产品、设计、音乐、叙事、研究、商业、教学、运营、战略、游戏与 Agent 封装为浏览器本地能力模型。" },
    ],
  }),
  component: () => (
    <div className="max-w-7xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Aether Web Human Capability Models v0.7</h1>
        <p className="text-sm text-muted-foreground">
          WebXX 能力模型群：将人类常见工作技能封装为浏览器本地能力模型，统一接入 WebLKM、WebCM、WebCoM、WebLCM、WebLLM、QA、Workspace 与 System Constitution。
        </p>
      </header>
      <WebCapabilityPanel />
    </div>
  ),
});
