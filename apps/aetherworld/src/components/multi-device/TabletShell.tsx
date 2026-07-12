import type { ReactNode } from "react";

export function TabletShell({ children }: { children: ReactNode }) {
  return <div className="flex-1 min-w-0 flex flex-col">{children}</div>;
}
