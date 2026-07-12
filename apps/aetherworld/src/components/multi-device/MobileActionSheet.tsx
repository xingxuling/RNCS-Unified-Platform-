import type { ReactNode } from "react";

export function MobileActionSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="md:hidden fixed inset-0 z-50">
      <button aria-label="关闭" className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute bottom-0 inset-x-0 bg-background border-t border-border/40 rounded-t-xl p-4" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {title && <div className="text-sm font-medium mb-3">{title}</div>}
        <div className="space-y-2">{children}</div>
        <button onClick={onClose} className="mt-4 w-full py-2 rounded-md border border-border/40 text-sm">取消</button>
      </div>
    </div>
  );
}
