import { useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Menu, Layers, PanelRight } from "lucide-react";
import { PrimaryDomainRail } from "@/components/layout/PrimaryDomainRail";
import { SecondaryDomainNav } from "@/components/layout/SecondaryDomainNav";
import { AetherContextPanel } from "@/components/layout/AetherContextPanel";
import { MobileBottomNav } from "@/components/multi-device/MobileBottomNav";
import { SubjectModeBadge } from "@/components/subject/SubjectModeBadge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { findDomainByPath } from "@/config/aetherNavigationDomains";

interface Props {
  children: React.ReactNode;
}

export function AetherResponsiveShell({ children }: Props) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const currentDomain = findDomainByPath(path);

  const [secondaryCollapsed, setSecondaryCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);

  return (
    <div className="min-h-screen flex w-full relative z-10 bg-background text-foreground">
      {/* 桌面/平板：左主栏（>= md） */}
      <PrimaryDomainRail />

      {/* 桌面：左次栏（>= lg，可折叠） */}
      {!secondaryCollapsed && (
        <div className="hidden lg:flex w-[230px] shrink-0 border-r border-border/40">
          <SecondaryDomainNav />
        </div>
      )}

      {/* 主区 */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* 顶部条 */}
        <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-border/40 bg-background/80 backdrop-blur px-3 py-2">
          {/* 移动：打开域导航抽屉 */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="md:hidden p-2 rounded-md hover:bg-muted/40"
            aria-label="打开导航"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* 平板：打开二级导航 Sheet */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="hidden md:inline-flex lg:hidden p-2 rounded-md hover:bg-muted/40"
            aria-label="打开二级导航"
            title="二级导航"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* 桌面：折叠左次栏 */}
          <button
            type="button"
            onClick={() => setSecondaryCollapsed((v) => !v)}
            className="hidden lg:inline-flex p-2 rounded-md hover:bg-muted/40 text-muted-foreground"
            aria-label="切换二级导航"
            title="切换二级导航"
          >
            <Layers className="w-4 h-4" />
          </button>

          <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            Aetherworld
          </div>
          {currentDomain && (
            <>
              <span className="text-muted-foreground/40">/</span>
              <div className="text-xs text-muted-foreground truncate">{currentDomain.label}</div>
            </>
          )}

          <div className="ml-auto flex items-center gap-2">
            <SubjectModeBadge />
            {/* 移动/平板：打开右上下文 Sheet */}
            <button
              type="button"
              onClick={() => setContextOpen(true)}
              className="xl:hidden p-2 rounded-md hover:bg-muted/40 text-muted-foreground"
              aria-label="上下文"
              title="上下文"
            >
              <PanelRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0 overflow-x-hidden pb-20 md:pb-0">
          {children}
        </div>
      </main>

      {/* 桌面（>= xl）：右上下文栏 */}
      <AetherContextPanel />

      {/* 手机底部 5-Tab */}
      <MobileBottomNav />

      {/* 移动/平板：二级导航 Sheet */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="p-0 w-[280px] border-border/40">
          <div className="flex h-full">
            <div className="lg:hidden">
              <PrimaryDomainRail />
            </div>
            <div className="flex-1 min-w-0">
              <SecondaryDomainNav onNavigate={() => setMobileNavOpen(false)} />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* 移动/平板：右上下文 Sheet */}
      <Sheet open={contextOpen} onOpenChange={setContextOpen}>
        <SheetContent side="right" className="p-0 w-[320px] border-border/40">
          <AetherContextPanel embedded />
        </SheetContent>
      </Sheet>
    </div>
  );
}
