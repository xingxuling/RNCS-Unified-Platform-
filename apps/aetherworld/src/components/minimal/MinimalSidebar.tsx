import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  MessageSquare,
  CalendarDays,
  LayoutGrid,
  FolderKanban,
  Boxes,
  Sparkles,
  Globe2,
  AppWindow,
  ShieldCheck,
  BookOpen,
  Settings,
  Menu,
  Users,
} from "lucide-react";
import { useFounderState } from "@/hooks/useFounderState";

const NAV_ITEMS = [
  { to: "/chat",              label: "对话",       icon: MessageSquare },
  { to: "/calendar",          label: "日历",       icon: CalendarDays },
  { to: "/store",             label: "商店",       icon: Sparkles },
  { to: "/workspace",         label: "工作区",     icon: LayoutGrid },
  { to: "/social",            label: "社交",       icon: Users },
  { to: "/worlds",            label: "世界",       icon: Globe2 },
  { to: "/web-world-runtime", label: "世界运行时", icon: Globe2 },
  { to: "/showcase",          label: "示例库",     icon: BookOpen },
  { to: "/system",            label: "系统",       icon: ShieldCheck },
  { to: "/docs",              label: "文档",       icon: BookOpen },
  { to: "/llm-providers",     label: "模型提供者", icon: Settings },
  { to: "/integrations/lovable", label: "Lovable 能力", icon: Sparkles },
  { to: "/projects",          label: "项目",       icon: FolderKanban },
  { to: "/objects",           label: "对象",       icon: Boxes },
  { to: "/apps",              label: "应用",       icon: AppWindow },
] as const;

export function MinimalSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => path === to || path.startsWith(to + "/");
  const founder = useFounderState();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-amber-400/80 to-amber-700/60 flex items-center justify-center text-[10px] font-bold text-background">A</div>
          <div className="font-display text-sm tracking-wide group-hover:text-foreground">Aetherworld</div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild isActive={isActive(item.to)}>
                    <Link to={item.to} className="flex items-center gap-2">
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={path.startsWith("/command-canvas")}>
                  <Link to="/command-canvas" className="flex items-center gap-2 text-muted-foreground">
                    <Menu className="w-4 h-4" />
                    <span>完整导航</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 py-3 border-t border-border/40">
        <div className="text-[10px] text-muted-foreground space-y-1">
          <div className="flex items-center justify-between">
            <span>v0.9 · Minimal</span>
            {founder.active && <span className="text-amber-400">Founder</span>}
          </div>
          <Link to="/founder" className="flex items-center gap-1 hover:text-foreground">
            <Settings className="w-3 h-3" /> 设置
          </Link>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
