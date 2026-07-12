import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EncyclopediaEntry } from "@/constants/encyclopediaSeedEntries";
import { ENTRY_TYPE_COLORS, ENTRY_TYPE_LABELS } from "@/constants/encyclopediaEntryTypes";
import { EncyclopediaStatusBadge } from "./EncyclopediaStatusBadge";
import { getCategory } from "@/constants/encyclopediaCategories";

export function EncyclopediaEntryCard({ entry }: { entry: EncyclopediaEntry }) {
  const cat = getCategory(entry.category);
  return (
    <Link to="/encyclopedia-entry" search={{ id: entry.id } as never} className="block">
      <Card className="p-4 hover:border-primary/50 transition-colors h-full">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <Badge variant="outline" className={`text-[10px] ${ENTRY_TYPE_COLORS[entry.entryType]}`}>
            {ENTRY_TYPE_LABELS[entry.entryType]}
          </Badge>
          <EncyclopediaStatusBadge status={entry.status} />
          {cat && <span className="text-[10px] text-muted-foreground">{cat.title}</span>}
        </div>
        <h4 className="text-sm font-medium">{entry.title}</h4>
        {entry.aliases.length > 0 && (
          <div className="text-[10px] text-muted-foreground mt-0.5">别名：{entry.aliases.join(" / ")}</div>
        )}
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2">
          {entry.shortDefinition}
        </p>
      </Card>
    </Link>
  );
}
