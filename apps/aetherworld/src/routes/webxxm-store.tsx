import { createFileRoute, Link } from "@tanstack/react-router";
import { WebXXMStorePanel } from "@/components/webxxm-store/WebXXMStorePanel";

export const Route = createFileRoute("/webxxm-store")({
  head: () => ({ meta: [{ title: "WebXXM Store · 能力模型商店" }] }),
  component: StorePage,
});

function StorePage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <header className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">WebXXM Store</div>
          <h1 className="text-2xl font-display">能力商店</h1>
          <p className="text-sm text-muted-foreground">
            下载、安装并启用需要的能力模型。只有已启用的能力模型，平台才能调用。
          </p>
          <div className="text-[11px]">
            <Link to="/webxxm-installed" className="text-muted-foreground hover:text-foreground">→ 已安装能力模型</Link>
          </div>
        </header>
        <WebXXMStorePanel />
      </div>
    </div>
  );
}
