import { createFileRoute, Link } from "@tanstack/react-router";
import { APP_RUNTIME_EXAMPLES } from "@/lib/app-runtime/appExamplesRegistry";
import { APP_TYPE_LABELS } from "@/constants/app-runtime/appTypes";

export const Route = createFileRoute("/app-runtime-examples")({
  head: () => ({ meta: [{ title: "App Runtime Examples · 应用运行时示例" }, { name: "description", content: "10 个预置 Aether App Runtime 应用示例。" }] }),
  component: () => (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">App Runtime Examples</div>
        <h1 className="font-display text-2xl gold-text">应用运行时示例</h1>
        <p className="text-sm text-muted-foreground">前往 <Link to="/app-runtime" className="text-primary underline">应用运行时</Link> 选择任一示例并直接生成。</p>
      </header>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {APP_RUNTIME_EXAMPLES.map(ex => (
          <li key={ex.id} className="border border-border/40 rounded p-3 space-y-1">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium">{ex.title}</div>
              <span className="text-[10px] uppercase text-muted-foreground">{APP_TYPE_LABELS[ex.appType]?.en}</span>
            </div>
            <div className="text-[11px] text-muted-foreground">{ex.rawIdea}</div>
            <div className="text-[11px] text-muted-foreground">MVP：{ex.mvp.join("、")}</div>
          </li>
        ))}
      </ul>
    </div>
  ),
});
