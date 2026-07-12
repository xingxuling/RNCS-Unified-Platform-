import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { loadCanon, setCanonLevel, type WorldCanonEntry } from "@/lib/sequence-world/growth/worldCanonEngine";
import { WORLD_CANON_LEVELS, CANON_LEVEL_LABEL } from "@/constants/sequence-world/growth/worldCanonTypes";
import { useFounderState } from "@/hooks/useFounderState";
import { Lock } from "lucide-react";

export function WorldCanonPanel() {
  const { active: isFounder } = useFounderState();
  const [q, setQ] = useState("");
  const [entries, setEntries] = useState<WorldCanonEntry[]>(loadCanon());

  const filtered = entries.filter(e => !q || e.title.toLowerCase().includes(q.toLowerCase()) || e.summary.toLowerCase().includes(q.toLowerCase()));

  const refresh = () => setEntries(loadCanon());
  const onChangeLevel = (id: string, level: string) => {
    setCanonLevel(id, level as any, isFounder);
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">World Canon · 世界正典</h1>
        <Badge variant="outline">{entries.length} 条</Badge>
        {!isFounder && <Badge variant="secondary"><Lock className="size-3 mr-1" />Founder Locked 只读</Badge>}
      </div>
      <Card className="p-3 flex gap-2">
        <Input placeholder="搜索正典标题或摘要" value={q} onChange={e => setQ(e.target.value)} />
        <Button variant="outline" onClick={refresh}>刷新</Button>
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground text-center">
          暂无正典条目。请在 <strong>世界生长</strong> 中运行一次 Grow World 以自动草拟正典。
        </Card>
      ) : (
        <div className="grid gap-2">
          {filtered.map(e => (
            <Card key={e.id} className="p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge>{CANON_LEVEL_LABEL[e.canonLevel]}</Badge>
                  <Badge variant="outline">{e.entryType}</Badge>
                  <span className="font-medium truncate">{e.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={e.canonLevel} onValueChange={v => onChangeLevel(e.id, v)} disabled={e.canonLevel === "FOUNDER_LOCKED" && !isFounder}>
                    <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WORLD_CANON_LEVELS.map(l => (
                        <SelectItem key={l} value={l} disabled={l === "FOUNDER_LOCKED" && !isFounder}>{CANON_LEVEL_LABEL[l]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{e.summary}</p>
              <div className="text-[10px] text-muted-foreground">
                {e.knowledgeMarker} · {e.accessLevel} · 更新于 {new Date(e.updatedAt).toLocaleString()}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
