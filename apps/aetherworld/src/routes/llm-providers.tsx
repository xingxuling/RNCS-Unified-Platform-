import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/llm-providers")({
  component: LlmProvidersLayout,
});

const TABS = [
  { to: "/llm-providers", label: "概览" },
  { to: "/llm-providers/settings", label: "设置" },
  { to: "/llm-providers/test", label: "测试" },
] as const;

function LlmProvidersLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-display tracking-wide">模型提供者</h1>
        <p className="text-sm text-muted-foreground">
          选择 Aetherworld 使用的语言模型来源。支持浏览器本地 WebLLM、本机 Ollama、本地 OpenAI 兼容接口与自定义接口。
        </p>
      </header>
      <nav className="flex gap-2 border-b">
        {TABS.map((t) => {
          const active = path === t.to;
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`px-3 py-2 text-sm border-b-2 -mb-px ${
                active ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      <Outlet />
    </div>
  );
}
