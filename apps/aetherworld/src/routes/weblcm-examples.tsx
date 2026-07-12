import { createFileRoute, Link } from "@tanstack/react-router";
import { WEB_LCM_EXAMPLES } from "@/lib/weblcm/webLcmExamplesRegistry";

export const Route = createFileRoute("/weblcm-examples")({
  head: () => ({ meta: [{ title: "WebLCM Examples · WebLCM 示例" }, { name: "description", content: "12 个预置 Aether WebLCM 示例：从意图到概念链到 WebLLM 展开。" }] }),
  component: () => (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">WebLCM Examples · WebLCM 示例</h1>
        <p className="text-sm text-muted-foreground">{WEB_LCM_EXAMPLES.length} 个预置示例，涵盖意图、应用、错误、世界、角色、剧情、歌曲、计算法、常数与 WebLLM 展开。</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {WEB_LCM_EXAMPLES.map(ex => (
          <div key={ex.id} className="rounded border border-border/40 p-3 text-xs space-y-2">
            <div className="font-semibold">{ex.title}</div>
            <div className="text-muted-foreground">{ex.description}</div>
            <div className="text-[10px] text-muted-foreground">来源类型：{ex.sourceType}</div>
            <div className="rounded bg-muted/30 p-2 text-[11px]">{ex.sampleText}</div>
          </div>
        ))}
      </div>
      <div className="text-xs text-muted-foreground">
        在 <Link to="/weblcm-runtime" className="underline">WebLCM Runtime</Link> 页面可直接选择示例运行。
      </div>
    </div>
  ),
});
