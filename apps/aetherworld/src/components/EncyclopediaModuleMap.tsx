import { Card } from "@/components/ui/card";
import { getAllEntries } from "@/lib/encyclopediaEngine";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";

// 模块地图：列出所有 PAGE / MODULE 类条目及其挂载页面
export function EncyclopediaModuleMap() {
  const items = useMemo(
    () => getAllEntries().filter(e => e.entryType === "MODULE" || e.entryType === "PAGE"),
    [],
  );
  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-3">模块地图 · Module Map</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {items.map(it => (
          <Link key={it.id} to="/encyclopedia-entry" search={{ id: it.id } as never}
            className="rounded border border-border/40 p-2 hover:border-primary/50">
            <div className="text-sm font-medium">{it.title}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {it.whereItAppears.length > 0 ? it.whereItAppears.join(" · ") : "未挂载到具体页面"}
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
