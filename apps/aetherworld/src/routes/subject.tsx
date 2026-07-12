import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/subject")({
  head: () => ({ meta: [{ title: "主体 · Aetherworld" }] }),
  component: SubjectLayout,
});

const TABS = [
  { to: "/subject", label: "概览", exact: true },
  { to: "/subject/light", label: "轻量主体" },
  { to: "/subject/real", label: "真实主体" },
  { to: "/subject/settings", label: "主体设置" },
] as const;

function SubjectLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string, exact?: boolean) =>
    exact ? path === to : path === to || path.startsWith(to + "/");

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <PageHeader caption="Subject" title="主体" subtitle="管理你的偏好、长期方向与系统记忆摘要。" />
      <div className="px-6 md:px-10 border-b border-border/60 bg-background/40">
        <nav className="flex items-center gap-1 overflow-x-auto py-2">
          {TABS.map((t) => {
            const active = isActive(t.to, "exact" in t ? t.exact : false);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`px-3 py-1.5 rounded-md text-xs whitespace-nowrap transition ${
                  active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
