import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/subject/settings")({
  head: () => ({ meta: [{ title: "主体设置 · Aetherworld" }] }),
  component: SubjectSettingsPage,
});

const ITEMS = [
  { to: "/subject-mode", label: "主体模式", desc: "切换 Demo / Light20 / Full60 / Founder。" },
  { to: "/subject-sovereignty", label: "主体主权", desc: "数据归属、导出与销毁。" },
  { to: "/real-subject", label: "真实主体导入", desc: "导入 Light20 / Full60 数列。" },
  { to: "/real-subject-setup", label: "真实主体初始化", desc: "首次配置流程。" },
  { to: "/subject/light", label: "轻量主体", desc: "快捷偏好。" },
  { to: "/subject/real", label: "真实主体", desc: "长期方向与摘要。" },
] as const;

function SubjectSettingsPage() {
  return (
    <div className="p-6 md:p-10 space-y-4 max-w-2xl">
      <p className="text-xs text-muted-foreground">所有主体相关页面的入口。</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ITEMS.map((it) => (
          <Link
            key={it.to}
            to={it.to}
            className="aether-card p-4 hover:border-primary/40 transition"
          >
            <div className="text-sm font-medium">{it.label}</div>
            <div className="text-xs text-muted-foreground mt-1">{it.desc}</div>
          </Link>
        ))}
      </div>
      <Button asChild variant="ghost"><Link to="/subject">返回主体概览</Link></Button>
    </div>
  );
}
