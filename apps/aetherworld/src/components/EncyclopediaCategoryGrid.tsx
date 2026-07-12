import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { ENCYCLOPEDIA_CATEGORIES } from "@/constants/encyclopediaCategories";
import { getAllEntries } from "@/lib/encyclopediaEngine";
import { useMemo } from "react";

export function EncyclopediaCategoryGrid({ beginner }: { beginner: boolean }) {
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of getAllEntries()) map.set(e.category, (map.get(e.category) ?? 0) + 1);
    return map;
  }, []);

  const cats = beginner
    ? ENCYCLOPEDIA_CATEGORIES.filter(c => c.beginnerVisible)
    : ENCYCLOPEDIA_CATEGORIES;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {cats.map(c => (
        <Link
          key={c.id}
          to="/encyclopedia"
          search={{ category: c.id } as never}
          className="block"
        >
          <Card className="p-4 hover:border-primary/50 transition-colors h-full">
            <div className="flex items-baseline justify-between">
              <h3 className="font-display text-base gold-text">{c.title}</h3>
              <span className="text-[10px] text-muted-foreground tracking-wider">{counts.get(c.id) ?? 0} 条</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-0.5">{c.en}</div>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{c.description}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
