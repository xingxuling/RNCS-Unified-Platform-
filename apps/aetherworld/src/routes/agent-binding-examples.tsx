import { createFileRoute, Link } from "@tanstack/react-router";
import { listAgentBindingExamples } from "@/lib/agent-binding/agentBindingExamplesRegistry";

export const Route = createFileRoute("/agent-binding-examples")({
  head: () => ({ meta: [{ title: "Agent Binding Examples · Agent 绑定示例" }] }),
  component: function Page() {
    const examples = listAgentBindingExamples();
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-4">
        <header>
          <h1 className="font-display text-2xl gold-text">Agent 绑定示例</h1>
          <p className="text-sm text-muted-foreground">展示 App Builder / 代码沙箱 / 音乐 / 工作流 / Chatbot / RAG / 设计 / 游戏 / 部署 / QA Agent 的绑定结果。</p>
        </header>
        <div className="grid md:grid-cols-2 gap-3">
          {examples.map((e) => (
            <div key={e.id} className="aether-card p-3 text-xs space-y-1">
              <div className="font-medium">{e.title}</div>
              <div className="text-muted-foreground">{e.scenario}</div>
              <div><span className="text-muted-foreground">输出对象：</span>{e.expectedObjects.join("、") || "—"}</div>
              <Link to="/agent-binding-entry" search={{ id: e.bindingId }} className="text-primary hover:underline">查看绑定详情 →</Link>
            </div>
          ))}
        </div>
      </div>
    );
  },
});
