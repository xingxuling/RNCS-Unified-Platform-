import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { resolveBacklinks, resolveCrossLinks } from "@/lib/encyclopediaCrossLinker";
import type { EncyclopediaEntry } from "@/constants/encyclopediaSeedEntries";

export function EncyclopediaRelatedLinks({ entry }: { entry: EncyclopediaEntry }) {
  const links = resolveCrossLinks(entry);
  const back = resolveBacklinks(entry.id);
  if (!links.length && !back.length) return null;
  return (
    <Card className="p-4">
      <h4 className="text-sm font-medium mb-3">相关条目</h4>
      {links.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {links.slice(0, 12).map(l => (
            <Link key={l.id} to="/encyclopedia-entry" search={{ id: l.id } as never}
              className="flex items-center justify-between text-xs hover:text-primary">
              <span>· {l.title}</span>
              <span className="text-[10px] text-muted-foreground">{l.reason}</span>
            </Link>
          ))}
        </div>
      )}
      {back.length > 0 && (
        <div>
          <div className="text-[10px] tracking-wider text-muted-foreground mb-1">被引用</div>
          <div className="flex flex-wrap gap-2">
            {back.slice(0, 8).map(b => (
              <Link key={b.id} to="/encyclopedia-entry" search={{ id: b.id } as never}
                className="text-[11px] underline-offset-2 hover:underline text-muted-foreground hover:text-foreground">
                {b.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
