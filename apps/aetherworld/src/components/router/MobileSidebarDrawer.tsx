/**
 * Mobile Sidebar Drawer
 * 在移动端通过 SidebarTrigger 自动打开抽屉式侧栏；
 * 这里提供一个轻量包装，主 sidebar 仍由 shadcn SidebarProvider 管控。
 */
import { useEffect, useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function MobileSidebarDrawer({ open, onClose, children }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <aside className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar border-r border-sidebar-border overflow-y-auto">
        {children}
      </aside>
    </div>
  );
}
