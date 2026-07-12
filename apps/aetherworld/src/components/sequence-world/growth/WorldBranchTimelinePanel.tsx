import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadTimelines, createBranchFromSnapshot, archiveTimeline, exportTimeline, compareTimelines, type WorldBranchTimeline } from "@/lib/sequence-world/growth/worldBranchTimelineEngine";
import { GitBranch, Archive, Download, GitMerge } from "lucide-react";

export function WorldBranchTimelinePanel() {
  const [timelines, setTimelines] = useState<WorldBranchTimeline[]>(loadTimelines());
  const [name, setName] = useState("");
  const [a, setA] = useState(""); const [b, setB] = useState("");
  const [cmp, setCmp] = useState<any>(null);
  const refresh = () => setTimelines(loadTimelines());

  const create = () => {
    createBranchFromSnapshot({ worldId: "world-growth-sandbox", snapshotTick: 12, name: name || `手动分支-${Date.now().toString(36).slice(-4)}`, reason: "手动创建" });
    setName(""); refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <GitBranch className="size-5 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight">World Timelines · 世界时间线</h1>
        <Badge variant="outline">{timelines.length}</Badge>
      </div>
      <Card className="p-3 flex flex-wrap gap-2">
        <Input className="flex-1 min-w-48" placeholder="分支名称（可选）" value={name} onChange={e => setName(e.target.value)} />
        <Button onClick={create}>创建分支</Button>
      </Card>

      <Card className="p-3 space-y-2">
        <div className="text-xs text-muted-foreground">时间线比较</div>
        <div className="flex flex-wrap gap-2">
          <Input className="flex-1 min-w-40" placeholder="timelineId A" value={a} onChange={e => setA(e.target.value)} />
          <Input className="flex-1 min-w-40" placeholder="timelineId B" value={b} onChange={e => setB(e.target.value)} />
          <Button variant="outline" onClick={() => setCmp(compareTimelines(a, b))}><GitMerge className="size-4 mr-1" />比较</Button>
        </div>
        {cmp && <pre className="text-[11px] bg-muted/50 p-2 rounded overflow-auto">{JSON.stringify(cmp, null, 2)}</pre>}
      </Card>

      <div className="grid gap-2">
        {timelines.map(t => (
          <Card key={t.timelineId} className="p-3 space-y-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Badge>{t.currentPhase}</Badge>
                <span className="font-medium">{t.name}</span>
                <Badge variant="outline">{t.timelineId}</Badge>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => { archiveTimeline(t.timelineId); refresh(); }}>
                  <Archive className="size-3 mr-1" />归档
                </Button>
                <Button size="sm" variant="ghost" onClick={() => {
                  const blob = new Blob([exportTimeline(t.timelineId)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const aa = document.createElement("a"); aa.href = url; aa.download = `${t.timelineId}.json`; aa.click();
                  URL.revokeObjectURL(url);
                }}><Download className="size-3 mr-1" />导出</Button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">tick {t.branchPointTick} · {t.branchReason}</div>
          </Card>
        ))}
        {!timelines.length && <Card className="p-6 text-sm text-muted-foreground text-center">暂无分支时间线。</Card>}
      </div>
    </div>
  );
}
