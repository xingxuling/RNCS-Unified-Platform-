import { Card } from "@/components/ui/card";
import { getAllEntries } from "@/lib/encyclopediaEngine";
import { ENCYCLOPEDIA_CATEGORIES } from "@/constants/encyclopediaCategories";
import { useMemo } from "react";

// 概念图谱（轻量）：按分类聚合，显示每个分类中 top 概念与其 related 数量
export function EncyclopediaConceptGraph() {
  const groups = useMemo(() => {
    const all = getAllEntries();
    return ENCYCLOPEDIA_CATEGORIES.map(c => ({
      cat: c,
      items: all.filter(e => e.category === c.id).slice(0, 8),
    })).filter(g => g.items.length > 0);
  }, []);
  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-3">概念图谱 · Concept Graph（轻量视图）</h3>
      <div className="space-y-4">
        {groups.map(g => (
          <div key={g.cat.id}>
            <div className="text-[11px] tracking-wider text-primary mb-1">{g.cat.title} · {g.cat.en}</div>
            <div className="flex flex-wrap gap-2">
              {g.items.map(it => (
                <span key={it.id}
                  className="text-[11px] px-2 py-1 rounded border border-border/40 bg-card/40"
                  title={`相关：${it.relatedEntries.length} · 类型：${it.entryType}`}>
                  {it.title} · {it.relatedEntries.length}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-muted-foreground mt-3">
        提示：每个标签后的数字表示该条目的「显式相关」条目数。
      </div>
    </Card>
  );
}
