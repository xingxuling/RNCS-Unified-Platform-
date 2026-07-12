import { createFileRoute, Link } from "@tanstack/react-router";
import { listCanvasObjects } from "@/lib/command-canvas/canvasObjectResolver";

export const Route = createFileRoute("/objects")({
  head: () => ({ meta: [{ title: "对象 · Aetherworld" }] }),
  component: ObjectsPage,
});

function ObjectsPage() {
  const items = listCanvasObjects();
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-4">
        <header className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Objects</div>
          <h1 className="text-2xl font-display">对象</h1>
          <p className="text-sm text-muted-foreground">通过指令创建的画布对象集合。</p>
        </header>
        <div className="aether-card divide-y divide-border/40">
          {items.length === 0 && (
            <div className="p-6 text-xs text-muted-foreground text-center">暂无对象。在底部输入指令开始。</div>
          )}
          {items.map((o) => (
            <Link key={o.id} to="/object-inspector" className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30">
              <div className="min-w-0">
                <div className="text-sm truncate">{o.title}</div>
                <div className="text-[11px] text-muted-foreground truncate">{o.type} · {o.source ?? "—"}</div>
              </div>
              <div className="text-[10px] text-muted-foreground shrink-0">
                {new Date(o.createdAt).toLocaleString("zh-CN")}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
