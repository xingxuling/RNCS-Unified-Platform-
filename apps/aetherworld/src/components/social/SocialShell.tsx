import { Link, useRouterState } from "@tanstack/react-router";
import { type ReactNode } from "react";

const TABS = [
  { to: "/social/feed", label: "动态" },
  { to: "/social/me", label: "我的主页" },
  { to: "/social/publish", label: "发布" },
  { to: "/social/collections", label: "收藏" },
  { to: "/social/settings", label: "设置" },
];

export function SocialShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-display tracking-wide">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </header>
      <nav className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => {
          const active = path === t.to || path.startsWith(t.to + "/");
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`px-3 py-2 text-sm -mb-px border-b-2 transition ${
                active ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      <div>{children}</div>
    </div>
  );
}
