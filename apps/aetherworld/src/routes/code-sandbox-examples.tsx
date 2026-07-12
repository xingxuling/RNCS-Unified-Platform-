import { createFileRoute, Link } from "@tanstack/react-router";
import { CODE_SANDBOX_EXAMPLES } from "@/lib/code-sandbox/codeSandboxExamplesRegistry";

export const Route = createFileRoute("/code-sandbox-examples")({
  head: () => ({ meta: [{ title: "Code Sandbox Examples · 代码沙箱示例" }, { name: "description", content: "8 个预置 Aether Code Sandbox Bridge 运行示例。" }] }),
  component: () => (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Code Sandbox Examples</div>
        <h1 className="font-display text-2xl gold-text">代码沙箱示例</h1>
        <p className="text-sm text-muted-foreground">前往 <Link to="/code-sandbox" className="text-primary underline">代码沙箱</Link> 复制示例 idea 试运行。</p>
      </header>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {CODE_SANDBOX_EXAMPLES.map(ex => (
          <li key={ex.id} className="border border-border/40 rounded p-3 space-y-1">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium">{ex.title}</div>
              <span className="text-[10px] uppercase text-muted-foreground">{ex.runnerMode}</span>
            </div>
            <div className="text-[11px] text-muted-foreground">{ex.description}</div>
            <div className="text-[11px] text-muted-foreground">想法：{ex.scenarioIdea}</div>
            <div className="text-[10px] text-muted-foreground">
              预期 status：<span className="font-mono">{ex.expectedStatus}</span>
              {ex.expectedErrorTypes.length > 0 && <> · 预期错误：{ex.expectedErrorTypes.join("、")}</>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  ),
});
