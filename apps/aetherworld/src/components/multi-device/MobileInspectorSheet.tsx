import type { ReactNode } from "react";
import { INSPECTOR_MOBILE_TABS } from "@/lib/multi-device/responsiveInspectorMapper";
import { useState } from "react";

export function MobileInspectorSheet({
  open,
  onClose,
  panels,
}: {
  open: boolean;
  onClose: () => void;
  panels?: Partial<Record<(typeof INSPECTOR_MOBILE_TABS)[number], ReactNode>>;
}) {
  const [tab, setTab] = useState<(typeof INSPECTOR_MOBILE_TABS)[number]>("概览");
  if (!open) return null;
  return (
    <div className="md:hidden fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
        <div className="text-sm font-medium">检查面板</div>
        <button onClick={onClose} className="text-xs text-muted-foreground">关闭</button>
      </div>
      <div className="flex gap-1 overflow-x-auto px-3 py-2 border-b border-border/40">
        {INSPECTOR_MOBILE_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${tab === t ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-3 text-sm">{panels?.[tab] ?? <div className="text-muted-foreground">暂无内容</div>}</div>
    </div>
  );
}
