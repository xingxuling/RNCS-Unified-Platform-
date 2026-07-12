import { createFileRoute, Link } from "@tanstack/react-router";
import { WebXXMInstalledPanel } from "@/components/webxxm-store/WebXXMInstalledPanel";

export const Route = createFileRoute("/webxxm-installed")({
  head: () => ({ meta: [{ title: "已安装 WebXXM · Aetherworld" }] }),
  component: () => (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-4">
        <header className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Installed</div>
          <h1 className="text-2xl font-display">已安装能力模型</h1>
          <p className="text-sm text-muted-foreground">查看并管理已安装的 WebXXM。只有 ENABLED 能力包才能被 Sequence AI 调用。</p>
          <div className="text-[11px]">
            <Link to="/webxxm-store" className="text-muted-foreground hover:text-foreground">→ 前往商店</Link>
          </div>
        </header>
        <WebXXMInstalledPanel />
      </div>
    </div>
  ),
});
