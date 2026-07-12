import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { loadAssets, ASSET_SAFETY_NOTE } from "@/lib/sequence-world/growth/worldAssetRegistry";
import { Database, ShieldAlert } from "lucide-react";

export function WorldAssetRegistryPanel() {
  const [q, setQ] = useState("");
  const assets = loadAssets().filter(a => !q || a.name.toLowerCase().includes(q.toLowerCase()) || a.assetType.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Database className="size-5 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight">World Assets · 世界资产</h1>
        <Badge variant="outline">{assets.length}</Badge>
      </div>
      <Card className="p-3 border-amber-500/40 bg-amber-500/5 text-xs flex gap-2">
        <ShieldAlert className="size-4 text-amber-500 shrink-0" />
        <span>{ASSET_SAFETY_NOTE}</span>
      </Card>
      <Card className="p-3">
        <Input placeholder="搜索资产名称或类型" value={q} onChange={e => setQ(e.target.value)} />
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {assets.map(a => (
          <Card key={a.assetId} className="p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-medium truncate">{a.name}</span>
              <Badge>{a.assetType}</Badge>
            </div>
            <div className="text-xs text-muted-foreground line-clamp-2">{a.summary}</div>
            <div className="flex flex-wrap gap-1 text-[10px] text-muted-foreground">
              <Badge variant="outline">价值 {a.valueScore}</Badge>
              <Badge variant="outline">{a.canonLevel}</Badge>
              {a.reusable && <Badge variant="secondary">可复用</Badge>}
              {a.exportable && <Badge variant="secondary">可导出</Badge>}
            </div>
          </Card>
        ))}
        {!assets.length && <Card className="p-6 text-sm text-muted-foreground text-center col-span-full">暂无世界资产。请运行一次 World Growth。</Card>}
      </div>
    </div>
  );
}
