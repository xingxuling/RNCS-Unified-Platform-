import { Link } from "@tanstack/react-router";

export function AetherQuickActions() {
  const actions = [
    { label: "新建 App", to: "/app-project-entry" },
    { label: "运行能力", to: "/web-capability-run" },
    { label: "知识三体", to: "/web-knowledge-trinity" },
    { label: "概念图谱", to: "/weblcm-concept-graph" },
    { label: "系统审计", to: "/system-audit" },
    { label: "版本跃迁", to: "/version-leap" },
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {actions.map((a) => (
        <Link
          key={a.to}
          to={a.to}
          className="rounded-md border border-border/40 bg-background/40 px-2 py-1 text-[11px] hover:border-primary/40"
        >
          {a.label}
        </Link>
      ))}
    </div>
  );
}
