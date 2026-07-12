import type { ReactNode } from "react";
import { MobileBottomNav } from "./MobileBottomNav";

export function MobileShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 min-w-0 flex flex-col pb-16">
      {children}
      <MobileBottomNav />
    </div>
  );
}
