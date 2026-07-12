import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createVersion, loadVersions, rollbackVersion, tagVersion } from "@/lib/sequence-world/growth/worldVersioningEngine";
import { GitCommit } from "lucide-react";

export function WorldVersionPanel() {
  const [versions, setVersions] = useState(loadVersions());
  const [summary, setSummary] = useState("");
  const refresh = () => setVersions(loadVersions());
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <GitCommit className="size-4" />
        <span className="font-medium">World Versions · {versions.length}</span>
      </div>
      <div className="flex gap-2">
        <Input placeholder="版本摘要" value={summary} onChange={e => setSummary(e.target.value)} />
        <Button onClick={() => { createVersion({ worldId: "world-growth-sandbox", summary: summary || "手动版本" }); setSummary(""); refresh(); }}>创建版本</Button>
      </div>
      <ul className="text-xs space-y-1">
        {versions.map(v => (
          <li key={v.versionId} className="flex items-center justify-between border rounded px-2 py-1">
            <div className="flex items-center gap-2">
              <Badge>{v.version}</Badge>
              <span>{v.summary}</span>
              {v.tag && <Badge variant="outline">{v.tag}</Badge>}
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => { const t = prompt("Tag?"); if (t) { tagVersion(v.versionId, t); refresh(); } }}>Tag</Button>
              <Button size="sm" variant="ghost" onClick={() => { rollbackVersion(v.versionId); refresh(); }}>回滚</Button>
            </div>
          </li>
        ))}
        {!versions.length && <li className="text-muted-foreground">暂无版本</li>}
      </ul>
    </Card>
  );
}
