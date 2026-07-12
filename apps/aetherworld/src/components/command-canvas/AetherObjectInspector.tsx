import { useMemo, useState } from "react";
import { INSPECTOR_TABS, INSPECTOR_TAB_LABELS, type InspectorTabId } from "@/constants/command-canvas/inspectorTabTypes";
import { buildInspectorViewModel } from "@/lib/command-canvas/objectInspectorEngine";
import { resolveCanvasObject } from "@/lib/command-canvas/canvasObjectResolver";

interface Props { objectId?: string; }

export function AetherObjectInspector({ objectId }: Props) {
  const obj = resolveCanvasObject(objectId);
  const vm = useMemo(() => buildInspectorViewModel(obj), [obj]);
  const [tab, setTab] = useState<InspectorTabId>("OVERVIEW");

  if (!vm) {
    return (
      <div className="rounded-lg border border-border/50 bg-card/30 p-4 text-xs text-muted-foreground">
        对象检查器：暂无对象。
      </div>
    );
  }

  const current = vm.tabs.find((t) => t.id === tab);

  return (
    <div className="flex h-full flex-col rounded-lg border border-border/50 bg-card/30">
      <div className="border-b border-border/40 p-3">
        <h2 className="text-sm font-medium">对象检查器</h2>
        <div className="mt-0.5 text-[11px] text-muted-foreground">
          {vm.objectType} · {vm.objectId}
        </div>
      </div>
      <div className="flex flex-wrap gap-1 border-b border-border/30 px-2 py-2">
        {INSPECTOR_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded px-2 py-1 text-[11px] ${
              t === tab ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {INSPECTOR_TAB_LABELS[t]}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-3 text-xs text-foreground/80">
        {current?.summary ?? "—"}
      </div>
    </div>
  );
}
