import type { ReactNode } from "react";
import { MobileBottomNav } from "./MobileBottomNav";

/**
 * 跨端界面映射法：单一壳层。
 * - 桌面/平板：依赖现有左侧 Sidebar（shadcn 自动折叠）。
 * - 手机：注入底部导航 + 给主体加底部 padding，保证不被遮挡。
 */
export function ResponsiveAppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="pb-16 md:pb-0">{children}</div>
      <MobileBottomNav />
    </>
  );
}
