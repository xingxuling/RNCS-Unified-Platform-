import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { CreateTriggerDialog } from "@/components/trigger-calendar/CreateTriggerDialog";

export const Route = createFileRoute("/calendar")({
  head: () => ({ meta: [{ title: "触发日历 · Aetherworld" }] }),
  component: CalendarLayout,
});

const TABS = [
  { to: "/calendar", label: "今天", exact: true },
  { to: "/calendar/today", label: "今日日程" },
  { to: "/calendar/triggers", label: "触发规则" },
  { to: "/calendar/tasks", label: "任务" },
  { to: "/calendar/heatmap", label: "热力图" },
  { to: "/calendar/settings", label: "日历设置" },
] as const;

function CalendarLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string, exact?: boolean) =>
    exact ? path === to : path === to || path.startsWith(to + "/");

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <PageHeader
        caption="Trigger Calendar"
        title="触发日历"
        subtitle="管理任务、提醒和系统触发。"
        actions={<CreateTriggerDialog />}
      />
      <div className="px-6 md:px-10 border-b border-border/60 bg-background/40">
        <nav className="flex items-center gap-1 overflow-x-auto -mx-1 px-1 py-2">
          {TABS.map((t) => {
            const active = isActive(t.to, "exact" in t ? t.exact : false);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`px-3 py-1.5 rounded-md text-xs whitespace-nowrap transition ${
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
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
