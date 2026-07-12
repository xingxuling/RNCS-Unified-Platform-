import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { AETHER_MOBILE_TABS } from "@/config/aetherNavigationDomains";
import { MobileCreateSheet } from "@/components/layout/MobileCreateSheet";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <nav
        aria-label="底部导航"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/40 bg-background/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="grid grid-cols-5 items-end">
          {AETHER_MOBILE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isCenter = tab.action === "OPEN_CREATE_SHEET";
            const active = tab.to ? path === tab.to || path.startsWith(tab.to + "/") : false;

            if (isCenter) {
              return (
                <li key={tab.id} className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    aria-label="创建"
                    className="-mt-5 w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-background shadow-lg flex flex-col items-center justify-center"
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                </li>
              );
            }

            return (
              <li key={tab.id}>
                <Link
                  to={tab.to!}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px]",
                    active ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <MobileCreateSheet open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
